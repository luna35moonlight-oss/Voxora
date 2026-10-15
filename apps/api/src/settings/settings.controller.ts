import { Body, Controller, Delete, Get, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { CommunicationAgreementSchema, type CommunicationAgreement } from '@voxora/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('communication')
  communication(@Req() req: AuthenticatedRequest) {
    return this.settings.getCommunication(req.user!.userId);
  }

  @Put('communication')
  saveCommunication(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(CommunicationAgreementSchema)) body: CommunicationAgreement,
  ) {
    return this.settings.saveCommunication(req.user!.userId, body);
  }

  @Delete('communication')
  resetCommunication(@Req() req: AuthenticatedRequest) {
    return this.settings.resetCommunication(req.user!.userId);
  }

  @Get()
  get(@Req() req: AuthenticatedRequest) {
    return this.settings.getSettings(req.user!.userId);
  }
}
