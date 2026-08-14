import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthCoreModule } from './auth/auth-core.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { JobsModule } from './jobs/jobs.module';
import { UsersModule } from './users/users.module';
import { ProvidersModule } from './providers/providers.module';
import { VerificationModule } from './verification/verification.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { CatalogueModule } from './catalogue/catalogue.module';
import { EntitlementsModule } from './entitlements/entitlements.module';
import { StoreModule } from './store/store.module';
import { MfaModule } from './mfa/mfa.module';
import { SettingsModule } from './settings/settings.module';
import { GamesModule } from './games/games.module';
import { validateEnv } from './config/validate-env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      ignoreEnvFile: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: process.env.NODE_ENV === 'test' ? 10_000 : 100,
      },
    ]),
    PrismaModule,
    AuthCoreModule,
    JobsModule,
    AuditModule,
    ProvidersModule,
    RbacModule,
    VerificationModule,
    AuthModule,
    MfaModule,
    UsersModule,
    OnboardingModule,
    CatalogueModule,
    EntitlementsModule,
    StoreModule,
    SettingsModule,
    GamesModule,
    FeatureFlagsModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
