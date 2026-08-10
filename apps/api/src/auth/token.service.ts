import { createHash, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { ApiEnv } from '@voxora/config';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<ApiEnv, true>,
  ) {}

  async signAccessToken(payload: { sub: string; email: string; roles: string[] }) {
    return this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
    });
  }

  async verifyAccessToken(token: string) {
    return this.jwt.verifyAsync<{ sub: string; email: string; roles: string[] }>(token, {
      secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  createRefreshToken(): { token: string; hash: string; expiresAt: Date } {
    const token = randomBytes(48).toString('base64url');
    const hash = this.hashToken(token);
    const ttl = this.config.get('JWT_REFRESH_TTL', { infer: true });
    const expiresAt = this.parseTtlToDate(ttl);
    return { token, hash, expiresAt };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseTtlToDate(ttl: string): Date {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const ms =
      unit === 's'
        ? amount * 1000
        : unit === 'm'
          ? amount * 60 * 1000
          : unit === 'h'
            ? amount * 60 * 60 * 1000
            : amount * 24 * 60 * 60 * 1000;
    return new Date(Date.now() + ms);
  }
}
