import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordService } from './password.service';
import { MfaModule } from '../mfa/mfa.module';
import { VerificationModule } from '../verification/verification.module';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [VerificationModule, forwardRef(() => MfaModule), forwardRef(() => OnboardingModule)],
  controllers: [AuthController],
  providers: [AuthService, PasswordService],
  exports: [AuthService],
})
export class AuthModule {}
