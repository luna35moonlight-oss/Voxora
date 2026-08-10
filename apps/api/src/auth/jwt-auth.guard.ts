import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';
import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization;
    const value = Array.isArray(header) ? header[0] : header;
    if (!value?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = value.slice('Bearer '.length);
    try {
      const payload = await this.tokens.verifyAccessToken(token);
      req.user = {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
