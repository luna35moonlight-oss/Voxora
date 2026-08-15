import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { StoreVerifySchema } from '@voxora/contracts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Get('readiness')
  readiness() {
    return this.store.readiness();
  }

  @Post('verify')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  verify(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(StoreVerifySchema)) body: unknown,
  ) {
    const data = StoreVerifySchema.parse(body);
    return this.store.verify(req.user!.userId, data);
  }
}
