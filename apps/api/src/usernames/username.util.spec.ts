import { describe, expect, it } from 'vitest';
import { normalizeUsername, validateUsernameFormat } from './username.util';

describe('username util', () => {
  it('normalizes case for uniqueness', () => {
    expect(normalizeUsername('LunaMoon')).toBe('lunamoon');
  });

  it('accepts valid usernames', () => {
    expect(validateUsernameFormat('Luna_35').ok).toBe(true);
  });

  it('rejects reserved and abusive names with the same availability message', () => {
    const reserved = validateUsernameFormat('admin');
    const abuse = validateUsernameFormat('badfuckname');
    expect(reserved.ok).toBe(false);
    expect(abuse.ok).toBe(false);
    if (!reserved.ok && !abuse.ok) {
      expect(reserved.reason).toBe('Username is not available');
      expect(abuse.reason).toBe('Username is not available');
    }
  });
});
