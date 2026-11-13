import { clear, createStore, get, set, type UseStore } from 'idb-keyval';
import { importTotpKey } from '@gatekeep/shared';
import type { PassMeta, StoredPass } from '@/types';

/**
 * Offline pass storage. The TOTP seed is imported as a NON-extractable CryptoKey
 * and only that key object is persisted: page scripts can use it to sign, but
 * no script (or DevTools) can read the seed bytes back out to clone the pass.
 */
let store: UseStore | undefined;
const db = (): UseStore => (store ??= createStore('gatekeep-wallet', 'passes'));

export async function savePass(meta: PassMeta, seed: Uint8Array<ArrayBuffer>, clockOffsetMs: number): Promise<StoredPass> {
  const key = await importTotpKey(seed, false);
  seed.fill(0); // drop the raw bytes from memory as soon as the key exists
  const pass: StoredPass = { ...meta, key, clockOffsetMs, savedAt: Date.now() };
  await set(pass.ticketId, pass, db());
  return pass;
}

export async function loadPass(ticketId: string): Promise<StoredPass | null> {
  return (await get<StoredPass>(ticketId, db())) ?? null;
}

export async function wipeWallet(): Promise<void> {
  await clear(db());
}
