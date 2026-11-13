import { QRCodeSVG } from 'qrcode.react';
import { WALLET_COPY } from '@/constants/wallet';
import { Badge } from '@/components/ui/Badge';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useWalletCode } from '@/hooks/useWalletCode';
import { CountdownRing } from './CountdownRing';

export function WalletPass({ ticketId }: { readonly ticketId: string }) {
  const state = useWalletCode(ticketId);
  const online = useOnlineStatus();

  if (state.status === 'loading') return <p className="py-24 text-center text-muted">Opening pass…</p>;
  if (state.status === 'missing') {
    return (
      <div className="mx-auto max-w-sm py-24 text-center">
        <h1 className="text-2xl font-bold">{WALLET_COPY.missingTitle}</h1>
        <p className="mt-3 text-muted">{WALLET_COPY.missingBody}</p>
      </div>
    );
  }

  const { pass, current } = state;
  return (
    <section className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="text-center">
        {!online && <Badge tone="accent">{WALLET_COPY.offline}</Badge>}
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{pass.eventName}</h1>
        <p className="tabular mt-1 text-lg font-semibold text-muted">Seat {pass.seatLabel}</p>
      </header>

      <div className="mt-10">
        <CountdownRing secondsLeft={current.secondsLeft}>
          <QRCodeSVG value={current.qrPayload} level="M" className="h-full w-full" marginSize={0} title="Ticket QR code" />
        </CountdownRing>
      </div>

      <p className="tabular mt-8 text-center text-4xl font-bold tracking-[0.3em]" aria-live="polite">
        {current.code}
      </p>
      <p className="mt-6 text-center text-sm text-muted">{WALLET_COPY.hint}</p>
      <p className="mt-2 text-center font-cursive text-2xl text-accent-primary">see you inside</p>
    </section>
  );
}
