// ODU Warehouse Dashboard — receive collected ODUs, re-capture IMEI/MAC, and
// auto-match against the installer's capture. Mismatch/duplicate → flagged for HQ.
import React, { useEffect, useState, useCallback } from 'react';
import { Package, RefreshCw, LogOut, ScanLine, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/client';
import { getWarehouses, getIncomingDevices, warehouseReceive, isValidImei } from './odu-api';
import { BarcodeScannerModal } from './odu-barcode-scanner';
import type { OduDevice, OduRequest, OduWarehouse } from './odu-types';

const ACCENT = '#ED1C24';
type Incoming = OduDevice & { request: OduRequest & { customer?: any } };

export function ODUWarehouseDashboard({ userData, onLogout }: { userData?: any; onLogout: () => void }) {
  const operator = userData?.full_name || userData?.name || 'Warehouse';
  const [warehouse, setWarehouse] = useState<OduWarehouse | null>(null);
  const [warehouses, setWarehouses] = useState<OduWarehouse[]>([]);
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Incoming | null>(null);

  useEffect(() => {
    (async () => {
      const whs = await getWarehouses();
      setWarehouses(whs);
      // Prefer the warehouse tied to this staff member
      let picked: OduWarehouse | null = null;
      if (userData?.warehouse_id) picked = whs.find(w => w.id === userData.warehouse_id) || null;
      setWarehouse(picked || whs[0] || null);
    })();
  }, [userData]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setIncoming(await getIncomingDevices()); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Group pending devices by request for a cleaner receive view
  const byRequest = new Map<string, Incoming[]>();
  incoming.forEach(d => {
    const arr = byRequest.get(d.request_id) || [];
    arr.push(d); byRequest.set(d.request_id, arr);
  });

  if (active && warehouse) {
    return <ReceiveCard device={active} warehouse={warehouse} operator={operator}
      onBack={() => setActive(null)} onDone={() => { setActive(null); load(); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-white px-5 pt-6 pb-5" style={{ background: `linear-gradient(135deg, ${ACCENT}, #b3151b)` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold">ODU Warehouse</h1>
            <p className="text-xs opacity-80">{operator}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2 rounded-lg bg-white/15"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={onLogout} className="p-2 rounded-lg bg-white/15"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="bg-white/15 rounded-xl px-4 py-3">
          <label className="text-xs opacity-80">Receiving at</label>
          <select value={warehouse?.id || ''} onChange={e => setWarehouse(warehouses.find(w => w.id === e.target.value) || null)}
            className="w-full bg-transparent text-white font-semibold text-lg outline-none">
            {warehouses.map(w => <option key={w.id} value={w.id} className="text-black">{w.name} · {w.town}</option>)}
          </select>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Expected in ({incoming.length} units)</h3>
        </div>
        {loading ? (
          <p className="text-center text-gray-400 py-10">Loading…</p>
        ) : incoming.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">Nothing awaiting receipt.</p>
        ) : (
          <div className="space-y-3">
            {[...byRequest.entries()].map(([reqId, devs]) => (
              <div key={reqId} className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="font-semibold text-gray-900">{devs[0].request?.customer?.customer_name || 'Unknown'}</p>
                <p className="text-xs text-gray-500 mb-3">{devs[0].request?.customer?.town} · {devs[0].request?.installer_name || 'installer'}</p>
                <div className="space-y-2">
                  {devs.map(d => (
                    <button key={d.id} onClick={() => setActive(d)}
                      className="w-full flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5 text-left hover:bg-gray-100">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="font-mono text-sm">{d.imei}</span>
                      <span className="ml-auto text-xs text-white px-2 py-1 rounded-md" style={{ background: '#0F6E56' }}>Receive</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Receive one device ───────────────────────────────────────────────────────
function ReceiveCard({ device, warehouse, operator, onBack, onDone }: {
  device: Incoming; warehouse: OduWarehouse; operator: string; onBack: () => void; onDone: () => void;
}) {
  const [whImei, setWhImei] = useState('');
  const [whMac, setWhMac] = useState('');
  const [method, setMethod] = useState<'scan' | 'manual'>('manual');
  const [scanFor, setScanFor] = useState<null | 'imei' | 'mac'>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<'matched' | 'mismatch' | 'duplicate' | null>(null);

  const imeiOk = isValidImei(whImei);

  const onScan = (text: string) => {
    if (scanFor === 'imei') { const d = text.replace(/\D/g, ''); if (d.length >= 15) { setWhImei(d.slice(0, 15)); setMethod('scan'); } else toast.error('Not a 15-digit IMEI'); }
    else if (scanFor === 'mac') { const h = text.replace(/[^0-9a-fA-F]/g, ''); if (h.length >= 12) { setWhMac(h.slice(0, 12)); setMethod('scan'); } else toast.error('Not a 12-char MAC'); }
    setScanFor(null);
  };

  const submit = async () => {
    if (!imeiOk) { toast.error('Scan or enter a valid IMEI'); return; }
    setBusy(true);
    try {
      const r = await warehouseReceive(device.id, whImei, whMac, method, warehouse.id, operator);
      setResult(r);
      if (r === 'matched') toast.success('Matched ✓');
      else if (r === 'duplicate') toast.error('Duplicate — this IMEI was already delivered. Flagged.');
      else toast.error('Mismatch vs installer capture. Flagged for HQ.');
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  if (result) {
    const good = result === 'matched';
    const Icon = good ? CheckCircle : result === 'duplicate' ? Copy : AlertTriangle;
    const color = good ? '#0F6E56' : '#A32D2D';
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <Icon className="w-20 h-20 mb-4" style={{ color }} />
        <h2 className="text-2xl font-bold text-gray-900 capitalize">{result}</h2>
        <p className="text-gray-600 mt-1 mb-6 max-w-xs">
          {good ? 'Warehouse capture matches the installer. Device confirmed received.'
            : result === 'duplicate' ? 'This IMEI was already received/delivered elsewhere. The request is flagged for HQ review.'
            : 'The IMEI does not match what the installer captured. The request is flagged for HQ review.'}
        </p>
        <button onClick={onDone} className="px-6 py-2.5 rounded-lg text-white font-semibold" style={{ background: ACCENT }}>
          Next device</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-white px-5 pt-6 pb-5" style={{ background: `linear-gradient(135deg, ${ACCENT}, #b3151b)` }}>
        <button onClick={onBack} className="text-sm opacity-80 mb-3">← Back</button>
        <h1 className="text-lg font-bold">Receive ODU</h1>
        <p className="text-xs opacity-80">{device.request?.customer?.customer_name} · from {device.request?.installer_name || 'installer'}</p>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
          Re-scan the device — don't copy the installer's number. The system compares them.
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600">IMEI *</label>
            <div className="flex gap-2 mt-1">
              <input value={whImei} onChange={e => { setWhImei(e.target.value.replace(/\D/g, '').slice(0, 15)); setMethod('manual'); }}
                inputMode="numeric" placeholder="35xxxxxxxxxxxxx"
                className={`flex-1 border rounded-lg px-3 py-2 font-mono text-sm ${whImei && !imeiOk ? 'border-red-400' : 'border-gray-200'}`} />
              <button onClick={() => setScanFor('imei')} className="px-3 rounded-lg text-white" style={{ background: ACCENT }}><ScanLine className="w-5 h-5" /></button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">MAC (optional)</label>
            <div className="flex gap-2 mt-1">
              <input value={whMac} onChange={e => setWhMac(e.target.value.replace(/[^0-9a-fA-F:]/g, ''))}
                placeholder="AABBCCDDEEFF" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm" />
              <button onClick={() => setScanFor('mac')} className="px-3 rounded-lg text-white" style={{ background: ACCENT }}><ScanLine className="w-5 h-5" /></button>
            </div>
          </div>
        </div>

        <button onClick={submit} disabled={busy || !imeiOk}
          className="w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-40" style={{ background: '#0F6E56' }}>
          {busy ? 'Checking…' : 'Confirm receipt'}</button>
      </div>

      {scanFor && <BarcodeScannerModal title={`Scan ${scanFor.toUpperCase()}`} onDetected={onScan} onClose={() => setScanFor(null)} />}
    </div>
  );
}
