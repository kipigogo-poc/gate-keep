import { describe, expect, it } from 'vitest';
import { decodeQrPayload, encodeQrPayload, hotp, importTotpKey, timeStep } from './totp.js';

// RFC 6238 Appendix B, SHA-256 seed and 8-digit vectors (30 s step).
const RFC_SEED = new TextEncoder().encode('12345678901234567890123456789012') as Uint8Array<ArrayBuffer>;
const VECTORS: ReadonlyArray<[unixSeconds: number, code: string]> = [
  [59, '46119246'],
  [1111111109, '68084774'],
  [1111111111, '67062674'],
  [1234567890, '91819424'],
  [2000000000, '90698825'],
  [20000000000, '77737706'],
];

describe('TOTP (RFC 6238, HMAC-SHA-256)', () => {
  it.each(VECTORS)('t=%i → %s', async (t, expected) => {
    const key = await importTotpKey(RFC_SEED);
    expect(await hotp(key, timeStep(t * 1000, 30), 8)).toBe(expected);
  });

  it('keys are non-extractable by default', async () => {
    const key = await importTotpKey(RFC_SEED);
    expect(key.extractable).toBe(false);
    await expect(globalThis.crypto.subtle.exportKey('raw', key)).rejects.toThrow();
  });

  it('rotates every 15 s by default', () => {
    expect(timeStep(14_999)).toBe(0);
    expect(timeStep(15_000)).toBe(1);
  });
});

describe('QR payload', () => {
  it('round-trips', () => {
    expect(decodeQrPayload(encodeQrPayload('tkt_1', '012345'))).toEqual({ ticketId: 'tkt_1', code: '012345' });
  });

  it.each(['', 'GK1.tkt.12345', 'GK1.tkt.1234567', 'GK2.tkt.123456', 'GK1.a:b.123456', 'GK1.tkt.12345a'])(
    'rejects %j',
    (bad) => expect(decodeQrPayload(bad)).toBeNull(),
  );
});
