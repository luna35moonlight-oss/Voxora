import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { OnboardingModule } from '../onboarding/onboarding.module';

@Module({
  imports: [EntitlementsModule, OnboardingModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
