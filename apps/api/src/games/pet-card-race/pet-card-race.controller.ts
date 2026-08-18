import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import {
  PlayPetCardRaceCardsRequestSchema,
  StartNextPetCardRaceRequestSchema,
  StartPetCardRaceMeetRequestSchema,
} from '@voxora/contracts';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../auth/auth.types';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PetCardRaceService } from './pet-card-race.service';

const AttemptIdParamSchema = z.object({ attemptId: z.string().uuid() });

@Controller('games/pet-card-race')
@UseGuards(JwtAuthGuard)
export class PetCardRaceController {
  constructor(private readonly petCardRace: PetCardRaceService) {}

  @Get('me')
  getStatus(@Req() req: AuthenticatedRequest) {
    return this.petCardRace.getStatus(req.user!.userId);
  }

  @Post('meets/start')
  startMeet(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(StartPetCardRaceMeetRequestSchema)) body: unknown,
  ) {
    const { petId } = StartPetCardRaceMeetRequestSchema.parse(body);
    return this.petCardRace.startMeet(req.user!.userId, petId);
  }

  /** Brings the client up to date with rival advances that happened on the server clock. */
  @Post('meets/:attemptId/sync')
  sync(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(AttemptIdParamSchema)) params: unknown,
  ) {
    const { attemptId } = AttemptIdParamSchema.parse(params);
    return this.petCardRace.sync(req.user!.userId, attemptId);
  }

  @Post('meets/:attemptId/plays')
  playCards(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(AttemptIdParamSchema)) params: unknown,
    @Body(new ZodValidationPipe(PlayPetCardRaceCardsRequestSchema)) body: unknown,
  ) {
    const { attemptId } = AttemptIdParamSchema.parse(params);
    const data = PlayPetCardRaceCardsRequestSchema.parse(body);
    return this.petCardRace.playCards(req.user!.userId, attemptId, data);
  }

  @Post('meets/:attemptId/races/next')
  startNextRace(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(AttemptIdParamSchema)) params: unknown,
    @Body(new ZodValidationPipe(StartNextPetCardRaceRequestSchema)) body: unknown,
  ) {
    const { attemptId } = AttemptIdParamSchema.parse(params);
    const { petId } = StartNextPetCardRaceRequestSchema.parse(body);
    return this.petCardRace.startNextRace(req.user!.userId, attemptId, petId);
  }

  @Post('meets/:attemptId/forfeit')
  forfeit(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(AttemptIdParamSchema)) params: unknown,
  ) {
    const { attemptId } = AttemptIdParamSchema.parse(params);
    return this.petCardRace.forfeit(req.user!.userId, attemptId);
  }
}
