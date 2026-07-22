// ODU Upload Manager — HQ uploads the inactive-customer list (~19,000)
// Flow: Select file → Parse & validate (client-side) → Stage → Go Live → Rollback
// Backed by odu_create_batch / odu_ingest_customers / odu_batch_go_live RPCs.
import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, ChevronRight, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  createOduBatch, goLiveOduBatch, rollbackOduBatch, getOduBatches, OduUploadRow,
} from './odu-api';
import { normalizeKenyanPhone, isValidKenyanPhone } from '../hbb/hbb-api';
import type { OduBatch } from './odu-types';

type Step = 'select' | 'preview' | 'live' | 'history';

interface ParsedRow extends OduUploadRow { _row: number; _issues: string[]; }

// Flexible header matching — accepts common column-name variants.
const COL = {
  msisdn:  ['msisdn', 'phone', 'phone number', 'mobile', 'customer phone', 'number'],
  name:    ['name', 'customer name', 'customer', 'full name'],
  account: ['account', 'account number', 'acc', 'account_no', 'account no'],
  town:    ['town', 'city', 'location'],
  estate:  ['estate', 'area', 'estate name'],
  lat:     ['lat', 'latitude'],
  lng:     ['lng', 'lon', 'long', 'longitude'],
  units:   ['units', 'expected units', 'odu count', 'expected_units', 'qty'],
  imei:    ['imei', 'original imei', 'device imei'],
};

function pick(row: Record<string, any>, keys: string[]): any {
  const lowerMap: Record<string, any> = {};
  for (const k in row) lowerMap[k.toLowerCase().trim()] = row[k];
  for (const cand of keys) if (lowerMap[cand] !== undefined && lowerMap[cand] !== '') return lowerMap[cand];
  return undefined;
}

function parseSheet(rows: Record<string, any>[]): ParsedRow[] {
  return rows.map((raw, i) => {
    const rawPhone = String(pick(raw, COL.msisdn) ?? '').trim();
    const name = String(pick(raw, COL.name) ?? '').trim();
    const latRaw = pick(raw, COL.lat);
    const lngRaw = pick(raw, COL.lng);
    const unitsRaw = pick(raw, COL.units);
    const issues: string[] = [];

    const msisdn = rawPhone ? normalizeKenyanPhone(rawPhone) : '';
    if (!rawPhone) issues.push('missing phone');
    else if (!isValidKenyanPhone(msisdn)) issues.push('invalid phone');
    if (!name) issues.push('missing name');

    const lat = latRaw !== undefined && latRaw !== '' ? Number(latRaw) : null;
    const lng = lngRaw !== undefined && lngRaw !== '' ? Number(lngRaw) : null;
    if ((lat !== null && isNaN(lat)) || (lng !== null && isNaN(lng))) issues.push('bad coords');
    if (lat === null || lng === null) issues.push('no geo (will fall back to estate/town)');

    return {
      _row: i + 2, // +2: header row + 1-index
      _issues: issues,
      msisdn,
      customer_name: name,
      account_number: String(pick(raw, COL.account) ?? '').trim() || undefined,
      town: String(pick(raw, COL.town) ?? '').trim() || undefined,
      estate: String(pick(raw, COL.estate) ?? '').trim() || undefined,
      lat: lat !== null && !isNaN(lat) ? lat : null,
      lng: lng !== null && !isNaN(lng) ? lng : null,
      expected_units: unitsRaw ? Number(unitsRaw) || 2 : 2,
      original_imei: String(pick(raw, COL.imei) ?? '').trim() || undefined,
    };
  });
}

