import { describe, expect, it } from 'vitest';
import { notificationArchitecture } from './services/notificationArchitecture';

describe('mobile foundation', () => {
  it('does not claim notification success', () => {
    expect(notificationArchitecture.describe()).not.toMatch(/Sent|Delivered|Connected/i);
  });
});
