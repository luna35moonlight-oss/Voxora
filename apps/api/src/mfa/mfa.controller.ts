import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  Req,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MfaConfirmEnrollmentSchema, MfaVerifySchema } from '@voxora/contracts';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { AuthService } from '../auth/auth.service';
import { MfaService } from './mfa.service';

const EnrollmentStartSchema = z.object({
  enrollmentToken: z.string().min(1),
});

const ResetSchema = z.object({
  targetUserId: z.string().uuid().optional(),
  currentCode: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
});

@Controller('mfa')
export class MfaController {
  constructor(
    private readonly mfa: MfaService,
    @Inject(forwardRef(() => AuthService)) private readonly auth: AuthService,
  ) {}

  @Post('enroll/start')
  @HttpCode(200)
  @Throttle({ default: { limit: process.env.NODE_ENV === 'test' ? 10_000 : 10, ttl: 60_000 } })
  startEnrollment(@Body(new ZodValidationPipe(EnrollmentStartSchema)) body: unknown) {
    const data = EnrollmentStartSchema.parse(body);
    return this.mfa.startEnrollment(data.enrollmentToken);
  }

  @Post('enroll/confirm')
  @HttpCode(200)
  @Throttle({ default: { limit: process.env.NODE_ENV === 'test' ? 10_000 : 10, ttl: 60_000 } })
  async confirmEnrollment(@Body(new ZodValidationPipe(MfaConfirmEnrollmentSchema)) body: unknown) {
    const data = MfaConfirmEnrollmentSchema.parse(body);
    return this.mfa.confirmEnrollment(data.enrollmentToken, data.code);
  }

  @Post('challenge/verify')
  @HttpCode(200)
  @Throttle({ default: { limit: process.env.NODE_ENV === 'test' ? 10_000 : 20, ttl: 60_000 } })
  async verifyChallenge(@Body(new ZodValidationPipe(MfaVerifySchema)) body: unknown) {
    const data = MfaVerifySchema.parse(body);
    if (!data.challengeToken) {
      throw new BadRequestException('challengeToken required');
    }
    const verified = await this.mfa.verifyChallenge(data.challengeToken, data.code);
    // Privileged session only after successful MFA — server sets assurance; never from client.
    const session = await this.auth.issueSessionForUser(verified.userId, { mfaAssured: true });
    return { status: 'authenticated' as const, ...session };
  }

  @Post('reset')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  reset(@Req() req: AuthenticatedRequest, @Body(new ZodValidationPipe(ResetSchema)) body: unknown) {
    const data = ResetSchema.parse(body);
    const target = data.targetUserId ?? req.user!.userId;
    return this.mfa.resetFactor(req.user!.userId, target, data.currentCode);
  }
}
