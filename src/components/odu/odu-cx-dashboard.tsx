// ODU CX Dashboard — call queue for the intake team.
// Work the list: open a customer → call → log outcome (confirm consent + capture,
// or decline with reason, or no-answer/callback). Backed by odu_cx_* RPCs.
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Phone, RefreshCw, LogOut, MapPin, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getOduRequests, cxLogCall, cxConfirm } from './odu-api';
import { NOT_RECOVERED_REASONS, STATUS_COLOR, STATUS_LABEL } from './odu-types';
import type { OduRequest, CallOutcome, NotRecoveredReason } from './odu-types';

const ACCENT = '#ED1C24';

interface Props {
  user?: any;
  userData?: any;
  onLogout: () => void;
}

export function ODUCXDashboard({ userData, onLogout }: Props) {
  const cxPhone = userData?.phone_number || userData?.phone || '';
  const cxName = userData?.full_name || userData?.name || 'CX Agent';

  const [requests, setRequests] = useState<OduRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState<OduRequest | null>(null);
  const [myCalls, setMyCalls] = useState({ confirmed: 0, notRecovered: 0, pending: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Intake queue: new + contacting. Show most-recently-updated first.
      const [fresh, contacting] = await Promise.all([
        getOduRequests({ status: 'new', limit: 200 }),
        getOduRequests({ status: 'contacting', limit: 200 }),
      ]);
      const all = [...contacting, ...fresh];
      setRequests(all);
      setMyCalls({
        confirmed: 0, // populated below from a broader query if needed
        notRecovered: 0,
        pending: all.length,
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return requests;
    return requests.filter(r =>
      (r.customer?.customer_name || '').toLowerCase().includes(q) ||
      (r.customer?.msisdn || '').includes(q) ||
      (r.customer?.town || '').toLowerCase().includes(q) ||
      (r.customer?.estate || '').toLowerCase().includes(q));
  }, [requests, search]);

  if (active) {
    return <CallCard
      request={active} cxPhone={cxPhone}
      onBack={() => setActive(null)}
      onDone={() => { setActive(null); load(); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white px-5 pt-6 pb-5" style={{ background: `linear-gradient(135deg, ${ACCENT}, #b3151b)` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold">ODU Retrieval · CX</h1>
            <p className="text-xs opacity-80">{cxName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 rounded-lg bg-white/15"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={onLogout} className="p-2 rounded-lg bg-white/15"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="bg-white/15 rounded-xl px-4 py-3">
          <p className="text-xs opacity-80">In your queue</p>
          <p className="text-2xl font-bold">{requests.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, town, estate"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-10">Loading queue…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Queue is clear 🎉</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(r => {
              const c = STATUS_COLOR[r.status];
              return (
                <button key={r.id} onClick={() => setActive(r)}
                  className="w-full text-left bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{r.customer?.customer_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500 font-mono">{r.customer?.msisdn}</p>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
                      style={{ background: c.bg, color: c.fg }}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.customer?.town || '—'}</span>
                    <span>{r.customer?.estate || 'estate n/a'}</span>
                    <span>· {r.customer?.expected_units ?? 2} ODUs</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Call card ────────────────────────────────────────────────────────────────
type Panel = 'menu' | 'confirm' | 'decline';

function CallCard({ request, cxPhone, onBack, onDone }: {
  request: OduRequest; cxPhone: string; onBack: () => void; onDone: () => void;
}) {
  const cust = request.customer;
  const [panel, setPanel] = useState<Panel>('menu');
  const [busy, setBusy] = useState(false);

  // Confirm form
  const [estate, setEstate] = useState(cust?.estate || '');
  const [house, setHouse] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  // Decline form
  const [reason, setReason] = useState<NotRecoveredReason>('no_funds');
  const [declineNotes, setDeclineNotes] = useState('');

  const logSimple = async (outcome: CallOutcome, notesTxt?: string) => {
    setBusy(true);
    try {
      await cxLogCall(request.id, cxPhone, outcome, { notes: notesTxt });
      toast.success('Call logged');
      onDone();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const submitConfirm = async () => {
    if (!estate.trim()) { toast.error('Estate is required'); return; }
    setBusy(true);
    try {
      await cxConfirm(request.id, cxPhone, {
        estate: estate.trim(), house: house.trim(), date: date || undefined, notes: notes.trim() || undefined,
        lat: cust?.lat ?? undefined, lng: cust?.lng ?? undefined,
      });
      toast.success('Consent captured — request confirmed for allocation');
      onDone();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const submitDecline = async () => {
    setBusy(true);
    try {
      await cxLogCall(request.id, cxPhone, 'declined', { declineReason: reason, notes: declineNotes.trim() || undefined });
      toast.success('Logged as not recovered');
      onDone();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-white px-5 pt-6 pb-5" style={{ background: `linear-gradient(135deg, ${ACCENT}, #b3151b)` }}>
        <button onClick={onBack} className="text-sm opacity-80 mb-3">← Back to queue</button>
        <h1 className="text-xl font-bold">{cust?.customer_name}</h1>
        <p className="text-sm opacity-90 font-mono">{cust?.msisdn}</p>
        <div className="flex gap-4 mt-2 text-xs opacity-80">
          <span>{cust?.town || '—'}</span>
          <span>{cust?.estate || 'estate n/a'}</span>
          <span>{cust?.expected_units ?? 2} ODUs expected</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Call button */}
        <a href={`tel:${cust?.msisdn}`}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-semibold"
          style={{ background: '#0F6E56' }}>
          <Phone className="w-5 h-5" /> Call {cust?.msisdn}
        </a>

        {panel === 'menu' && (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 uppercase font-semibold mt-2">Log outcome</p>
            <ActionBtn icon={<CheckCircle className="w-5 h-5" />} tone="good"
              label="Consented — capture details" onClick={() => setPanel('confirm')} />
            <ActionBtn icon={<XCircle className="w-5 h-5" />} tone="bad"
              label="Declined — log reason" onClick={() => setPanel('decline')} />
            <ActionBtn icon={<Clock className="w-5 h-5" />} tone="neutral"
              label="No answer" onClick={() => logSimple('no_answer')} disabled={busy} />
            <ActionBtn icon={<Clock className="w-5 h-5" />} tone="neutral"
              label="Call back later" onClick={() => logSimple('callback_later')} disabled={busy} />
            <ActionBtn icon={<XCircle className="w-5 h-5" />} tone="neutral"
              label="Wrong number" onClick={() => logSimple('wrong_number', 'wrong number')} disabled={busy} />
          </div>
        )}

        {panel === 'confirm' && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-900">Retrieval details</h3>
            <Field label="Estate *"><input value={estate} onChange={e => setEstate(e.target.value)} className="inp" /></Field>
            <Field label="House / unit"><input value={house} onChange={e => setHouse(e.target.value)} className="inp" /></Field>
            <Field label="Preferred retrieval date"><input type="date" value={date} onChange={e => setDate(e.target.value)} className="inp" /></Field>
            <Field label="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="inp" /></Field>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setPanel('menu')} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700">Back</button>
              <button onClick={submitConfirm} disabled={busy}
                className="flex-1 py-2.5 rounded-lg text-white font-semibold disabled:opacity-50" style={{ background: '#0F6E56' }}>
                {busy ? 'Saving…' : 'Confirm request'}</button>
            </div>
          </div>
        )}

        {panel === 'decline' && (
          <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-900">Reason (logged, no collection)</h3>
            <div className="grid grid-cols-2 gap-2">
              {NOT_RECOVERED_REASONS.map(r => (
                <button key={r.value} onClick={() => setReason(r.value)}
                  className={`py-2 px-2 rounded-lg text-sm border ${reason === r.value
                    ? 'border-red-500 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                  {r.label}</button>
              ))}
            </div>
            <Field label="Notes"><textarea value={declineNotes} onChange={e => setDeclineNotes(e.target.value)} rows={2} className="inp" /></Field>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setPanel('menu')} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700">Back</button>
              <button onClick={submitDecline} disabled={busy}
                className="flex-1 py-2.5 rounded-lg text-white font-semibold bg-red-600 disabled:opacity-50">
                {busy ? 'Saving…' : 'Log not recovered'}</button>
            </div>
          </div>
        )}
      </div>

      {/* tiny utility styles */}
      <style>{`.inp{width:100%;border:1px solid #e5e7eb;border-radius:0.5rem;padding:0.5rem 0.65rem;font-size:0.875rem}`}</style>
    </div>
  );
}

function ActionBtn({ icon, label, onClick, tone, disabled }: {
  icon: React.ReactNode; label: string; onClick: () => void; tone: 'good' | 'bad' | 'neutral'; disabled?: boolean;
}) {
  const styles = tone === 'good' ? 'text-green-700 border-green-200 bg-green-50'
    : tone === 'bad' ? 'text-red-700 border-red-200 bg-red-50'
    : 'text-gray-700 border-gray-200 bg-white';
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-medium disabled:opacity-50 ${styles}`}>
      {icon}{label}
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
