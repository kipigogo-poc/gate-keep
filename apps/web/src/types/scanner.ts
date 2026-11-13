import type { ScanVerdict } from '@gatekeep/shared';

export type ScannerState =
  | { readonly status: 'idle' }
  | { readonly status: 'checking' }
  | { readonly status: 'result'; readonly verdict: ScanVerdict }
  | { readonly status: 'error'; readonly message: string };

export type CameraState = 'starting' | 'live' | 'denied' | 'unavailable';
