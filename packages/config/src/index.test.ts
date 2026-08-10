import { describe, expect, it } from 'vitest';
import { parseCorsOrigins, ApiEnvSchema } from './index';

describe('config', () => {
  it('parses cors origins', () => {
    expect(parseCorsOrigins('http://a, http://b')).toEqual(['http://a', 'http://b']);
  });

  it('requires long jwt secrets', () => {
    expect(() =>
      ApiEnvSchema.parse({
        DATABASE_URL: 'postgresql://x',
        REDIS_URL: 'redis://x',
        JWT_ACCESS_SECRET: 'short',
        JWT_REFRESH_SECRET: 'short',
      }),
    ).toThrow();
  });
});
