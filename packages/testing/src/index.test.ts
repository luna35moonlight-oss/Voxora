import { describe, expect, it } from 'vitest';
import { createCorrelationId, expectNeverFakeSuccess } from './index';

describe('testing helpers', () => {
  it('creates correlation ids', () => {
    expect(createCorrelationId('api').startsWith('api-')).toBe(true);
  });

  it('rejects fake success labels', () => {
    expect(() => expectNeverFakeSuccess('Connected')).toThrow(/Forbidden/);
    expect(() => expectNeverFakeSuccess('Pending')).not.toThrow();
  });
});
