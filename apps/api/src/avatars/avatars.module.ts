import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AvatarsController } from './avatars.controller';
import { AvatarsService } from './avatars.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AvatarsController],
  providers: [AvatarsService],
})
export class AvatarsModule {}
