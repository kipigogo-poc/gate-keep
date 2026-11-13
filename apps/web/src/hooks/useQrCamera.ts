import { useEffect, useRef, useState, type RefObject } from 'react';
import jsQR from 'jsqr';
import type { CameraState } from '@/types';

export interface QrCamera {
  readonly videoRef: RefObject<HTMLVideoElement | null>;
  readonly camera: CameraState;
}

/** Rear camera → jsQR on each animation frame. Calls onDecode for every distinct read while enabled. */
export function useQrCamera(onDecode: (text: string) => void, enabled: boolean): QrCamera {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [camera, setCamera] = useState<CameraState>('starting');
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamera('unavailable');
      return;
    }
    let stream: MediaStream | undefined;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const loop = (): void => {
      const video = videoRef.current;
      if (stopped || !video || !ctx) return;
      if (enabledRef.current && video.readyState >= video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const hit = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, {
          inversionAttempts: 'dontInvert',
        });
        if (hit?.data) onDecodeRef.current(hit.data);
      }
      raf = requestAnimationFrame(loop);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(async (s) => {
        stream = s;
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = s;
        await videoRef.current.play();
        setCamera('live');
        raf = requestAnimationFrame(loop);
      })
      .catch(() => setCamera('denied'));

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, camera };
}
