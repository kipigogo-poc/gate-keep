import { useGateScanner } from '@/hooks/useGateScanner';
import { useQrCamera } from '@/hooks/useQrCamera';
import { VerdictScreen } from './VerdictScreen';

const CAMERA_MESSAGE = {
  starting: 'Starting camera…',
  denied: 'Camera blocked. Allow camera access for this site to scan.',
  unavailable: 'This device has no usable camera.',
} as const;

export function GateScanner() {
  const { state, onRead, reset } = useGateScanner();
  const { videoRef, camera } = useQrCamera(onRead, state.status === 'idle');

  return (
    <section className="fixed inset-0 bg-contrast text-surface">
      <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-64 rounded-3xl border-4 border-surface/80" />
      </div>

      <p className="absolute inset-x-0 bottom-0 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-lg font-semibold">
        {camera !== 'live' ? CAMERA_MESSAGE[camera] : state.status === 'checking' ? 'Checking…' : 'Point at the fan’s live pass'}
      </p>

      {state.status === 'result' && <VerdictScreen verdict={state.verdict} onDismiss={reset} />}
      {state.status === 'error' && (
        <button type="button" onClick={reset} className="fixed inset-0 z-50 bg-contrast p-6 text-center text-xl font-semibold">
          {state.message}
          <span className="mt-2 block text-base font-normal opacity-70">Tap to retry</span>
        </button>
      )}
    </section>
  );
}
