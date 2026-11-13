/** A ticket pass as persisted in IndexedDB. The key is a non-extractable CryptoKey. */
export interface StoredPass {
  readonly ticketId: string;
  readonly eventName: string;
  readonly seatLabel: string;
  readonly key: CryptoKey;
  /** serverTime − deviceTime at provisioning, applied offline to correct a drifting phone clock. */
  readonly clockOffsetMs: number;
  readonly savedAt: number;
}

export type PassMeta = Pick<StoredPass, 'ticketId' | 'eventName' | 'seatLabel'>;

export interface WalletCode {
  readonly code: string;
  readonly qrPayload: string;
  readonly step: number;
  /** Seconds until rotation, fractional, for the countdown ring. */
  readonly secondsLeft: number;
}

export type WalletState =
  | { readonly status: 'loading' }
  | { readonly status: 'missing' }
  | { readonly status: 'ready'; readonly pass: StoredPass; readonly current: WalletCode };
