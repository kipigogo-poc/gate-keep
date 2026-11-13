// @vitest-environment node
import 'fake-indexeddb/auto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { TOTP_STEP_SECONDS, decodeQrPayload, hotp, importTotpKey, timeStep } from '@gatekeep/shared';
import { loadPass, savePass, wipeWallet } from '@/services/walletVault';
import { computeWalletCode } from '@/utils/walletCode';

/**
 * TC-02 (Airplane Mode Entry): once a pass is saved, generating gate codes must
 * need nothing but IndexedDB, Web Crypto and the device clock.
 */
describe('TC-02: offline wallet codes', () => {
  const seed = crypto.getRandomValues(new Uint8Array(32));
  const seedCopy = seed.slice(); // what the server keeps
  const meta = { ticketId: 'tkt_abc', eventName: 'Test Night', seatLabel: 'A1' };
  const fetchSpy = vi.fn(() => Promise.reject(new TypeError('Network request failed (airplane mode)')));

  beforeAll(async () => {
    await savePass(meta, seed, 0); // provisioned while online
    vi.stubGlobal('fetch', fetchSpy); // ...then the phone goes into airplane mode
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    await wipeWallet();
  });

  it('produces the same code the server expects, with zero network calls', async () => {
    const pass = await loadPass('tkt_abc');
    expect(pass).not.toBeNull();
    const now = Date.UTC(2026, 11, 1, 20, 0, 7);

    const shown = await computeWalletCode(pass!, now);
    const serverSide = await hotp(await importTotpKey(seedCopy), timeStep(now));

    expect(shown.code).toBe(serverSide);
    expect(decodeQrPayload(shown.qrPayload)).toEqual({ ticketId: 'tkt_abc', code: serverSide });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rotates every 15 s and reports time left for the ring', async () => {
    const pass = (await loadPass('tkt_abc'))!;
    const t0 = timeStep(Date.UTC(2026, 11, 1, 20, 0, 0)) * TOTP_STEP_SECONDS * 1000;
    const a = await computeWalletCode(pass, t0 + 1_000);
    const b = await computeWalletCode(pass, t0 + 14_999);
    const c = await computeWalletCode(pass, t0 + 15_000);
    expect(a.code).toBe(b.code);
    expect(c.step).toBe(a.step + 1);
    expect(a.secondsLeft).toBeCloseTo(14, 5);
  });

  it('corrects a drifting phone clock with the offset saved at provisioning', async () => {
    const offsetMs = 40_000; // phone is 40 s slow
    await savePass({ ...meta, ticketId: 'tkt_slow' }, seedCopy.slice(), offsetMs);
    const pass = (await loadPass('tkt_slow'))!;
    const serverNow = Date.UTC(2026, 11, 1, 20, 5, 0);
    const shown = await computeWalletCode(pass, serverNow - offsetMs);
    expect(shown.code).toBe(await hotp(await importTotpKey(seedCopy), timeStep(serverNow)));
  });

  it('stores only a non-extractable key: the seed cannot be read back out', async () => {
    const pass = (await loadPass('tkt_abc'))!;
    expect(pass.key.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('raw', pass.key)).rejects.toThrow();
    expect(JSON.stringify(pass)).not.toContain(String(seedCopy[0]) + ',' + String(seedCopy[1]));
    expect(seed.every((b) => b === 0)).toBe(true); // provisioning buffer was zeroed
  });
});
