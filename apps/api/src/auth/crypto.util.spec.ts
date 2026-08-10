import { describe, expect, it } from 'vitest';
import { safeEqualSecret } from './crypto.util';

describe('safeEqualSecret', () => {
  it('returns true for equal secrets', () => {
    expect(safeEqualSecret('phase1-test-bootstrap-token', 'phase1-test-bootstrap-token')).toBe(
      true,
    );
  });

  it('returns false for different secrets of same length', () => {
    expect(safeEqualSecret('phase1-test-bootstrap-token', 'phase1-test-bootstrap-WRONG')).toBe(
      false,
    );
  });

  it('returns false for different lengths', () => {
    expect(safeEqualSecret('short-token-value', 'phase1-test-bootstrap-token')).toBe(false);
  });
});
