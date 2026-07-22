// ODU Installer Tasks — field collection tab for installers.
// Opt-in → see allocated retrievals with a 48h countdown → Accept/Reject →
// capture 2 ODUs (scan/manual) + consent doc + GPS → mark collected.
import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, Camera, CheckCircle, XCircle, Clock, RefreshCw, Loader2, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/client';
import { captureCurrentPosition } from '../../utils/geolocation';
import {
  getOduRequests, installerAccept, installerReject, captureDevice, markCollected,
  doorRefusal, getRequestDevices, setInstallerOptIn, uploadOduDocument, isValidImei, isValidMac,
} from './odu-api';
import { BarcodeScannerModal } from './odu-barcode-scanner';
import { STATUS_COLOR, STATUS_LABEL } from './odu-types';
import type { OduRequest, OduDevice } from './odu-types';

const ACCENT = '#ED1C24';

function useCountdown(deadline: string | null): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  if (!deadline) return '';
  const ms = new Date(deadline).getTime() - now;
  if (ms <= 0) return 'expired';
  const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4);
  return `${h}h ${m}m left`;
}

export function ODUInstallerTasks({ userData }: { userData: any }) {
  const [installerId, setInstallerId] = useState<number | null>(null);
  const [installerName, setInstallerName] = useState<string>(userData?.full_name || userData?.name || '');
  const [optIn, setOptIn] = useState(false);
  const [requests, setRequests] = useState<OduRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<OduRequest | null>(null);

  // Resolve the installer row (id + opt-in) from the logged-in phone.
  useEffect(() => {
    (async () => {
      const phone = userData?.phone_number || userData?.phone;
      if (userData?.id && typeof userData.id === 'number') { setInstallerId(userData.id); }
      if (!phone) { setLoading(false); return; }
      const norm = String(phone).replace(/\D/g, '').slice(-9);
      const { data } = await supabase
        .from('installers')
        .select('id, name, odu_opt_in')
        .or(`phone.ilike.%${norm}%`)
        .limit(1).maybeSingle();
      if (data) {
        setInstallerId(data.id);
        setInstallerName(data.name || installerName);
        setOptIn(!!data.odu_opt_in);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    if (!installerId) return;
    setLoading(true);
    try {
      const [alloc, acc] = await Promise.all([
        getOduRequests({ status: 'allocated', installer_id: installerId }),
        getOduRequests({ status: 'accepted', installer_id: installerId }),
      ]);
      setRequests([...acc, ...alloc]);
    } finally { setLoading(false); }
  }, [installerId]);

  useEffect(() => { if (installerId && optIn) load(); }, [installerId, optIn, load]);

  const toggleOptIn = async () => {
    if (!installerId) { toast.error('Installer profile not found'); return; }
    const next = !optIn;
    try { await setInstallerOptIn(installerId, next); setOptIn(next); toast.success(next ? 'Opted in to ODU retrievals' : 'Opted out'); }
    catch (e: any) { toast.error(e.message); }
  };

  if (active && installerId) {
    return <TaskDetail request={active} installerId={installerId} installerName={installerName}
      onBack={() => setActive(null)} onDone={() => { setActive(null); load(); }} />;
  }

  return (
    <div className="space-y-4">
      {/* Opt-in card */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">ODU Retrieval program</p>
          <p className="text-xs text-gray-500">{optIn ? 'You receive retrieval allocations' : 'Opt in to receive retrievals near you'}</p>
        </div>
        <button onClick={toggleOptIn}
          className={`relative w-12 h-7 rounded-full transition ${optIn ? 'bg-green-500' : 'bg-gray-300'}`}>
          <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition ${optIn ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

      {!installerId && !loading && (
        <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
          Couldn't match your phone to an installer record — retrievals need an entry in the installers table.
        </p>
      )}

      {optIn && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">My retrievals ({requests.length})</h3>
            <button onClick={load} className="p-2 text-gray-500"><RefreshCw className="w-4 h-4" /></button>
          </div>
          {loading ? (
            <p className="text-center text-gray-400 py-8">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No retrievals allocated right now.</p>
          ) : (
            <div className="space-y-2">
              {requests.map(r => <TaskRow key={r.id} r={r} onOpen={() => setActive(r)} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TaskRow({ r, onOpen }: { r: OduRequest; onOpen: () => void }) {
  const countdown = useCountdown(r.status === 'allocated' ? r.accept_deadline : null);
  const c = STATUS_COLOR[r.status];
  const urgent = countdown && countdown !== 'expired' && parseInt(countdown) < 6;
  return (
    <button onClick={onOpen} className="w-full text-left bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-gray-900">{r.customer?.customer_name}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{r.customer?.town} · {r.capture_estate || r.customer?.estate || '—'}</p>
        </div>
        <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: c.bg, color: c.fg }}>{STATUS_LABEL[r.status]}</span>
      </div>
      {r.status === 'allocated' && (
        <p className={`text-xs mt-2 flex items-center gap-1 ${urgent ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
          <Clock className="w-3 h-3" /> {countdown === 'expired' ? 'Deadline passed — will reassign' : countdown}
        </p>
      )}
    </button>
  );
}

// ─── Task detail ──────────────────────────────────────────────────────────────
function TaskDetail({ request, installerId, installerName, onBack, onDone }: {
  request: OduRequest; installerId: number; installerName: string; onBack: () => void; onDone: () => void;
}) {
  const cust = request.customer;
  const expected = cust?.expected_units ?? 2;
  const [status, setStatus] = useState(request.status);
  const [devices, setDevices] = useState<OduDevice[]>([]);
  const [busy, setBusy] = useState(false);

  const refreshDevices = useCallback(async () => setDevices(await getRequestDevices(request.id)), [request.id]);
  useEffect(() => { if (status === 'accepted') refreshDevices(); }, [status, refreshDevices]);

  const accept = async () => {
    setBusy(true);
    try { await installerAccept(request.id, installerId); setStatus('accepted'); toast.success('Accepted'); }
    catch (e: any) { toast.error(e.message); if (/window|no longer/i.test(e.message)) onDone(); }
    finally { setBusy(false); }
  };
  const reject = async () => {
    const reason = window.prompt('Reason for rejecting this retrieval?') || '';
    setBusy(true);
    try { await installerReject(request.id, installerId, reason); toast.success('Rejected — reassigning'); onDone(); }
    catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };
  const refuse = async () => {
    const notes = window.prompt('Door refusal notes?') || '';
    setBusy(true);
    try { await doorRefusal(request.id, installerId, notes); toast.success('Logged as not recovered'); onDone(); }
    catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 -m-4">
      <div className="text-white px-5 pt-6 pb-5" style={{ background: `linear-gradient(135deg, ${ACCENT}, #b3151b)` }}>
        <button onClick={onBack} className="text-sm opacity-80 mb-3">← Back</button>
        <h1 className="text-xl font-bold">{cust?.customer_name}</h1>
        <p className="text-sm opacity-90">{cust?.town} · {request.capture_estate || cust?.estate}{request.capture_house ? ` · ${request.capture_house}` : ''}</p>
        <p className="text-xs opacity-75 mt-1">{expected} ODUs to collect{request.retrieval_date ? ` · scheduled ${request.retrieval_date}` : ''}</p>
      </div>

      <div className="p-4 space-y-4">
        {status === 'allocated' && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
            <p className="text-sm text-gray-600">Accept within the window to start this retrieval.</p>
            <div className="flex gap-2">
              <button onClick={accept} disabled={busy}
                className="flex-1 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: '#0F6E56' }}>
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Accept</button>
              <button onClick={reject} disabled={busy}
                className="flex-1 py-3 rounded-xl border border-red-200 text-red-700 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                <XCircle className="w-5 h-5" /> Reject</button>
            </div>
          </div>
        )}

        {status === 'accepted' && (
          <CollectionFlow
            request={request} installerId={installerId} expected={expected}
            devices={devices} onDevicesChanged={refreshDevices}
            onCollected={() => { toast.success('Marked collected — take the ODUs to the warehouse'); onDone(); }}
            onRefuse={refuse} busy={busy} setBusy={setBusy} />
        )}
      </div>
    </div>
  );
}

// ─── Collection flow (device capture + consent + collect) ────────────────────
function CollectionFlow({ request, installerId, expected, devices, onDevicesChanged, onCollected, onRefuse, busy, setBusy }: {
  request: OduRequest; installerId: number; expected: number; devices: OduDevice[];
  onDevicesChanged: () => void; onCollected: () => void; onRefuse: () => void;
  busy: boolean; setBusy: (b: boolean) => void;
}) {
  const [showCapture, setShowCapture] = useState(false);
  const captured = devices.length;

  const doCollect = async () => {
    setBusy(true);
    try {
      // 1. consent doc photo (mandatory)
      const consentFile = await pickImage('Take a photo of the signed consent document');
      if (!consentFile) { setBusy(false); return; }
      toast.loading('Uploading consent doc…', { id: 'up' });
      const url = await uploadOduDocument(consentFile, `consent/${request.id}`);
      // 2. GPS
      const pos = await captureCurrentPosition();
      // 3. mark collected
      await markCollected(request.id, installerId, url, pos.lat, pos.lng);
      toast.dismiss('up');
      onCollected();
    } catch (e: any) { toast.dismiss('up'); toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      {/* Devices */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Captured ODUs</h3>
          <span className={`text-sm font-semibold ${captured >= expected ? 'text-green-600' : 'text-gray-500'}`}>{captured}/{expected}</span>
        </div>
        <div className="space-y-2">
          {devices.map((d, i) => (
            <div key={d.id} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-mono">{d.imei}</span>
              {d.mac && <span className="text-gray-400 font-mono text-xs">/ {d.mac}</span>}
              <span className="ml-auto text-[10px] text-gray-400 uppercase">{d.capture_method}</span>
            </div>
          ))}
          {captured < expected && (
            <button onClick={() => setShowCapture(true)}
              className="w-full py-2.5 rounded-lg border-2 border-dashed border-gray-300 text-gray-600 font-medium flex items-center justify-center gap-2">
              <ScanLine className="w-4 h-4" /> Capture ODU {captured + 1}
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <button onClick={doCollect} disabled={busy || captured < expected}
        className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ background: '#0F6E56' }}>
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        Consent doc + GPS → Mark collected
      </button>
      <button onClick={onRefuse} disabled={busy}
        className="w-full py-2.5 rounded-xl border border-red-200 text-red-700 font-medium">
        Refused at door / not recovered
      </button>

      {showCapture && (
        <DeviceCaptureModal
          request={request} installerId={installerId} index={captured + 1}
          onClose={() => setShowCapture(false)}
          onCaptured={() => { setShowCapture(false); onDevicesChanged(); }} />
      )}
    </div>
  );
}

// ─── Single device capture (scan or manual + label photo) ─────────────────────
function DeviceCaptureModal({ request, installerId, index, onClose, onCaptured }: {
  request: OduRequest; installerId: number; index: number; onClose: () => void; onCaptured: () => void;
}) {
  const [imei, setImei] = useState('');
  const [mac, setMac] = useState('');
  const [method, setMethod] = useState<'scan' | 'manual'>('manual');
  const [scanFor, setScanFor] = useState<null | 'imei' | 'mac'>(null);
  const [busy, setBusy] = useState(false);

  const imeiOk = isValidImei(imei);
  const macOk = !mac || isValidMac(mac);

  const onScan = (text: string) => {
    const digits = text.replace(/\D/g, '');
    if (scanFor === 'imei') {
      if (digits.length >= 15) { setImei(digits.slice(0, 15)); setMethod('scan'); }
      else toast.error('That barcode is not a 15-digit IMEI');
    } else if (scanFor === 'mac') {
      const hex = text.replace(/[^0-9a-fA-F]/g, '');
      if (hex.length >= 12) { setMac(hex.slice(0, 12)); setMethod('scan'); }
      else toast.error('That barcode is not a 12-char MAC');
    }
    setScanFor(null);
  };

  const save = async () => {
    if (!imeiOk) { toast.error('Enter a valid 15-digit IMEI'); return; }
    setBusy(true);
    try {
      // Manual entries must carry a label photo as audit evidence.
      let photoUrl: string | undefined;
      if (method === 'manual') {
        const f = await pickImage('Photograph the ODU label (audit evidence)');
        if (!f) { setBusy(false); return; }
        photoUrl = await uploadOduDocument(f, `labels/${request.id}`);
      }
      await captureDevice(request.id, installerId, { imei, mac: mac || undefined, method, photoUrl });
      toast.success(`ODU ${index} captured`);
      onCaptured();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-4">
        <h3 className="font-bold text-gray-900">Capture ODU {index}</h3>

        <div>
          <label className="text-xs font-medium text-gray-600">IMEI (15 digits) *</label>
          <div className="flex gap-2 mt-1">
            <input value={imei} onChange={e => { setImei(e.target.value.replace(/\D/g, '').slice(0, 15)); setMethod('manual'); }}
              placeholder="35xxxxxxxxxxxxx" inputMode="numeric"
              className={`flex-1 border rounded-lg px-3 py-2 font-mono text-sm ${imei && !imeiOk ? 'border-red-400' : 'border-gray-200'}`} />
            <button onClick={() => setScanFor('imei')} className="px-3 rounded-lg text-white" style={{ background: ACCENT }}>
              <ScanLine className="w-5 h-5" /></button>
          </div>
          {imei && !imeiOk && <p className="text-xs text-red-500 mt-1">Not a valid IMEI (Luhn check failed).</p>}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">MAC (optional)</label>
          <div className="flex gap-2 mt-1">
            <input value={mac} onChange={e => setMac(e.target.value.replace(/[^0-9a-fA-F:]/g, ''))}
              placeholder="AABBCCDDEEFF" className={`flex-1 border rounded-lg px-3 py-2 font-mono text-sm ${mac && !macOk ? 'border-red-400' : 'border-gray-200'}`} />
            <button onClick={() => setScanFor('mac')} className="px-3 rounded-lg text-white" style={{ background: ACCENT }}>
              <ScanLine className="w-5 h-5" /></button>
          </div>
        </div>

        <p className="text-xs text-gray-500">Manual entries require a photo of the label. Scanned values save directly.</p>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700">Cancel</button>
          <button onClick={save} disabled={busy || !imeiOk}
            className="flex-1 py-2.5 rounded-lg text-white font-semibold disabled:opacity-50" style={{ background: '#0F6E56' }}>
            {busy ? 'Saving…' : 'Save ODU'}</button>
        </div>
      </div>

      {scanFor && <BarcodeScannerModal title={`Scan ${scanFor.toUpperCase()}`} onDetected={onScan} onClose={() => setScanFor(null)} />}
    </div>
  );
}

// ─── helper: capture an image via the device camera ───────────────────────────
function pickImage(_hint: string): Promise<File | null> {
  return new Promise(resolve => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; (inp as any).capture = 'environment';
    inp.onchange = () => resolve(inp.files?.[0] || null);
    inp.oncancel = () => resolve(null);
    inp.click();
  });
}
