// src/components/promoter-team-lead/tabs/TodayTab.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  TLUser, PromoterMember, GasEntry,
  getActivePromoters, getOrCreateTodayReport, getGasEntriesForReport,
  upsertGasEntry, submitReport, todayDateString, DailyReport,
} from '../promoter-tl-api';

interface Props {
  tlUser: TLUser;
  refreshKey: number;
  onTotalChange: (total: number) => void;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#E60000,#ff4444)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#3b82f6,#60a5fa)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
];
const avatarGradient = (i: number) => AVATAR_COLORS[i % AVATAR_COLORS.length];
const initials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

const formatDisplayDate = (dateStr: string) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

export function TodayTab({ tlUser, refreshKey, onTotalChange }: Props) {
  const [promoters,   setPromoters]   = useState<PromoterMember[]>([]);
  const [report,      setReport]      = useState<DailyReport | null>(null);
  const [entries,     setEntries]     = useState<Record<string, number>>({});
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [members, todayReport] = await Promise.all([
      getActivePromoters(tlUser.id),
      getOrCreateTodayReport(tlUser.id),
    ]);
    setPromoters(members);
    setReport(todayReport);

    if (todayReport) {
      const saved = await getGasEntriesForReport(todayReport.id);
      const map: Record<string, number> = {};
      saved.forEach((e: GasEntry) => { map[e.promoter_msisdn] = e.ga_count; });
      setEntries(map);
      const total = saved.reduce((s: number, e: GasEntry) => s + e.ga_count, 0);
      onTotalChange(total);
    }
    setLoading(false);
  }, [tlUser.id, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const total       = Object.values(entries).reduce((s, v) => s + (v || 0), 0);
  const filledCount = Object.values(entries).filter(v => v > 0).length;
  const isLocked    = report?.is_locked ?? false;

  const handleGaChange = async (msisdn: string, name: string, raw: string) => {
    if (isLocked || !report) return;
    const count = Math.max(0, parseInt(raw, 10) || 0);
    setEntries(prev => {
      const next = { ...prev, [msisdn]: count };
      onTotalChange(Object.values(next).reduce((s, v) => s + (v || 0), 0));
      return next;
    });
    await upsertGasEntry(report.id, tlUser.id, msisdn, name, count);
  };

  const handleSubmit = async () => {
    if (!report || isLocked) return;
    setSubmitError('');
    setSubmitting(true);

    await Promise.all(
      promoters.map(p =>
        upsertGasEntry(report.id, tlUser.id, p.msisdn, p.promoter_name, entries[p.msisdn] ?? 0)
      )
    );

    const { error } = await submitReport(report.id, total);
    if (error) { setSubmitError(error); setSubmitting(false); return; }

    setReport(prev => prev ? { ...prev, is_locked: true } : prev);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#E60000', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">

      {/* Date badge */}
      <div className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {report ? formatDisplayDate(report.report_date) : formatDisplayDate(todayDateString())}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{tlUser.full_name} · {tlUser.se_cluster}</p>
        </div>
        {isLocked && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
            ✓ Submitted
          </span>
        )}
      </div>

      {/* Promoter rows */}
      {promoters.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-sm text-gray-400">No promoters yet.</p>
          <p className="text-xs text-gray-400 mt-1">Go to the Promoters tab to add your team.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {promoters.map((p, idx) => {
            const val    = entries[p.msisdn] ?? 0;
            const filled = val > 0;
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: avatarGradient(idx) }}
                >
                  {initials(p.promoter_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.promoter_name}</p>
                  <p className="text-xs text-gray-400">{p.msisdn}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    min={0}
                    value={val === 0 && !filled ? '' : val}
                    placeholder="—"
                    readOnly={isLocked}
                    onChange={e => handleGaChange(p.msisdn, p.promoter_name, e.target.value)}
                    className="w-14 h-10 text-center text-lg font-bold rounded-xl border-2 outline-none transition-all"
                    style={{
                      background:   isLocked ? '#f9fafb' : filled ? '#fff5f5' : '#f9fafb',
                      borderColor:  isLocked ? '#e5e7eb' : filled ? '#E60000' : '#e5e7eb',
                      color:        isLocked ? '#9ca3af' : filled ? '#E60000' : '#9ca3af',
                      cursor:       isLocked ? 'not-allowed' : 'text',
                    }}
                  />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">GAs</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total bar */}
      {promoters.length > 0 && (
        <div className="rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg" style={{ background: '#1c1c1e' }}>
          <div>
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Team Total</p>
            <p className="text-3xl font-black text-white tracking-tight mt-0.5">
              {total} <span className="text-lg font-bold text-white/60">GAs</span>
            </p>
            <p className="text-[10px] text-white/40 mt-1">
              {report ? formatDisplayDate(report.report_date) : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">{filledCount} of {promoters.length} filled</p>
            <p className="text-2xl mt-1">📊</p>
          </div>
        </div>
      )}

      {/* Submit */}
      {promoters.length > 0 && (
        <>
          {submitError && (
            <p className="text-xs font-medium text-center px-2" style={{ color: '#E60000' }}>{submitError}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={isLocked || submitting}
            className="w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all active:scale-[0.98] text-white disabled:opacity-50"
            style={{
              background:  isLocked ? '#10b981' : '#E60000',
              boxShadow:   isLocked ? 'none' : '0 4px 20px rgba(230,0,0,0.35)',
              cursor:      isLocked ? 'default' : 'pointer',
            }}
          >
            {isLocked ? '✓ Report Submitted' : submitting ? 'Submitting…' : "Submit Today's Report"}
          </button>
        </>
      )}

    </div>
  );
}
