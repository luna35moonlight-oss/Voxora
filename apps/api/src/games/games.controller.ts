import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CompleteWhiteWolfAttemptRequestSchema } from '@voxora/contracts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { GamesService } from './games.service';

const AttemptIdParamSchema = z.object({ attemptId: z.string().uuid() });

@Controller('games/white-wolf-moon-dash')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Get('me')
  getWhiteWolfStatus(@Req() req: AuthenticatedRequest) {
    return this.games.getWhiteWolfStatus(req.user!.userId);
  }

  @Post('attempts/start')
  startWhiteWolfAttempt(@Req() req: AuthenticatedRequest) {
    return this.games.startWhiteWolfAttempt(req.user!.userId);
  }

  @Post('attempts/:attemptId/complete')
  completeWhiteWolfAttempt(
    @Req() req: AuthenticatedRequest,
    @Param(new ZodValidationPipe(AttemptIdParamSchema)) params: unknown,
    @Body(new ZodValidationPipe(CompleteWhiteWolfAttemptRequestSchema)) body: unknown,
  ) {
    const { attemptId } = AttemptIdParamSchema.parse(params);
    const data = CompleteWhiteWolfAttemptRequestSchema.parse(body);
    return this.games.completeWhiteWolfAttempt(req.user!.userId, attemptId, data);
  }
}
