import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(bytes = 20): string {
  const buf = randomBytes(bytes);
  return toBase32(buf);
}

export function buildOtpAuthUri(input: {
  secret: string;
  accountName: string;
  issuer?: string;
}): string {
  const issuer = encodeURIComponent(input.issuer ?? 'Voxora');
  const account = encodeURIComponent(input.accountName);
  return `otpauth://totp/${issuer}:${account}?secret=${input.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export function verifyTotp(
  secretBase32: string,
  code: string,
  options?: { window?: number; nowMs?: number; lastUsedStep?: number | null },
): { valid: boolean; step?: number } {
  if (!/^\d{6}$/.test(code)) {
    return { valid: false };
  }
  const window = options?.window ?? 1;
  const nowMs = options?.nowMs ?? Date.now();
  const step = Math.floor(nowMs / 1000 / 30);
  const secret = fromBase32(secretBase32);

  for (let offset = -window; offset <= window; offset += 1) {
    const candidateStep = step + offset;
    // Replay protection: reject only the exact previously accepted step (not all older steps).
    if (options?.lastUsedStep != null && candidateStep === options.lastUsedStep) {
      continue;
    }
    const expected = hotp(secret, candidateStep);
    if (equalDigits(expected, code)) {
      return { valid: true, step: candidateStep };
    }
  }
  return { valid: false };
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', secret).update(buf).digest();
  const offset = digest[digest.length - 1]! & 0xf;
  const code =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

function equalDigits(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function toBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function fromBase32(input: string): Buffer {
  const cleaned = input.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
