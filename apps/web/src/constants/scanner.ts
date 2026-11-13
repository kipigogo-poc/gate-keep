import type { ScanVerdict } from '@gatekeep/shared';

export interface VerdictCopy {
  readonly title: string;
  readonly detail: string;
  readonly admit: boolean;
}

export const VERDICT_COPY: Record<ScanVerdict, VerdictCopy> = {
  ADMIT: { title: 'ADMIT', detail: 'Valid ticket', admit: true },
  REJECT_EXPIRED: { title: 'DENY', detail: 'Old code — likely a screenshot. Ask for the live pass.', admit: false },
  REJECT_REUSED: { title: 'DENY', detail: 'This ticket has already entered.', admit: false },
  REJECT_INVALID: { title: 'DENY', detail: 'Not a valid GateKeep ticket.', admit: false },
};

/** How long a verdict stays on screen before the scanner re-arms. */
export const VERDICT_HOLD_MS = 2500;
