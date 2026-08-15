import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hashOpaque, safeEqualHex } from '../../common/opaque-token.util';
import type {
  PhoneOtpRequest,
  PhoneOtpRequestResult,
  PhoneOtpVerifyRequest,
  PhoneOtpVerifyResult,
  PhoneVerificationProvider,
} from './phone-verification.provider';

/**
 * Development/test phone OTP transport.
 * Does not claim a production SMS vendor. Never logs OTP plaintext.
 */
@Injectable()
export class DevCapturePhoneProvider implements PhoneVerificationProvider {
  readonly name = 'dev';

  constructor(private readonly prisma: PrismaService) {}

  async requestOtp(request: PhoneOtpRequest): Promise<PhoneOtpRequestResult> {
    const artifact = await this.prisma.devDeliveryArtifact.create({
      data: {
        channel: 'phone',
        purpose: request.purpose,
        userId: request.userId,
        payload: {
          phoneE164: request.phoneE164,
          otpHash: hashOpaque(request.otp),
        },
      },
    });
    return { status: 'DEV_CAPTURED', providerRef: artifact.id };
  }

  async verifyOtp(request: PhoneOtpVerifyRequest): Promise<PhoneOtpVerifyResult> {
    if (!request.providerRef) {
      return { status: 'INVALID' };
    }
    const artifact = await this.prisma.devDeliveryArtifact.findUnique({
      where: { id: request.providerRef },
    });
    if (!artifact || artifact.userId !== request.userId || artifact.channel !== 'phone') {
      return { status: 'INVALID' };
    }
    const payload = artifact.payload as { otpHash?: string; phoneE164?: string };
    if (!payload.otpHash || payload.phoneE164 !== request.phoneE164) {
      return { status: 'INVALID' };
    }
    const presented = hashOpaque(request.otp);
    if (!safeEqualHex(presented, payload.otpHash)) {
      return { status: 'INVALID' };
    }
    return { status: 'VERIFIED' };
  }
}
