import { describe, expect, it } from 'vitest';
import { computeSignature, parseSignatureHeader, verifyPaymongoSignature, type VerifySignatureInput } from './paymongo-signature.js';

const secret = 'whsk_test_secret';
const body = Buffer.from('{"data":{"id":"evt_1"}}');
const now = 1_800_000_000;

function input(overrides: Partial<VerifySignatureInput> = {}): VerifySignatureInput {
  const sig = computeSignature(secret, now, body);
  return {
    header: `t=${now},te=${sig},li=`,
    rawBody: body,
    secret,
    livemode: false,
    nowSeconds: now,
    toleranceSeconds: 300,
    ...overrides,
  };
}

describe('verifyPaymongoSignature', () => {
  it('accepts a correct test-mode signature', () => {
    expect(verifyPaymongoSignature(input())).toBe('valid');
  });

  it('accepts a correct live-mode signature in live mode', () => {
    const sig = computeSignature(secret, now, body);
    expect(verifyPaymongoSignature(input({ header: `t=${now},te=,li=${sig}`, livemode: true }))).toBe('valid');
  });

  it('does not accept a test signature when running live', () => {
    expect(verifyPaymongoSignature(input({ livemode: true }))).toBe('mismatch');
  });

  it('rejects a signature made with a different secret', () => {
    const forged = computeSignature('attacker', now, body);
    expect(verifyPaymongoSignature(input({ header: `t=${now},te=${forged}` }))).toBe('mismatch');
  });

  it('rejects a body changed after signing', () => {
    expect(verifyPaymongoSignature(input({ rawBody: Buffer.from('{"data":{"id":"evt_2"}}') }))).toBe('mismatch');
  });

  it('rejects a re-signed timestamp (signature binds t)', () => {
    const sig = computeSignature(secret, now, body);
    expect(verifyPaymongoSignature(input({ header: `t=${now + 1},te=${sig}` }))).toBe('mismatch');
  });

  it('rejects stale and future timestamps outside tolerance', () => {
    expect(verifyPaymongoSignature(input({ nowSeconds: now + 301 }))).toBe('stale');
    expect(verifyPaymongoSignature(input({ nowSeconds: now - 301 }))).toBe('stale');
  });

  it('rejects missing and malformed headers', () => {
    expect(verifyPaymongoSignature(input({ header: undefined }))).toBe('missing');
    expect(verifyPaymongoSignature(input({ header: 'garbage' }))).toBe('malformed');
    expect(verifyPaymongoSignature(input({ header: 'te=abc' }))).toBe('malformed');
  });

  it('ignores signatures that are not 64 hex chars', () => {
    expect(parseSignatureHeader(`t=${now},te=zz`)?.test).toBeUndefined();
  });
});
