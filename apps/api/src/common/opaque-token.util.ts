import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function hashOpaque(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hashDestination(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function hmacSha256(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}
