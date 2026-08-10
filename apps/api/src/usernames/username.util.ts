/**
 * Username rules (Phase 2):
 * - Display form preserves case as submitted after trim
 * - Uniqueness is case-insensitive via usernameNormalized (lowercased)
 * - Length 3–24; must start with a letter; [A-Za-z0-9_]
 * - Reserved names blocked
 * - Abuse/profanity: denylist architecture (expandable; not exhaustive)
 */

const RESERVED = new Set(
  [
    'admin',
    'administrator',
    'owner',
    'support',
    'moderator',
    'voxora',
    'alpha',
    'bondfire',
    'system',
    'root',
    'null',
    'undefined',
    'api',
    'help',
    'security',
    'official',
  ].map((s) => s.toLowerCase()),
);

/** Minimal abuse denylist — architecture hook; expand via owner-approved lists later. */
const ABUSE_BLOCKLIST = new Set(['fuck', 'shit', 'nigger', 'faggot'].map((s) => s.toLowerCase()));

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsernameFormat(
  username: string,
): { ok: true } | { ok: false; reason: string } {
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 24) {
    return { ok: false, reason: 'Username must be 3–24 characters' };
  }
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(trimmed)) {
    return {
      ok: false,
      reason: 'Username must start with a letter and use only letters, numbers, and underscore',
    };
  }
  const normalized = normalizeUsername(trimmed);
  if (RESERVED.has(normalized)) {
    return { ok: false, reason: 'Username is not available' };
  }
  for (const blocked of ABUSE_BLOCKLIST) {
    if (normalized.includes(blocked)) {
      return { ok: false, reason: 'Username is not available' };
    }
  }
  return { ok: true };
}
