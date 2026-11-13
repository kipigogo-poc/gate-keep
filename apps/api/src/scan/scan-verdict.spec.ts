import { describe, expect, it } from 'vitest';
import { SCAN_FUTURE_SKEW_SECONDS, SCAN_GRACE_SECONDS, TOTP_STEP_SECONDS, hotp, importTotpKey } from '@gatekeep/shared';
import { judgeCode } from './scan-verdict.js';

const seed = new Uint8Array(32).fill(7);
const S = TOTP_STEP_SECONDS * 1000;
const c = 120_000_000; // an arbitrary time step
const stepStart = c * S;

async function setup() {
  const key = await importTotpKey(seed);
  return { key, code: await hotp(key, c) };
}

describe('judgeCode (server clock is the only clock)', () => {
  it('accepts the code throughout its own 15 s step', async () => {
    const { key, code } = await setup();
    expect(await judgeCode(key, code, stepStart)).toBe('VALID');
    expect(await judgeCode(key, code, stepStart + S - 1)).toBe('VALID');
  });

  it('tolerates a short grace for scan latency and phone clock lag', async () => {
    const { key, code } = await setup();
    expect(await judgeCode(key, code, stepStart + S + SCAN_GRACE_SECONDS * 1000 - 1)).toBe('VALID');
  });

  it('TC-01: rejects a screenshot once it is older than its step + grace', async () => {
    const { key, code } = await setup();
    expect(await judgeCode(key, code, stepStart + S + SCAN_GRACE_SECONDS * 1000)).toBe('EXPIRED');
    expect(await judgeCode(key, code, stepStart + 16_000 + SCAN_GRACE_SECONDS * 1000)).toBe('EXPIRED');
    expect(await judgeCode(key, code, stepStart + 10 * 60_000)).toBe('EXPIRED');
  });

  it('accepts a phone clock running slightly ahead, but not far ahead', async () => {
    const { key, code } = await setup();
    expect(await judgeCode(key, code, stepStart - SCAN_FUTURE_SKEW_SECONDS * 1000)).toBe('VALID');
    expect(await judgeCode(key, code, stepStart - SCAN_FUTURE_SKEW_SECONDS * 1000 - 1)).toBe('INVALID');
  });

  it('rejects a code from a different seed or made up', async () => {
    const { code } = await setup();
    const other = await importTotpKey(new Uint8Array(32).fill(8));
    expect(await judgeCode(other, code, stepStart)).toBe('INVALID');
    const { key } = await setup();
    const wrong = String((Number(code) + 1) % 1_000_000).padStart(6, '0');
    expect(await judgeCode(key, wrong, stepStart)).toBe('INVALID');
  });
});
