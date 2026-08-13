import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { FeatureFlagsModule } from './feature-flags/feature-flags.module';
import { JobsModule } from './jobs/jobs.module';
import { UsersModule } from './users/users.module';
import { AvatarsModule } from './avatars/avatars.module';
import { validateEnv } from './config/validate-env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // Always use process.env. Local/dev loads `.env` via shell or dotenv in main.ts.
      // Prevents decorator-time NODE_ENV races in tests.
      ignoreEnvFile: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        // Elevated in automated tests so security suites are not blocked by abuse limits.
        limit: process.env.NODE_ENV === 'test' ? 10_000 : 100,
      },
    ]),
    PrismaModule,
    JobsModule,
    AuditModule,
    RbacModule,
    AuthModule,
    UsersModule,
    AvatarsModule,
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
