import type { ScanVerdict } from '@gatekeep/shared';
import { VERDICT_COPY } from '@/constants/scanner';
import { cn } from '@/utils/cn';

/** Full-bleed, unmistakable: solid green admits, solid red denies. Tap to dismiss early. */
export function VerdictScreen({ verdict, onDismiss }: { readonly verdict: ScanVerdict; readonly onDismiss: () => void }) {
  const copy = VERDICT_COPY[verdict];
  return (
    <button
      type="button"
      onClick={onDismiss}
      role="alert"
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center text-white',
        copy.admit ? 'bg-status-live' : 'bg-status-denied',
      )}
    >
      <span aria-hidden className="text-8xl font-black">
        {copy.admit ? '✓' : '✕'}
      </span>
      <span className="mt-4 text-6xl font-black tracking-tight">{copy.title}</span>
      <span className="mt-4 max-w-xs text-xl font-semibold">{copy.detail}</span>
    </button>
  );
}
