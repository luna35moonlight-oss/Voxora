import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../rbac/permissions.guard';
import { RequirePermissions } from '../rbac/permissions.decorator';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @RequirePermissions('user.profile.read')
  me(@Req() req: AuthenticatedRequest) {
    return this.users.getMe(req.user!.userId);
  }
}
