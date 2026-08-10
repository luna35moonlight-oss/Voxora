import { Injectable } from '@nestjs/common';
import type {
  PhoneOtpRequest,
  PhoneOtpRequestResult,
  PhoneOtpVerifyRequest,
  PhoneOtpVerifyResult,
  PhoneVerificationProvider,
} from './phone-verification.provider';

@Injectable()
export class NotConfiguredPhoneProvider implements PhoneVerificationProvider {
  readonly name = 'none';

  async requestOtp(_request: PhoneOtpRequest): Promise<PhoneOtpRequestResult> {
    return { status: 'NOT_CONFIGURED' };
  }

  async verifyOtp(_request: PhoneOtpVerifyRequest): Promise<PhoneOtpVerifyResult> {
    return { status: 'NOT_CONFIGURED' };
  }
}
