import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  EquipAvatarItemRequestSchema,
  SelectAvatarRequestSchema,
  UnequipAvatarItemRequestSchema,
} from '@voxora/contracts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AvatarsService } from './avatars.service';

@Controller('avatars')
@UseGuards(JwtAuthGuard)
export class AvatarsController {
  constructor(private readonly avatars: AvatarsService) {}

  @Get('me')
  getCurrent(@Req() req: AuthenticatedRequest) {
    return this.avatars.getCurrent(req.user!.userId);
  }

  @Post('select')
  selectAvatar(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(SelectAvatarRequestSchema)) body: unknown,
  ) {
    const data = SelectAvatarRequestSchema.parse(body);
    return this.avatars.selectAvatar(req.user!.userId, data.avatarId);
  }

  @Post('equip')
  equipItem(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(EquipAvatarItemRequestSchema)) body: unknown,
  ) {
    const data = EquipAvatarItemRequestSchema.parse(body);
    return this.avatars.equipItem(req.user!.userId, data.avatarId, data.itemId);
  }

  @Post('unequip')
  unequipItem(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(UnequipAvatarItemRequestSchema)) body: unknown,
  ) {
    const data = UnequipAvatarItemRequestSchema.parse(body);
    return this.avatars.unequipItem(req.user!.userId, data.avatarId, data.slot);
  }
}
