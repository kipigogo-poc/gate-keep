import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * PayMongo signs webhooks with header
 *   Paymongo-Signature: t=<unix seconds>,te=<test hex>,li=<live hex>
 * where each signature = HMAC-SHA256(webhookSecret, `${t}.${rawBody}`) in hex.
 * Pure functions — no Nest, no I/O — so every rejection path is unit-testable.
 */

export interface ParsedSignatureHeader {
  readonly timestamp: number;
  readonly test: string | undefined;
  readonly live: string | undefined;
}

export type SignatureVerdict = 'valid' | 'missing' | 'malformed' | 'stale' | 'mismatch';

export interface VerifySignatureInput {
  readonly header: string | undefined;
  readonly rawBody: Buffer;
  readonly secret: string;
  readonly livemode: boolean;
  readonly nowSeconds: number;
  readonly toleranceSeconds: number;
}

const HEX_SHA256 = /^[0-9a-f]{64}$/;

export function parseSignatureHeader(header: string): ParsedSignatureHeader | null {
  const parts = new Map<string, string>();
  for (const pair of header.split(',')) {
    const idx = pair.indexOf('=');
    if (idx <= 0) return null;
    parts.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }
  const t = parts.get('t');
  if (!t || !/^\d{1,12}$/.test(t)) return null;
  const pick = (k: string): string | undefined => {
    const v = parts.get(k);
    return v && HEX_SHA256.test(v) ? v : undefined;
  };
  return { timestamp: Number(t), test: pick('te'), live: pick('li') };
}

export function computeSignature(secret: string, timestamp: number, rawBody: Buffer): string {
  return createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex');
}

export function verifyPaymongoSignature(input: VerifySignatureInput): SignatureVerdict {
  if (!input.header) return 'missing';
  const parsed = parseSignatureHeader(input.header);
  if (!parsed) return 'malformed';

  if (Math.abs(input.nowSeconds - parsed.timestamp) > input.toleranceSeconds) return 'stale';

  const provided = input.livemode ? parsed.live : parsed.test;
  if (!provided) return 'mismatch';

  const expected = Buffer.from(computeSignature(input.secret, parsed.timestamp, input.rawBody), 'hex');
  const actual = Buffer.from(provided, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? 'valid' : 'mismatch';
}
