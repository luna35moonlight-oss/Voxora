import { describe, expect, it } from 'vitest';
import { generateTotpSecret, verifyTotp } from './totp.util';
import { createHmac } from 'crypto';

function hotp(secretBase32: string, counter: number): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = secretBase32.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const secret = Buffer.from(bytes);
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

describe('totp util', () => {
  it('verifies a valid code and rejects replay of the same step', () => {
    const secret = generateTotpSecret();
    const nowMs = 1_700_000_000_000;
    const step = Math.floor(nowMs / 1000 / 30);
    const code = hotp(secret, step);

    const first = verifyTotp(secret, code, { nowMs });
    expect(first.valid).toBe(true);
    expect(first.step).toBe(step);

    const replay = verifyTotp(secret, code, { nowMs, lastUsedStep: first.step });
    expect(replay.valid).toBe(false);

    // Adjacent window remains usable after consuming the current step.
    const nextCode = hotp(secret, step + 1);
    const adjacent = verifyTotp(secret, nextCode, { nowMs, lastUsedStep: first.step });
    expect(adjacent.valid).toBe(true);
  });

  it('rejects invalid codes', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, '000000').valid).toBe(false);
  });
});
