// ODU Reconciliation & Payment — payable requests grouped by installer,
// month-end batch generation, CSV export, mark-paid. (Payment itself is offline.)
import React, { useEffect, useState, useCallback } from 'react';
import { Download, RefreshCw, Banknote, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getPayableRequests, getPaymentBatches, generatePaymentBatch, markBatchPaid } from './odu-api';
import type { OduRequest, OduPaymentBatch } from './odu-types';

export function ODURecon({ currentUser }: { currentUser?: { name?: string; phone?: string } }) {
  const [payable, setPayable] = useState<OduRequest[]>([]);
  const [batches, setBatches] = useState<OduPaymentBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, b] = await Promise.all([getPayableRequests(), getPaymentBatches()]);
      setPayable(p); setBatches(b);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Group payable by installer
  const groups = new Map<string, { name: string; units: number; amount: number; rows: OduRequest[] }>();
  payable.forEach(r => {
    const key = String(r.installer_id ?? 'unassigned');
    const g = groups.get(key) || { name: r.installer_name || 'Unassigned', units: 0, amount: 0, rows: [] };
    g.units += 1; g.amount += r.payable_amount || 0; g.rows.push(r);
    groups.set(key, g);
  });
  const totalUnits = payable.length;
  const totalAmount = payable.reduce((s, r) => s + (r.payable_amount || 0), 0);

  const generate = async () => {
    setLoading(true);
    try {
      const id = await generatePaymentBatch(month, currentUser?.phone || currentUser?.name || 'hq');
      toast.success(`Batch generated for ${month}`);
      // Export immediately using the freshly-claimed payable rows we already have
      exportCSV(month, payable);
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const markPaid = async (id: string) => {
    if (!window.confirm('Mark this batch as PAID? This closes out all its requests.')) return;
    setLoading(true);
    try { await markBatchPaid(id); toast.success('Batch marked paid'); await load(); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reconciliation & Payment</h1>
          <p className="text-gray-500 text-sm">Delivered + matched-to-inactive-list = payable. Pay KSh 600/unit (300 fare + 300 incentive).</p>
        </div>
        <button onClick={load} className="p-2 text-gray-500"><RefreshCw className="w-5 h-5" /></button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <Card label="Payable units" value={totalUnits.toLocaleString()} />
        <Card label="Payable amount" value={`KSh ${totalAmount.toLocaleString()}`} tone="good" />
        <Card label="Installers" value={String(groups.size)} />
      </div>

      {/* Generate batch */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-gray-700">Month</label>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        <button onClick={generate} disabled={loading || totalUnits === 0}
          className="px-4 py-2 rounded-lg bg-green-600 text-white font-medium flex items-center gap-2 disabled:opacity-50">
          <Banknote className="w-4 h-4" /> Generate batch + export CSV</button>
        <button onClick={() => exportCSV(month, payable)} disabled={totalUnits === 0}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium flex items-center gap-2 disabled:opacity-50">
          <Download className="w-4 h-4" /> Export current payable</button>
      </div>

      {/* By installer */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 font-semibold text-gray-900">Payable by installer</div>
        <div className="divide-y">
          {[...groups.values()].sort((a, b) => b.amount - a.amount).map((g, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between">
              <span className="font-medium text-gray-900">{g.name}</span>
              <span className="text-sm text-gray-500">{g.units} units</span>
              <span className="font-semibold text-green-700">KSh {g.amount.toLocaleString()}</span>
            </div>
          ))}
          {groups.size === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">Nothing payable yet.</div>}
        </div>
      </div>

      {/* Batches */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50 font-semibold text-gray-900">Payment batches</div>
        <div className="divide-y">
          {batches.map(b => (
            <div key={b.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{b.month_year}</p>
                <p className="text-xs text-gray-500">{new Date(b.generated_at).toLocaleString()} · {b.total_units} units · KSh {b.total_amount.toLocaleString()}</p>
              </div>
              {b.status === 'paid' ? (
                <span className="flex items-center gap-1 text-green-700 text-sm font-semibold"><CheckCircle className="w-4 h-4" /> Paid</span>
              ) : (
                <button onClick={() => markPaid(b.id)} className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm">Mark paid</button>
              )}
            </div>
          ))}
          {batches.length === 0 && <div className="px-5 py-8 text-center text-gray-400 text-sm">No batches yet.</div>}
        </div>
      </div>
    </div>
  );
}

function exportCSV(month: string, rows: OduRequest[]) {
  const data = rows.map(r => ({
    Installer: r.installer_name || '',
    InstallerID: r.installer_id ?? '',
    Customer: r.customer?.customer_name || '',
    MSISDN: r.customer?.msisdn || '',
    Town: r.customer?.town || '',
    DeliveredAt: r.delivered_at || '',
    Amount_KSh: r.payable_amount || 0,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'ODU Payments');
  XLSX.writeFile(wb, `odu_payments_${month}.csv`, { bookType: 'csv' });
}

function Card({ label, value, tone }: { label: string; value: string; tone?: 'good' }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${tone === 'good' ? 'text-green-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
