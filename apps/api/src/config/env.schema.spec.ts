import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.schema.js';

describe('validateEnv', () => {
  it('applies defaults in development', () => {
    const env = validateEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(8080);
  });

  it('refuses to boot production without secrets', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(/PAYMONGO_WEBHOOK_SECRET: required in production/);
  });
});
