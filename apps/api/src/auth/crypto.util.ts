import { timingSafeEqual } from 'crypto';

/** Constant-time string compare for secrets. Length mismatch returns false without leaking content. */
export function safeEqualSecret(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) {
    // Compare against self-length buffer to keep work roughly similar without claiming length privacy.
    const decoy = Buffer.alloc(a.length);
    timingSafeEqual(a, decoy);
    return false;
  }
  return timingSafeEqual(a, b);
}

export const OWNER_BOOTSTRAP_COMPLETION_ID = 'owner_bootstrap';
