export type PhoneOtpRequest = {
  phoneE164: string;
  userId: string;
  purpose: string;
  /** OTP plaintext — providers must never log this. */
  otp: string;
};

export type PhoneOtpRequestResult =
  | { status: 'NOT_CONFIGURED' }
  | { status: 'ACCEPTED'; providerRef: string }
  | { status: 'DEV_CAPTURED'; providerRef: string }
  | { status: 'FAILED'; reason: string };

export type PhoneOtpVerifyRequest = {
  phoneE164: string;
  userId: string;
  otp: string;
  providerRef?: string | null;
};

export type PhoneOtpVerifyResult =
  | { status: 'NOT_CONFIGURED' }
  | { status: 'VERIFIED' }
  | { status: 'INVALID' }
  | { status: 'FAILED'; reason: string };

export interface PhoneVerificationProvider {
  readonly name: string;
  requestOtp(request: PhoneOtpRequest): Promise<PhoneOtpRequestResult>;
  verifyOtp(request: PhoneOtpVerifyRequest): Promise<PhoneOtpVerifyResult>;
}

export const PHONE_VERIFICATION_PROVIDER = Symbol('PHONE_VERIFICATION_PROVIDER');
