import { useCallback, useEffect, useRef, useState } from 'react';
import { VERDICT_HOLD_MS } from '@/constants/scanner';
import { ApiError } from '@/services/apiClient';
import { submitScan } from '@/services/scanApi';
import type { ScannerState } from '@/types';

/** idle → checking → result → (hold) → idle. Ignores reads while busy. */
export function useGateScanner(): { state: ScannerState; onRead: (payload: string) => void; reset: () => void } {
  const [state, setState] = useState<ScannerState>({ status: 'idle' });
  const busy = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const reset = useCallback(() => {
    clearTimeout(holdTimer.current);
    busy.current = false;
    setState({ status: 'idle' });
  }, []);

  const onRead = useCallback(
    (payload: string) => {
      if (busy.current) return;
      busy.current = true;
      setState({ status: 'checking' });
      submitScan(payload)
        .then((res) => setState({ status: 'result', verdict: res.verdict }))
        .catch((err: unknown) =>
          setState({ status: 'error', message: err instanceof ApiError ? err.message : 'No connection to server' }),
        )
        .finally(() => {
          holdTimer.current = setTimeout(reset, VERDICT_HOLD_MS);
        });
    },
    [reset],
  );

  useEffect(() => () => clearTimeout(holdTimer.current), []);
  return { state, onRead, reset };
}
