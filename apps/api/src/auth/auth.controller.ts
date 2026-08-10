import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LoginRequestSchema, RefreshRequestSchema, RegisterRequestSchema } from '@voxora/contracts';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { z } from 'zod';

const VerifyEmailSchema = z.object({ token: z.string().min(1) });
const BootstrapOwnerSchema = z.object({
  email: z.string().email(),
  bootstrapToken: z.string().min(16),
});

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  register(@Body(new ZodValidationPipe(RegisterRequestSchema)) body: unknown) {
    const data = RegisterRequestSchema.parse(body);
    return this.auth.register(data.email, data.password);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  login(@Body(new ZodValidationPipe(LoginRequestSchema)) body: unknown) {
    const data = LoginRequestSchema.parse(body);
    return this.auth.login(data.email, data.password);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body(new ZodValidationPipe(RefreshRequestSchema)) body: unknown) {
    const data = RefreshRequestSchema.parse(body);
    return this.auth.refresh(data.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Body(new ZodValidationPipe(RefreshRequestSchema)) body: unknown) {
    const data = RefreshRequestSchema.parse(body);
    return this.auth.logout(data.refreshToken);
  }

  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body(new ZodValidationPipe(VerifyEmailSchema)) body: unknown) {
    const data = VerifyEmailSchema.parse(body);
    return this.auth.verifyEmail(data.token);
  }

  @Post('bootstrap-owner')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  bootstrapOwner(@Body(new ZodValidationPipe(BootstrapOwnerSchema)) body: unknown) {
    const data = BootstrapOwnerSchema.parse(body);
    return this.auth.bootstrapOwner(data.email, data.bootstrapToken);
  }
}
