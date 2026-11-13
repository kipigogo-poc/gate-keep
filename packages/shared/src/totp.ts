/**
 * RFC 6238 TOTP over HMAC-SHA-256 using only Web Crypto, so the identical code
 * runs in the offline PWA (non-extractable CryptoKey from IndexedDB) and in the
 * API (key imported from the stored seed). No network, no Node-only APIs.
 */
import { TOTP_DIGITS, TOTP_STEP_SECONDS } from './rules.js';

export const QR_PREFIX = 'GK1';

export function timeStep(unixMs: number, stepSeconds: number = TOTP_STEP_SECONDS): number {
  return Math.floor(unixMs / 1000 / stepSeconds);
}

/** Imports a raw seed as an HMAC key. The wallet keeps extractable=false so the seed can never be read back out. */
export function importTotpKey(seed: Uint8Array<ArrayBuffer>, extractable = false): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey('raw', seed, { name: 'HMAC', hash: 'SHA-256' }, extractable, ['sign']);
}

/** RFC 4226 HOTP with dynamic truncation. */
export async function hotp(key: CryptoKey, counter: number, digits: number = TOTP_DIGITS): Promise<string> {
  if (!Number.isSafeInteger(counter) || counter < 0) throw new RangeError('counter must be a non-negative safe integer');
  const msg = new ArrayBuffer(8);
  const view = new DataView(msg);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  const mac = new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', key, msg));
  const offset = (mac[mac.length - 1] as number) & 0x0f;
  const binary =
    (((mac[offset] as number) & 0x7f) << 24) |
    ((mac[offset + 1] as number) << 16) |
    ((mac[offset + 2] as number) << 8) |
    (mac[offset + 3] as number);
  return String(binary % 10 ** digits).padStart(digits, '0');
}

export function totp(key: CryptoKey, unixMs: number): Promise<string> {
  return hotp(key, timeStep(unixMs));
}

export function encodeQrPayload(ticketId: string, code: string): string {
  return `${QR_PREFIX}.${ticketId}.${code}`;
}

export interface DecodedQrPayload {
  readonly ticketId: string;
  readonly code: string;
}

const PAYLOAD = new RegExp(`^${QR_PREFIX}\\.([A-Za-z0-9_-]{1,64})\\.(\\d{${TOTP_DIGITS}})$`);

export function decodeQrPayload(payload: string): DecodedQrPayload | null {
  const m = PAYLOAD.exec(payload.trim());
  return m?.[1] && m[2] ? { ticketId: m[1], code: m[2] } : null;
}
