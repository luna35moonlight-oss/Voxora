import { describe, expect, it } from 'vitest';
import { requestAvatarStateTransition, shouldReturnToIdle } from './avatarRuntime';

describe('avatar runtime state transitions', () => {
  it('does not let idle or blink interrupt speaking', () => {
    expect(
      requestAvatarStateTransition({
        current: 'SPEAK',
        requested: 'BLINK',
        reducedMotion: false,
      }),
    ).toBe('SPEAK');
  });

  it('uses calmer reduced-motion fallbacks without removing the character', () => {
    expect(
      requestAvatarStateTransition({
        current: 'IDLE',
        requested: 'CELEBRATE',
        reducedMotion: true,
      }),
    ).toBe('SMILE');
  });

  it('marks short reactions for return to idle', () => {
    expect(shouldReturnToIdle('SMILE')).toBe(true);
    expect(shouldReturnToIdle('SPEAK')).toBe(false);
  });
});
