import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  EMAIL_DELIVERY_PROVIDER,
  type EmailDeliveryProvider,
} from '../providers/email/email-delivery.provider';
import {
  PHONE_VERIFICATION_PROVIDER,
  type PhoneVerificationProvider,
} from '../providers/phone/phone-verification.provider';
import { generateOpaqueToken, hashDestination, hashOpaque } from '../common/opaque-token.util';

const EMAIL_TTL_MS = 24 * 60 * 60 * 1000;
const PHONE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(EMAIL_DELIVERY_PROVIDER) private readonly email: EmailDeliveryProvider,
    @Inject(PHONE_VERIFICATION_PROVIDER) private readonly phone: PhoneVerificationProvider,
  ) {}

  async requestEmailVerification(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.emailVerifiedAt) {
      return { status: 'already_verified' as const, deliveryStatus: 'ACCEPTED' as const };
    }

    const latest = await this.prisma.verificationRecord.findFirst({
      where: { userId, purpose: 'email_verification', usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (latest?.lastResendAt && Date.now() - latest.lastResendAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new BadRequestException('Please wait before requesting another verification email');
    }

    // Invalidate previous unused tokens.
    await this.prisma.verificationRecord.updateMany({
      where: { userId, purpose: 'email_verification', usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = generateOpaqueToken(32);
    const record = await this.prisma.verificationRecord.create({
      data: {
        userId,
        channel: 'email',
        purpose: 'email_verification',
        tokenHash: hashOpaque(token),
        destinationHash: hashDestination(user.email),
        expiresAt: new Date(Date.now() + EMAIL_TTL_MS),
        lastResendAt: new Date(),
      },
    });

    const delivery = await this.email.send({
      to: user.email,
      subject: 'Verify your Voxora email',
      bodyText: 'Use your verification token to confirm your email address.',
      purpose: 'email_verification',
      userId,
      verificationToken: token,
    });

    if (delivery.status === 'ACCEPTED' || delivery.status === 'DEV_CAPTURED') {
      await this.prisma.verificationRecord.update({
        where: { id: record.id },
        data: { providerRef: delivery.providerRef },
      });
    }

    await this.audit.record({
      actorId: userId,
      action: 'verification.email_requested',
      subject: userId,
      payload: { deliveryStatus: delivery.status, provider: this.email.name },
    });

    // Never claim Sent unless a provider accepted/captured.
    return {
      status: 'requested' as const,
      deliveryStatus: delivery.status,
      // Dev-only convenience for automated tests when using isolated capture transport.
      ...(delivery.status === 'DEV_CAPTURED' ? { devVerificationToken: token } : {}),
    };
  }

  async confirmEmailVerification(userId: string, token: string) {
    const hash = hashOpaque(token);
    const record = await this.prisma.verificationRecord.findFirst({
      where: {
        userId,
        tokenHash: hash,
        purpose: 'email_verification',
        usedAt: null,
      },
    });

    if (!record) {
      await this.bumpFailedAttempt(userId, 'email_verification');
      throw new BadRequestException('Invalid or expired verification token');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    if (record.attemptCount >= MAX_ATTEMPTS) {
      throw new BadRequestException('Verification attempts exceeded');
    }

    await this.prisma.$transaction([
      this.prisma.verificationRecord.update({
        where: { id: record.id },
        data: { usedAt: new Date(), attemptCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      actorId: userId,
      action: 'auth.email_verified',
      subject: userId,
    });

    return { status: 'verified' as const };
  }

  /** Public token verify (email link style) — still single-use hashed token. */
  async confirmEmailVerificationPublic(token: string) {
    const hash = hashOpaque(token);
    const record = await this.prisma.verificationRecord.findFirst({
      where: { tokenHash: hash, purpose: 'email_verification', usedAt: null },
    });
    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    if (record.attemptCount >= MAX_ATTEMPTS) {
      throw new BadRequestException('Verification attempts exceeded');
    }
    return this.confirmEmailVerification(record.userId, token);
  }

  async requestPhoneOtp(userId: string, phoneE164: string) {
    const latest = await this.prisma.verificationRecord.findFirst({
      where: { userId, purpose: 'phone_otp', usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (latest?.lastResendAt && Date.now() - latest.lastResendAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new BadRequestException('Please wait before requesting another OTP');
    }

    await this.prisma.verificationRecord.updateMany({
      where: { userId, purpose: 'phone_otp', usedAt: null },
      data: { usedAt: new Date() },
    });

    const otp = String(randomInt(100000, 999999));
    const record = await this.prisma.verificationRecord.create({
      data: {
        userId,
        channel: 'phone',
        purpose: 'phone_otp',
        tokenHash: hashOpaque(otp),
        destinationHash: hashDestination(phoneE164),
        expiresAt: new Date(Date.now() + PHONE_TTL_MS),
        lastResendAt: new Date(),
      },
    });

    const delivery = await this.phone.requestOtp({
      phoneE164,
      userId,
      purpose: 'phone_otp',
      otp,
    });

    if (delivery.status === 'ACCEPTED' || delivery.status === 'DEV_CAPTURED') {
      await this.prisma.verificationRecord.update({
        where: { id: record.id },
        data: { providerRef: delivery.providerRef },
      });
    }

    await this.audit.record({
      actorId: userId,
      action: 'verification.phone_otp_requested',
      subject: userId,
      payload: { deliveryStatus: delivery.status, provider: this.phone.name },
    });

    return {
      status: 'requested' as const,
      deliveryStatus: delivery.status,
      // Isolated test helper — not a production SMS claim.
      ...(delivery.status === 'DEV_CAPTURED' ? { devOtp: otp } : {}),
    };
  }

  async confirmPhoneOtp(userId: string, phoneE164: string, code: string) {
    const record = await this.prisma.verificationRecord.findFirst({
      where: { userId, purpose: 'phone_otp', usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    if (record.attemptCount >= MAX_ATTEMPTS) {
      throw new BadRequestException('OTP attempts exceeded');
    }

    await this.prisma.verificationRecord.update({
      where: { id: record.id },
      data: { attemptCount: { increment: 1 } },
    });

    const providerResult = await this.phone.verifyOtp({
      phoneE164,
      userId,
      otp: code,
      providerRef: record.providerRef,
    });

    if (providerResult.status === 'NOT_CONFIGURED') {
      throw new BadRequestException('Phone verification provider is not configured');
    }
    if (providerResult.status !== 'VERIFIED') {
      await this.audit.record({
        actorId: userId,
        action: 'verification.phone_otp_failed',
        subject: userId,
      });
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Replay protection: mark used only after genuine success.
    await this.prisma.$transaction([
      this.prisma.verificationRecord.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.userProfile.update({
        where: { userId },
        data: { phoneVerifiedAt: new Date(), phoneE164 },
      }),
    ]);

    await this.audit.record({
      actorId: userId,
      action: 'verification.phone_verified',
      subject: userId,
    });

    return { status: 'verified' as const };
  }

  private async bumpFailedAttempt(userId: string, purpose: string) {
    const latest = await this.prisma.verificationRecord.findFirst({
      where: { userId, purpose, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (latest) {
      await this.prisma.verificationRecord.update({
        where: { id: latest.id },
        data: { attemptCount: { increment: 1 } },
      });
    }
  }
}
