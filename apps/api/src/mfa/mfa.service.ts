import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ApiEnv } from '@voxora/config';
import { isPrivilegedRole, type RoleName as ContractRole } from '@voxora/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RbacService } from '../rbac/rbac.service';
import { TokenService } from '../auth/token.service';
import { generateOpaqueToken, hashOpaque } from '../common/opaque-token.util';
import { decryptSecret, encryptSecret } from '../common/secret-crypto.util';
import { buildOtpAuthUri, generateTotpSecret, verifyTotp } from './totp.util';

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const MAX_CHALLENGE_ATTEMPTS = 5;

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly rbac: RbacService,
    private readonly tokens: TokenService,
    private readonly config: ConfigService<ApiEnv, true>,
  ) {}

  async beginPrivilegedLoginGate(userId: string) {
    const roles = await this.rbac.getUserRoles(userId);
    const privileged = roles.some((r) => isPrivilegedRole(r as ContractRole));
    if (!privileged) {
      return { gate: 'none' as const };
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.mfaEnabled) {
      const enrollmentToken = await this.createChallenge(userId, 'mfa_enrollment');
      await this.audit.record({
        actorId: userId,
        action: 'mfa.enrollment_required',
        subject: userId,
        payload: { roles },
      });
      return {
        gate: 'enrollment' as const,
        enrollmentToken,
        expiresInSeconds: CHALLENGE_TTL_MS / 1000,
      };
    }

    const challengeToken = await this.createChallenge(userId, 'mfa_challenge');
    await this.audit.record({
      actorId: userId,
      action: 'mfa.challenge_required',
      subject: userId,
      payload: { roles },
    });
    return {
      gate: 'challenge' as const,
      challengeToken,
      expiresInSeconds: CHALLENGE_TTL_MS / 1000,
    };
  }

  async startEnrollment(enrollmentToken: string) {
    const challenge = await this.consumeChallengeToken(enrollmentToken, 'mfa_enrollment', false);
    const secret = generateTotpSecret();
    const encKey = this.requireEncryptionKey();
    const secretEnc = encryptSecret(secret, encKey);

    await this.prisma.mfaFactor.updateMany({
      where: { userId: challenge.userId, type: 'totp', enabled: false },
      data: { disabledAt: new Date() },
    });

    const factor = await this.prisma.mfaFactor.create({
      data: {
        userId: challenge.userId,
        type: 'totp',
        secretEnc,
        enabled: false,
      },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: challenge.userId } });
    await this.audit.record({
      actorId: challenge.userId,
      action: 'mfa.enrollment_started',
      subject: factor.id,
      // Never include secret in audit payload.
      payload: { type: 'totp' },
    });

    return {
      factorId: factor.id,
      otpauthUri: buildOtpAuthUri({ secret, accountName: user.email, issuer: 'Voxora' }),
      // Secret returned once for authenticator enrollment only — never logged.
      secret,
      enrollmentToken,
    };
  }

  async confirmEnrollment(enrollmentToken: string, code: string) {
    const challenge = await this.consumeChallengeToken(enrollmentToken, 'mfa_enrollment', false);
    const factor = await this.prisma.mfaFactor.findFirst({
      where: {
        userId: challenge.userId,
        type: 'totp',
        enabled: false,
        disabledAt: null,
        secretEnc: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!factor?.secretEnc) {
      throw new BadRequestException('MFA enrollment not started');
    }

    const secret = decryptSecret(factor.secretEnc, this.requireEncryptionKey());
    const result = verifyTotp(secret, code, { lastUsedStep: factor.lastUsedStep });
    if (!result.valid || result.step == null) {
      await this.audit.record({
        actorId: challenge.userId,
        action: 'mfa.enrollment_failed',
        subject: factor.id,
      });
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.$transaction([
      this.prisma.mfaFactor.update({
        where: { id: factor.id },
        data: {
          enabled: true,
          verifiedAt: new Date(),
          lastUsedStep: result.step,
        },
      }),
      this.prisma.user.update({
        where: { id: challenge.userId },
        data: { mfaEnabled: true },
      }),
      this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      actorId: challenge.userId,
      action: 'mfa.enabled',
      subject: factor.id,
      payload: { type: 'totp' },
    });

    // After enrollment, require a fresh challenge before privileged session.
    const next = await this.createChallenge(challenge.userId, 'mfa_challenge');
    return {
      status: 'mfa_enabled' as const,
      challengeToken: next,
      expiresInSeconds: CHALLENGE_TTL_MS / 1000,
    };
  }

  async verifyChallenge(challengeToken: string, code: string) {
    const challenge = await this.consumeChallengeToken(challengeToken, 'mfa_challenge', false);
    if (challenge.attemptCount >= MAX_CHALLENGE_ATTEMPTS) {
      throw new ForbiddenException('MFA attempts exceeded');
    }

    await this.prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: { increment: 1 } },
    });

    const factor = await this.prisma.mfaFactor.findFirst({
      where: {
        userId: challenge.userId,
        type: 'totp',
        enabled: true,
        disabledAt: null,
        secretEnc: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!factor?.secretEnc) {
      throw new BadRequestException('MFA is not enabled');
    }

    const secret = decryptSecret(factor.secretEnc, this.requireEncryptionKey());
    const result = verifyTotp(secret, code, { lastUsedStep: factor.lastUsedStep });
    if (!result.valid || result.step == null) {
      await this.audit.record({
        actorId: challenge.userId,
        action: 'mfa.challenge_failed',
        subject: factor.id,
      });
      throw new UnauthorizedException('Invalid MFA code');
    }

    await this.prisma.$transaction([
      this.prisma.mfaFactor.update({
        where: { id: factor.id },
        data: { lastUsedStep: result.step },
      }),
      this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      actorId: challenge.userId,
      action: 'mfa.challenge_success',
      subject: factor.id,
    });

    return { userId: challenge.userId };
  }

  /**
   * Privileged MFA reset — requires an already MFA-authenticated privileged actor
   * or a dedicated secure process. Phase 2: OWNER can reset another privileged user
   * via audited admin path; self-reset requires valid current TOTP.
   */
  async resetFactor(actorId: string, targetUserId: string, currentCode?: string) {
    const actorRoles = await this.rbac.getUserRoles(actorId);
    const isOwner = actorRoles.includes('OWNER');
    if (actorId !== targetUserId && !isOwner) {
      throw new ForbiddenException('MFA reset not permitted');
    }

    if (actorId === targetUserId) {
      if (!currentCode) {
        throw new BadRequestException('Current MFA code required for self-reset');
      }
      const factor = await this.prisma.mfaFactor.findFirst({
        where: { userId: targetUserId, type: 'totp', enabled: true, secretEnc: { not: null } },
      });
      if (!factor?.secretEnc) {
        throw new BadRequestException('MFA is not enabled');
      }
      const secret = decryptSecret(factor.secretEnc, this.requireEncryptionKey());
      const result = verifyTotp(secret, currentCode, { lastUsedStep: factor.lastUsedStep });
      if (!result.valid) {
        await this.audit.record({
          actorId,
          action: 'mfa.reset_failed',
          subject: targetUserId,
        });
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    await this.prisma.$transaction([
      this.prisma.mfaFactor.updateMany({
        where: { userId: targetUserId, enabled: true },
        data: { enabled: false, disabledAt: new Date(), secretEnc: null },
      }),
      this.prisma.user.update({
        where: { id: targetUserId },
        data: { mfaEnabled: false },
      }),
    ]);

    // Privileged sessions must not remain usable as if MFA were still satisfied.
    await this.rbac.revokeAllSessionsForUser(targetUserId, 'mfa_reset');

    await this.audit.record({
      actorId,
      action: 'mfa.reset',
      subject: targetUserId,
      payload: {
        by: actorId === targetUserId ? 'self' : 'owner',
        sessionsRevoked: true,
      },
    });

    return { status: 'mfa_reset' as const };
  }

  private async createChallenge(userId: string, purpose: string) {
    const token = generateOpaqueToken(32);
    await this.prisma.mfaChallenge.create({
      data: {
        userId,
        purpose,
        tokenHash: hashOpaque(token),
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      },
    });
    return token;
  }

  private async consumeChallengeToken(token: string, purpose: string, markConsumed: boolean) {
    const challenge = await this.prisma.mfaChallenge.findFirst({
      where: {
        tokenHash: hashOpaque(token),
        purpose,
        consumedAt: null,
      },
    });
    if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired MFA token');
    }
    if (markConsumed) {
      await this.prisma.mfaChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
    }
    return challenge;
  }

  private requireEncryptionKey(): string {
    const key =
      this.config.get('MFA_ENCRYPTION_KEY', { infer: true }) ??
      this.config.get('JWT_ACCESS_SECRET', { infer: true });
    if (!key || key.length < 32) {
      throw new BadRequestException('MFA encryption key is not configured');
    }
    return key;
  }
}
