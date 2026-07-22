// ODU Barcode Scanner — reads Code-128/39/EAN off the router label via the rear
// camera. @zxing/browser is dynamically imported so a missing package never
// breaks an unrelated page load; if unavailable, the caller falls back to manual.
//
//   npm install @zxing/browser @zxing/library
import React, { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';

interface Props {
  onDetected: (text: string) => void;
  onClose: () => void;
  title?: string;
}

export function BarcodeScannerModal({ onDetected, onClose, title = 'Scan label barcode' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const zxing = await import('@zxing/browser').catch(() => null);
        if (!zxing) { setError('Scanner library not installed — use manual entry.'); setStarting(false); return; }
        const { BrowserMultiFormatReader } = zxing as any;
        const reader = new BrowserMultiFormatReader();

        // Prefer a rear camera
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const rear = devices.find((d: any) => /back|rear|environment/i.test(d.label)) || devices[devices.length - 1];

        if (cancelled) return;
        controlsRef.current = await reader.decodeFromVideoDevice(
          rear?.deviceId, videoRef.current!,
          (result: any) => {
            if (result && !cancelled) {
              cancelled = true;
              try { controlsRef.current?.stop(); } catch { /* ignore */ }
              onDetected(String(result.getText()).trim());
            }
          },
        );
        setStarting(false);
      } catch (err: any) {
        setError(err?.message || 'Could not start the camera.');
        setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      try { controlsRef.current?.stop(); } catch { /* ignore */ }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="font-semibold flex items-center gap-2"><Camera className="w-5 h-5" />{title}</span>
        <button onClick={onClose} className="p-2"><X className="w-6 h-6" /></button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-center text-white/80 max-w-xs">
            <p className="mb-2">{error}</p>
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/15">Enter manually instead</button>
          </div>
        ) : (
          <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            {/* Aiming guide */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-red-500 rounded-lg" />
            {starting && <p className="absolute inset-0 flex items-center justify-center text-white/70">Starting camera…</p>}
          </div>
        )}
      </div>
      <p className="text-center text-white/60 text-xs pb-6 px-6">
        Point the red box at the IMEI / MAC barcode on the ODU label.
      </p>
    </div>
  );
}
