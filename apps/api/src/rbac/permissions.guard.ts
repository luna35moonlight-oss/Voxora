import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PermissionKey } from '@voxora/contracts';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { RbacService } from './rbac.service';
import type { AuthenticatedRequest } from '../auth/auth.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbac: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.user?.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    for (const permission of required) {
      const allowed = await this.rbac.userHasPermission(req.user.userId, permission);
      if (!allowed) {
        throw new ForbiddenException(`Missing permission: ${permission}`);
      }
    }
    return true;
  }
}
