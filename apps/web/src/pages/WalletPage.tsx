import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { WalletPass } from '@/components/features/fan-wallet';
import { appConfig } from '@/services/config';
import { loadPass, savePass } from '@/services/walletVault';

const DEMO_ID = 'demo';

/** In dev, /wallet/demo provisions a throwaway pass so the wallet can be tried without tickets. */
function useDemoPass(ticketId: string): boolean {
  const [ready, setReady] = useState(ticketId !== DEMO_ID || !appConfig.isDev);
  useEffect(() => {
    if (ready) return;
    void loadPass(DEMO_ID)
      .then((existing) =>
        existing
          ? existing
          : savePass(
              { ticketId: DEMO_ID, eventName: 'Demo Night — Araneta', seatLabel: 'VIP A1' },
              crypto.getRandomValues(new Uint8Array(32)),
              0,
            ),
      )
      .then(() => setReady(true));
  }, [ready]);
  return ready;
}

export function WalletPage() {
  const { ticketId = '' } = useParams();
  const ready = useDemoPass(ticketId);
  return ready ? <WalletPass key={ticketId} ticketId={ticketId} /> : null;
}
