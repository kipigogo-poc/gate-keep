import { useEffect, useState } from 'react';
import { loadPass } from '@/services/walletVault';
import { computeWalletCode } from '@/utils/walletCode';
import type { StoredPass, WalletState } from '@/types';

const TICK_MS = 250;

/** Loads a pass from IndexedDB and re-derives its code on a timer. No network. */
export function useWalletCode(ticketId: string): WalletState {
  const [state, setState] = useState<WalletState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const tick = async (pass: StoredPass): Promise<void> => {
      const current = await computeWalletCode(pass, Date.now());
      if (!cancelled) setState({ status: 'ready', pass, current });
    };

    void loadPass(ticketId).then((pass) => {
      if (cancelled) return;
      if (!pass) return setState({ status: 'missing' });
      void tick(pass);
      timer = setInterval(() => void tick(pass), TICK_MS);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [ticketId]);

  return state;
}