export function ODUUploadManager({ currentUser }: { currentUser?: { name?: string; phone?: string } }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('select');
  const [filename, setFilename] = useState('');
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [ingested, setIngested] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<OduBatch[]>([]);

  const blocking = parsed.filter(r =>
    r._issues.some(i => i === 'missing phone' || i === 'invalid phone' || i === 'missing name'));
  const warningsOnly = parsed.filter(r => r._issues.length && !blocking.includes(r));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setFilename(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      if (!json.length) { toast.error('The file has no data rows.'); return; }
      const rows = parseSheet(json);
      setParsed(rows);
      setStep('preview');
      toast.success(`Parsed ${rows.length} rows`);
    } catch (err: any) {
      toast.error(`Could not read file: ${err.message}`);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleStage = async () => {
    setLoading(true);
    try {
      // Only ingest rows without blocking issues
      const clean: OduUploadRow[] = parsed
        .filter(r => !blocking.includes(r))
        .map(({ _row, _issues, ...rest }) => rest);
      const res = await createOduBatch(
        filename, currentUser?.phone || currentUser?.name || 'hq', clean,
      );
      setBatchId(res.batchId);
      setIngested(res.ingested);
      toast.success(`Staged ${res.ingested} customers (batch ${res.batchId.slice(0, 8)})`);
    } catch (err: any) {
      toast.error(`Staging failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoLive = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const created = await goLiveOduBatch(batchId);
      toast.success(`Live! ${created} retrieval requests created and ready for CX.`);
      setStep('live');
    } catch (err: any) {
      toast.error(`Go-live failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (id: string) => {
    const reason = window.prompt('Reason for rollback? (only untouched "new" requests are removed)');
    if (reason === null) return;
    setLoading(true);
    try {
      const removed = await rollbackOduBatch(id, reason || 'no reason given');
      toast.success(`Rolled back — ${removed} untouched requests removed.`);
      await loadHistory();
    } catch (err: any) {
      toast.error(`Rollback failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try { setHistory(await getOduBatches()); setStep('history'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">ODU Inactive-List Upload</h1>
        <p className="text-gray-600 mb-6">Upload the inactive-customer list. Parse → Stage → Go Live → Monitor.</p>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-between">
          {['select', 'preview', 'live'].map((s, idx) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step === s ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</div>
              {idx < 2 && <div className="flex-1 h-1 mx-2 bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>

        {/* SELECT */}
        {step === 'select' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">1. Select the inactive-list file</h2>
            <div onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-600 hover:bg-red-50 transition">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="font-medium text-gray-700">Click to upload CSV / XLS / XLSX</p>
              <p className="text-sm text-gray-500">Columns (any order): MSISDN · Name · Account · Town · Estate · Lat · Lng · Units · IMEI</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" onChange={handleFile} className="hidden" />
            <button onClick={loadHistory} className="mt-6 text-gray-600 hover:text-gray-900 flex items-center gap-2">
              View upload history <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PREVIEW */}
        {step === 'preview' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">2. Review & stage — {filename}</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Stat label="Total rows" value={parsed.length} />
              <Stat label="Will import" value={parsed.length - blocking.length} tone="good" />
              <Stat label="Blocked" value={blocking.length} tone={blocking.length ? 'bad' : 'neutral'} />
            </div>

            {blocking.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">{blocking.length} rows skipped (bad phone / no name)</h3>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto text-sm text-red-800">
                  {blocking.slice(0, 20).map(r => (
                    <div key={r._row}>Row {r._row}: {r.customer_name || '(no name)'} — {r._issues.join(', ')}</div>
                  ))}
                </div>
              </div>
            )}
            {warningsOnly.length > 0 && (
              <p className="mb-4 text-sm text-yellow-700">
                {warningsOnly.length} rows import with warnings (mostly missing geo — allocation falls back to estate/town).
              </p>
            )}

            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  {['Row', 'Name', 'MSISDN', 'Town', 'Estate', 'Geo', 'Units'].map(h =>
                    <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}
                </tr></thead>
                <tbody>
                  {parsed.slice(0, 12).map(r => (
                    <tr key={r._row} className={`border-b ${blocking.includes(r) ? 'bg-red-50' : ''}`}>
                      <td className="px-3 py-2 text-gray-400">{r._row}</td>
                      <td className="px-3 py-2">{r.customer_name || '—'}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.msisdn || '—'}</td>
                      <td className="px-3 py-2">{r.town || '—'}</td>
                      <td className="px-3 py-2">{r.estate || '—'}</td>
                      <td className="px-3 py-2">{r.lat != null && r.lng != null ? '📍' : '—'}</td>
                      <td className="px-3 py-2">{r.expected_units}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.length > 12 && <p className="text-sm text-gray-500 mt-2">… and {parsed.length - 12} more</p>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setStep('select'); setParsed([]); }}
                className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">Back</button>
              {!batchId ? (
                <button onClick={handleStage} disabled={loading || parsed.length === blocking.length}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">
                  {loading ? 'Staging…' : `Stage ${parsed.length - blocking.length} customers`}</button>
              ) : (
                <button onClick={handleGoLive} disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                  {loading ? 'Going live…' : `Go Live (${ingested} staged)`}</button>
              )}
            </div>
          </div>
        )}

        {/* LIVE */}
        {step === 'live' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">List is live</h2>
            <p className="text-gray-600 mb-6">Retrieval requests created. They now appear in the CX call queue.</p>
            <button onClick={loadHistory} className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
              View upload history</button>
          </div>
        )}

        {/* HISTORY */}
        {step === 'history' && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-6">Upload history</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map(b => (
                <div key={b.id} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{b.filename}</p>
                    <p className="text-xs text-gray-500">{new Date(b.uploaded_at).toLocaleString()} • {b.total_records} records</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {b.status === 'live' && (
                      <button onClick={() => handleRollback(b.id)}
                        className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" /> Rollback</button>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      b.status === 'live' ? 'bg-green-100 text-green-700' :
                      b.status === 'rolled_back' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {b.status === 'live' ? '✓ Live' : b.status === 'rolled_back' ? '✕ Rolled back' : 'Staged'}</span>
                  </div>
                </div>
              ))}
              {!history.length && <p className="text-sm text-gray-500">No uploads yet.</p>}
            </div>
            <button onClick={() => { setStep('select'); setParsed([]); setBatchId(null); }}
              className="mt-6 w-full px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50">
              New upload</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'good' | 'bad' | 'neutral' }) {
  const c = tone === 'good' ? 'text-green-700' : tone === 'bad' ? 'text-red-700' : 'text-gray-900';
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${c}`}>{value.toLocaleString()}</p>
    </div>
  );
}
