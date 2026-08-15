import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  AgeGateSchema,
  ConsentGrantSchema,
  OtpVerifySchema,
  PhoneRequestSchema,
  PrivacyUpdateSchema,
  ProviderInterestsSchema,
  RegionLocaleSchema,
  SetUsernameRequestSchema,
  SubscriptionSelectSchema,
} from '@voxora/contracts';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { OnboardingService } from './onboarding.service';

const EmailVerifySchema = z.object({ token: z.string().min(1) });

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get('state')
  state(@Req() req: AuthenticatedRequest) {
    return this.onboarding.getState(req.user!.userId);
  }

  @Post('email/request')
  @HttpCode(200)
  @Throttle({ default: { limit: process.env.NODE_ENV === 'test' ? 10_000 : 5, ttl: 60_000 } })
  requestEmail(@Req() req: AuthenticatedRequest) {
    return this.onboarding.requestEmailVerification(req.user!.userId);
  }

  @Post('email/confirm')
  @HttpCode(200)
  confirmEmail(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(EmailVerifySchema)) body: unknown,
  ) {
    const data = EmailVerifySchema.parse(body);
    return this.onboarding.confirmEmailVerification(req.user!.userId, data.token);
  }

  @Post('username')
  @HttpCode(200)
  setUsername(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(SetUsernameRequestSchema)) body: unknown,
  ) {
    const data = SetUsernameRequestSchema.parse(body);
    return this.onboarding.setUsername(req.user!.userId, data.username);
  }

  @Post('privacy')
  @HttpCode(200)
  setPrivacy(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(PrivacyUpdateSchema)) body: unknown,
  ) {
    const data = PrivacyUpdateSchema.parse(body);
    return this.onboarding.setPrivacy(req.user!.userId, data);
  }

  @Post('region-locale')
  @HttpCode(200)
  setRegion(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(RegionLocaleSchema)) body: unknown,
  ) {
    const data = RegionLocaleSchema.parse(body);
    return this.onboarding.setRegionLocale(req.user!.userId, data);
  }

  @Post('phone')
  @HttpCode(200)
  setPhone(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(PhoneRequestSchema)) body: unknown,
  ) {
    const data = PhoneRequestSchema.parse(body);
    return this.onboarding.setPhone(req.user!.userId, data.phone, data.defaultCountry);
  }

  @Post('phone/otp/request')
  @HttpCode(200)
  @Throttle({ default: { limit: process.env.NODE_ENV === 'test' ? 10_000 : 5, ttl: 60_000 } })
  requestOtp(@Req() req: AuthenticatedRequest) {
    return this.onboarding.requestPhoneOtp(req.user!.userId);
  }

  @Post('phone/otp/confirm')
  @HttpCode(200)
  @Throttle({ default: { limit: process.env.NODE_ENV === 'test' ? 10_000 : 10, ttl: 60_000 } })
  confirmOtp(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(OtpVerifySchema)) body: unknown,
  ) {
    const data = OtpVerifySchema.parse(body);
    return this.onboarding.confirmPhoneOtp(req.user!.userId, data.code);
  }

  @Post('interests')
  @HttpCode(200)
  setInterests(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(ProviderInterestsSchema)) body: unknown,
  ) {
    const data = ProviderInterestsSchema.parse(body);
    return this.onboarding.setProviderInterests(req.user!.userId, data.providers);
  }

  @Post('age-gate')
  @HttpCode(200)
  ageGate(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(AgeGateSchema)) body: unknown,
  ) {
    const data = AgeGateSchema.parse(body);
    return this.onboarding.confirmAgeGate(req.user!.userId, data.ruleVersion);
  }

  @Post('consents')
  @HttpCode(200)
  consents(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(ConsentGrantSchema)) body: unknown,
  ) {
    const data = ConsentGrantSchema.parse(body);
    return this.onboarding.grantConsents(req.user!.userId, data.consents);
  }

  @Post('subscription')
  @HttpCode(200)
  subscription(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(SubscriptionSelectSchema)) body: unknown,
  ) {
    const data = SubscriptionSelectSchema.parse(body);
    return this.onboarding.selectSubscription(req.user!.userId, data.productCode, data.storefront);
  }
}
