import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { VerificationModule } from '../verification/verification.module';
import { CatalogueModule } from '../catalogue/catalogue.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [VerificationModule, CatalogueModule, EntitlementsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
