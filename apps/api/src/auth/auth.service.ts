import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleName, Visibility } from '@prisma/client';
import type { ApiEnv } from '@voxora/config';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { OWNER_BOOTSTRAP_COMPLETION_ID, safeEqualSecret } from './crypto.util';
import { MfaService } from '../mfa/mfa.service';
import { VerificationService } from '../verification/verification.service';
import { OnboardingService } from '../onboarding/onboarding.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly rbac: RbacService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<ApiEnv, true>,
    @Inject(forwardRef(() => MfaService)) private readonly mfa: MfaService,
    private readonly verification: VerificationService,
    @Inject(forwardRef(() => OnboardingService)) private readonly onboarding: OnboardingService,
  ) {}

  async register(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      // Keep Conflict for explicit duplicate registration attempts; rate-limited at controller.
      throw new ConflictException('Account already exists for this email');
    }

    const passwordHash = await this.passwords.hash(password);
    const user = await this.prisma.user.create({
      data: {
        email: normalized,
        passwordHash,
        identities: {
          create: { type: 'password', provider: 'local', subject: normalized },
        },
        profile: {
          create: {
            emailVisibility: Visibility.PRIVATE,
            phoneVisibility: Visibility.PRIVATE,
          },
        },
      },
    });

    await this.rbac.assignRole({ userId: user.id, role: RoleName.USER });
    await this.onboarding.ensureStarted(user.id);
    const delivery = await this.verification.requestEmailVerification(user.id);
    await this.audit.record({
      actorId: user.id,
      action: 'auth.register',
      subject: user.id,
      payload: { email: normalized, emailDeliveryStatus: delivery.deliveryStatus },
    });

    const session = await this.issueSessionForUser(user.id);
    return {
      status: 'authenticated' as const,
      ...session,
      emailDeliveryStatus: delivery.deliveryStatus,
      ...(delivery.deliveryStatus === 'DEV_CAPTURED' && 'devVerificationToken' in delivery
        ? { devVerificationToken: delivery.devVerificationToken }
        : {}),
    };
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.passwords.verify(user.passwordHash, password);
    if (!valid) {
      await this.audit.record({
        action: 'auth.login_failed',
        subject: normalized,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const gate = await this.mfa.beginPrivilegedLoginGate(user.id);
    if (gate.gate === 'enrollment') {
      return {
        status: 'mfa_enrollment_required' as const,
        enrollmentToken: gate.enrollmentToken,
        expiresInSeconds: gate.expiresInSeconds,
      };
    }
    if (gate.gate === 'challenge') {
      return {
        status: 'mfa_required' as const,
        challengeToken: gate.challengeToken,
        expiresInSeconds: gate.expiresInSeconds,
      };
    }

    await this.audit.record({
      actorId: user.id,
      action: 'auth.login',
      subject: user.id,
    });

    const session = await this.issueSessionForUser(user.id);
    return { status: 'authenticated' as const, ...session };
  }

  async refresh(refreshToken: string) {
    const hash = this.tokens.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: hash, revokedAt: null },
    });
    if (!session || session.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const next = await this.issueSessionForUser(session.userId);
    return { status: 'authenticated' as const, ...next };
  }

  async logout(refreshToken: string) {
    const hash = this.tokens.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshTokenHash: hash, revokedAt: null },
    });
    if (session) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
      await this.audit.record({
        actorId: session.userId,
        action: 'auth.logout',
        subject: session.id,
      });
    }
    return { status: 'ok' as const };
  }

  async verifyEmail(token: string) {
    return this.verification.confirmEmailVerificationPublic(token);
  }

  /**
   * Genuine one-time Owner bootstrap.
   * Requires configured identity + secret + registered user.
   * Email alone or token alone never grants Owner.
   * Completion is persisted in DB and survives restarts.
   * Bootstrap secrets are never returned in responses or audit payloads.
   */
  async bootstrapOwner(email: string, bootstrapToken: string) {
    const configuredEmail = process.env.OWNER_BOOTSTRAP_EMAIL;
    const configuredToken = process.env.OWNER_BOOTSTRAP_TOKEN;
    const normalizedEmail = email.trim().toLowerCase();

    if (!configuredEmail || !configuredToken || configuredToken.length < 16) {
      throw new BadRequestException('Owner bootstrap is not configured');
    }

    if (await this.isOwnerBootstrapComplete()) {
      await this.audit.record({
        action: 'owner.bootstrap_rejected_already_complete',
        subject: normalizedEmail,
        payload: { reason: 'bootstrap_already_completed' },
      });
      throw new ConflictException('Owner bootstrap has already been completed');
    }

    if (await this.hasActiveOwnerAssignment()) {
      await this.audit.record({
        action: 'owner.bootstrap_rejected_owner_exists',
        subject: normalizedEmail,
        payload: { reason: 'active_owner_exists' },
      });
      throw new ConflictException('An Owner already exists');
    }

    const emailMatches = safeEqualSecret(normalizedEmail, configuredEmail.trim().toLowerCase());
    const tokenMatches = safeEqualSecret(bootstrapToken, configuredToken);

    if (!emailMatches || !tokenMatches) {
      await this.audit.record({
        action: 'owner.bootstrap_rejected',
        subject: normalizedEmail,
        payload: { reason: 'identity_or_secret_mismatch' },
      });
      throw new UnauthorizedException('Bootstrap rejected');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      await this.audit.record({
        action: 'owner.bootstrap_rejected',
        subject: normalizedEmail,
        payload: { reason: 'user_not_registered' },
      });
      throw new BadRequestException('User must register before owner bootstrap');
    }

    try {
      await this.prisma.ownerBootstrapCompletion.create({
        data: {
          id: OWNER_BOOTSTRAP_COMPLETION_ID,
          ownerUserId: user.id,
          completedAt: new Date(),
        },
      });
    } catch {
      await this.audit.record({
        action: 'owner.bootstrap_rejected_already_complete',
        subject: normalizedEmail,
        payload: { reason: 'bootstrap_race_or_duplicate' },
      });
      throw new ConflictException('Owner bootstrap has already been completed');
    }

    await this.rbac.assignRole({
      userId: user.id,
      role: RoleName.OWNER,
      assignedBy: 'system:bootstrap',
    });
    await this.audit.record({
      actorId: user.id,
      action: 'owner.bootstrap_assigned',
      subject: user.id,
      payload: { via: 'one_time_bootstrap' },
    });

    return { status: 'owner_assigned' as const, userId: user.id };
  }

  async isOwnerBootstrapComplete(): Promise<boolean> {
    const row = await this.prisma.ownerBootstrapCompletion.findUnique({
      where: { id: OWNER_BOOTSTRAP_COMPLETION_ID },
    });
    return Boolean(row);
  }

  async hasActiveOwnerAssignment(): Promise<boolean> {
    const count = await this.prisma.roleAssignment.count({
      where: {
        revokedAt: null,
        role: { name: RoleName.OWNER },
      },
    });
    return count > 0;
  }

  async issueSessionForUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const roles = await this.rbac.getUserRoles(userId);
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      roles,
    });
    const refresh = this.tokens.createRefreshToken();
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: refresh.hash,
        expiresAt: refresh.expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        emailVerified: Boolean(user.emailVerifiedAt),
        roles,
        mfaEnabled: user.mfaEnabled,
      },
      tokens: {
        accessToken,
        refreshToken: refresh.token,
        tokenType: 'Bearer' as const,
        expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
      },
    };
  }
}
