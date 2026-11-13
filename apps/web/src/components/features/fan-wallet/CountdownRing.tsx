import type { ReactNode } from 'react';
import { TOTP_STEP_SECONDS } from '@gatekeep/shared';

export interface CountdownRingProps {
  readonly secondsLeft: number;
  readonly children: ReactNode;
}

const SIZE = 320;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

/** Ring drains over each 15 s step; the QR sits inside it. */
export function CountdownRing({ secondsLeft, children }: CountdownRingProps) {
  const fraction = Math.max(0, Math.min(1, secondsLeft / TOTP_STEP_SECONDS));
  const urgent = secondsLeft <= 3;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-80">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-border-subtle" />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - fraction)}
          className={urgent ? 'stroke-accent-primary' : 'stroke-status-live'}
          style={{ transition: 'stroke-dashoffset 250ms linear' }}
        />
      </svg>
      <div className="absolute inset-[14%] flex items-center justify-center rounded-2xl bg-surface p-3">{children}</div>
      <span className="tabular absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-contrast px-3 py-1 text-xs font-semibold text-surface">
        {Math.ceil(secondsLeft)}s
      </span>
    </div>
  );
}
