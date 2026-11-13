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

describe('validateEnv blank values', () => {
  it('treats KEY= as unset in development', () => {
    expect(validateEnv({ PAYMONGO_SECRET_KEY: '', FIREBASE_PROJECT_ID: '' }).PAYMONGO_SECRET_KEY).toBeUndefined();
  });

  it('still requires them in production', () => {
    expect(() => validateEnv({ NODE_ENV: 'production', PAYMONGO_WEBHOOK_SECRET: '' })).toThrow(/PAYMONGO_WEBHOOK_SECRET/);
  });
});
