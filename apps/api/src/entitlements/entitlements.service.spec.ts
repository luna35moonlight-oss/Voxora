import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('entitlement pricing rule', () => {
  it('does not encode access from price amounts in EntitlementsService', () => {
    const source = readFileSync(join(__dirname, 'entitlements.service.ts'), 'utf8');
    expect(source).not.toMatch(/amountMinor\s*===/);
    expect(source).not.toMatch(/if\s*\(\s*level\s*===\s*4/);
    expect(source).not.toMatch(/price\s*===\s*125/);
  });
});
