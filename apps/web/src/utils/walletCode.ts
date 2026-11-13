import { TOTP_STEP_SECONDS, encodeQrPayload, hotp, timeStep } from '@gatekeep/shared';
import type { StoredPass, WalletCode } from '@/types';

/** Pure + offline: device clock (corrected by the stored offset) → current code. */
export async function computeWalletCode(pass: StoredPass, deviceNowMs: number): Promise<WalletCode> {
  const now = deviceNowMs + pass.clockOffsetMs;
  const step = timeStep(now);
  const code = await hotp(pass.key, step);
  const stepMs = TOTP_STEP_SECONDS * 1000;
  return {
    code,
    step,
    qrPayload: encodeQrPayload(pass.ticketId, code),
    secondsLeft: (stepMs - (now % stepMs)) / 1000,
  };
}
