import {
  SCAN_FUTURE_SKEW_SECONDS,
  SCAN_GRACE_SECONDS,
  SCREENSHOT_LOOKBACK_SECONDS,
  TOTP_STEP_SECONDS,
  hotp,
} from '@gatekeep/shared';

export type CodeVerdict = 'VALID' | 'EXPIRED' | 'INVALID';

function sameCode(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Judges a wallet code against the server clock (never the scanner's or the fan's).
 *  VALID   — matches a step whose window [c*S - skew, (c+1)*S + grace) contains now
 *  EXPIRED — matches an older step: a screenshot or a replayed photo (TC-01)
 *  INVALID — matches nothing recent: wrong ticket, wrong seed, or made up
 */
export async function judgeCode(key: CryptoKey, code: string, nowMs: number): Promise<CodeVerdict> {
  const now = nowMs / 1000;
  const newest = Math.floor((now + SCAN_FUTURE_SKEW_SECONDS) / TOTP_STEP_SECONDS);
  const oldestValid = Math.floor((now - SCAN_GRACE_SECONDS) / TOTP_STEP_SECONDS);

  for (let c = newest; c >= oldestValid; c--) {
    if (sameCode(await hotp(key, c), code)) return 'VALID';
  }
  const oldestKnown = oldestValid - Math.ceil(SCREENSHOT_LOOKBACK_SECONDS / TOTP_STEP_SECONDS);
  for (let c = oldestValid - 1; c >= Math.max(0, oldestKnown); c--) {
    if (sameCode(await hotp(key, c), code)) return 'EXPIRED';
  }
  return 'INVALID';
}
