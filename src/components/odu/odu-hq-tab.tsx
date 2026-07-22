// ODU HQ Tab — the command surface for the retrieval program.
// Sub-tabs: Funnel · Upload · Flags · Reconciliation · Settings.
import React, { useEffect, useState, useCallback } from 'react';
import { BarChart3, Upload, Flag, Banknote, Settings, RefreshCw, Zap, Power } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/client';
import { ODUUploadManager } from './odu-upload-manager';
import { ODURecon } from './odu-recon';
import { getOduFunnel, getOduConfig, setOduConfig, resolveFlag } from './odu-api';
import { bulkAllocateOdu } from './odu-auto-assign';
import { FUNNEL_ORDER, STATUS_LABEL, STATUS_COLOR } from './odu-types';
import type { OduDevice } from './odu-types';

type Sub = 'funnel' | 'upload' | 'flags' | 'recon' | 'settings';

export function ODUHQTab({ currentUser }: { currentUser?: { name?: string; phone?: string } }) {
  const [sub, setSub] = useState<Sub>('funnel');
  const tabs: { id: Sub; label: string; icon: any }[] = [
    { id: 'funnel', label: 'Funnel', icon: BarChart3 },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'flags', label: 'Flags', icon: Flag },
    { id: 'recon', label: 'Payment', icon: Banknote },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setSub(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                sub === t.id ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>
      {sub === 'funnel' && <FunnelView />}
      {sub === 'upload' && <ODUUploadManager currentUser={currentUser} />}
      {sub === 'flags' && <FlagsView />}
      {sub === 'recon' && <ODURecon currentUser={currentUser} />}
      {sub === 'settings' && <SettingsView />}
    </div>
  );
}

// ─── Funnel ───────────────────────────────────────────────────────────────────
function FunnelView() {
  const [funnel, setFunnel] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);

  const load = useCallback(async () => { setLoading(true); try { setFunnel(await getOduFunnel()); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const runAllocate = async () => {
    setAllocating(true);
    try {
      const res = await bulkAllocateOdu();
      toast.success(`Allocated ${res.allocated}, failed ${res.failed}`);
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setAllocating(false); }
  };

  const total = Object.values(funnel).reduce((s, n) => s + n, 0);
  const max = Math.max(1, ...FUNNEL_ORDER.map(s => funnel[s] || 0));
  const sideStates = ['not_recovered', 'not_paid', 'flagged'] as const;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Retrieval funnel ({total.toLocaleString()} requests)</h2>
        <div className="flex gap-2">
          <button onClick={runAllocate} disabled={allocating}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Zap className="w-4 h-4" />{allocating ? 'Allocating…' : 'Allocate confirmed'}</button>
          <button onClick={load} className="p-2 text-gray-500"><RefreshCw className="w-5 h-5" /></button>
        </div>
      </div>

      {loading ? <p className="text-gray-400">Loading…</p> : (
        <>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-2">
            {FUNNEL_ORDER.map(s => {
              const n = funnel[s] || 0; const c = STATUS_COLOR[s];
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-gray-600">{STATUS_LABEL[s]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div className="h-full rounded-full flex items-center px-2 text-xs font-semibold"
                      style={{ width: `${Math.max((n / max) * 100, n ? 6 : 0)}%`, background: c.bg, color: c.fg }}>{n || ''}</div>
                  </div>
                  <span className="w-12 text-right text-sm font-semibold text-gray-900">{n}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {sideStates.map(s => (
              <div key={s} className="bg-white rounded-2xl p-5 border border-gray-200">
                <p className="text-xs text-gray-500">{STATUS_LABEL[s]}</p>
                <p className="text-2xl font-bold" style={{ color: STATUS_COLOR[s].fg }}>{funnel[s] || 0}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Flags queue ──────────────────────────────────────────────────────────────
function FlagsView() {
  const [devices, setDevices] = useState<(OduDevice & { request: any })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('odu_devices')
      .select('*, request:odu_requests!odu_devices_request_id_fkey(*, customer:odu_inactive_customers!odu_requests_customer_id_fkey(customer_name, town))')
      .in('match_status', ['mismatch', 'duplicate']);
    setDevices((data || []) as any);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const resolve = async (deviceId: string, resolution: 'accept' | 'reject') => {
    const notes = window.prompt(`Notes for ${resolution === 'accept' ? 'accepting' : 'rejecting'} this device?`) || '';
    try { await resolveFlag(deviceId, resolution, notes); toast.success('Resolved'); await load(); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Flagged devices ({devices.length})</h2>
      {loading ? <p className="text-gray-400">Loading…</p> : devices.length === 0 ? (
        <p className="text-gray-400 text-sm">No mismatches or duplicates to review.</p>
      ) : (
        <div className="space-y-3">
          {devices.map(d => (
            <div key={d.id} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{d.request?.customer?.customer_name} · {d.request?.customer?.town}</p>
                  <p className="text-xs text-gray-500 capitalize">{d.match_status} · installer {d.request?.installer_name}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-red-50 text-red-700 capitalize">{d.match_status}</span>
              </div>
              <div className="mt-2 text-sm font-mono text-gray-600">
                <div>Installer: {d.imei}</div>
                <div>Warehouse: {d.wh_imei || '—'}</div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => resolve(d.id, 'accept')} className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm">Accept (treat as matched)</button>
                <button onClick={() => resolve(d.id, 'reject')} className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-sm">Reject (not recovered)</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsView() {
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); try { setCfg(await getOduConfig()); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (key: string, value: any) => {
    try { await setOduConfig(key, value); toast.success('Saved'); await load(); }
    catch (e: any) { toast.error(e.message); }
  };

  const enabled = cfg.program_enabled === true || cfg.program_enabled === 'true';
  const pay = cfg.pay_per_unit || {};
  const hours = cfg.accept_window_hours ?? 48;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Program settings</h2>
      {loading ? <p className="text-gray-400">Loading…</p> : (
        <>
          {/* Kill switch */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 flex items-center gap-2"><Power className="w-4 h-4" /> Program enabled</p>
              <p className="text-xs text-gray-500">Master switch — turns ODU retrieval on/off across all roles.</p>
            </div>
            <button onClick={() => save('program_enabled', !enabled)}
              className={`relative w-14 h-8 rounded-full transition ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white transition ${enabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Pay rate */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 space-y-3">
            <p className="font-semibold text-gray-900">Pay per unit (KSh)</p>
            <div className="grid grid-cols-3 gap-3">
              {(['fare', 'incentive', 'total'] as const).map(k => (
                <label key={k} className="block">
                  <span className="text-xs text-gray-500 capitalize">{k}</span>
                  <input type="number" defaultValue={pay[k] ?? ''} onBlur={e => {
                    const next = { ...pay, [k]: Number(e.target.value) };
                    if (k !== 'total') next.total = (Number(next.fare) || 0) + (Number(next.incentive) || 0);
                    save('pay_per_unit', next);
                  }} className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm" />
                </label>
              ))}
            </div>
          </div>

          {/* Accept window */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <label className="font-semibold text-gray-900 block mb-2">Acceptance window (hours)</label>
            <input type="number" defaultValue={hours} onBlur={e => save('accept_window_hours', Number(e.target.value))}
              className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            <p className="text-xs text-gray-500 mt-1">Installers must accept within this window before reassignment (default 48).</p>
          </div>
        </>
      )}
    </div>
  );
}
