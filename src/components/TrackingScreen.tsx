// TrackingScreen.tsx — customer-facing real-time installer tracking screen.
// Subscribes to Supabase Realtime for job status + location_tracking updates.
// Renders a Leaflet map with a moving marker for the installer's position.

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ArrowLeft, MapPin, Clock, CheckCircle2, Truck, Home as HomeIcon } from 'lucide-react';
import { supabase } from '../utils/supabase/client';

// ─── Fix Leaflet default marker icon (Vite/Webpack asset issue) ───────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Status steps ─────────────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'assigned', label: 'Assigned',   Icon: Clock },
  { key: 'on_way',   label: 'On the Way', Icon: Truck },
  { key: 'arrived',  label: 'Arrived',    Icon: HomeIcon },
  { key: 'completed',label: 'Done',       Icon: CheckCircle2 },
] as const;

const ACCENT = '#E60000';

// Nairobi as default map centre
const DEFAULT_CENTER: [number, number] = [-1.2921, 36.8219];

// ─── Map auto-pan helper ───────────────────────────────────────────────────────
function MapPanner({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { duration: 1.2 });
  }, [center, map]);
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface TrackingScreenProps {
  jobId: string;
  onBack: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TrackingScreen({ jobId, onBack }: TrackingScreenProps) {
  const [job, setJob]                         = useState<any>(null);
  const [location, setLocation]               = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading]                 = useState(true);

  // ── Initial job fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('jobs').select('*').eq('id', jobId).single()
      .then(({ data }) => { if (data) setJob(data); })
      .finally(() => setLoading(false));
  }, [jobId]);

  // ── Realtime: job status ───────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel('tracking-job-' + jobId)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'jobs',
        filter: 'id=eq.' + jobId,
      }, (payload) => {
        if (payload.new) setJob(payload.new as any);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [jobId]);

  // ── Realtime: installer location ───────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel('tracking-loc-' + jobId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'location_tracking',
        filter: 'job_id=eq.' + jobId,
      }, (payload) => {
        const row = payload.new as any;
        if (row?.lat != null && row?.lng != null) {
          setLocation({ lat: Number(row.lat), lng: Number(row.lng) });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [jobId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // ── Completed screen ───────────────────────────────────────────────────────
  if (job?.status === 'completed') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center bg-gray-50">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5 bg-green-100">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Installation Complete!</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Your Airtel HBB connection has been installed successfully.
          Welcome to high-speed internet!
        </p>
        <button
          onClick={onBack}
          className="px-10 py-3.5 rounded-2xl text-white font-semibold text-base shadow-lg"
          style={{ background: `linear-gradient(135deg, ${ACCENT}, #B30000)` }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  // ── Active tracking ────────────────────────────────────────────────────────
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === job?.status);

  return (
    <div className="flex flex-col h-full bg-gray-50">

      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, #B30000, ${ACCENT})` }}>
        <button onClick={onBack} className="text-white p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-bold text-sm">Tracking Your Installer</h1>
          <p className="text-white/60 text-[11px]">Job #{String(jobId).slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Status timeline */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center">
          {STATUS_STEPS.map((s, i) => {
            const done    = i <= currentIdx;
            const current = i === currentIdx;
            const SIcon   = s.Icon;
            return (
              <React.Fragment key={s.key}>
                <div className={`flex flex-col items-center ${done ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                    current ? 'border-red-500 bg-red-50' : done ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-100'
                  }`}>
                    <SIcon className={`w-4 h-4 ${current ? 'text-red-500' : done ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <span className="text-[9px] font-medium text-gray-500 mt-1 w-14 text-center leading-tight">{s.label}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-5 rounded-full ${i < currentIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
        <MapContainer
          center={location ? [location.lat, location.lng] : DEFAULT_CENTER}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {location && (
            <>
              <MapPanner center={[location.lat, location.lng]} />
              <Marker position={[location.lat, location.lng]}>
                <Popup>Installer is here</Popup>
              </Marker>
            </>
          )}
        </MapContainer>

        {/* Overlay when no location yet */}
        {!location && (
          <div className="absolute inset-0 flex items-end justify-center pb-8 pointer-events-none">
            <div className="bg-white/95 rounded-2xl px-5 py-3 shadow-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <MapPin className="w-4 h-4" style={{ color: ACCENT }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Waiting for location…</p>
                <p className="text-[11px] text-gray-400">Map will update when installer is on the way</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-3 safe-bottom">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
            {(() => {
              const step = STATUS_STEPS[Math.max(0, currentIdx)];
              const SIcon = step?.Icon ?? Clock;
              return <SIcon className="w-5 h-5" style={{ color: ACCENT }} />;
            })()}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">
              {STATUS_STEPS[currentIdx]?.label ?? 'Assigned'}
            </p>
            <p className="text-[11px] text-gray-400">
              {job?.status === 'assigned' ? 'Your installer will be on the way soon' :
               job?.status === 'on_way'   ? 'Your installer is heading to your location' :
               job?.status === 'arrived'  ? 'Your installer has arrived — please let them in' :
               'Tracking your installation'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
