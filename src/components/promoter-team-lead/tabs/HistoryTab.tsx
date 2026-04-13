// src/components/promoter-team-lead/tabs/HistoryTab.tsx
import React, { useEffect, useState } from 'react';
import { DailyReportWithEntries, getReportHistory } from '../promoter-tl-api';

interface Props {
  teamLeadId: string;
}

const PAGE_SIZE = 20;

export function HistoryTab({ teamLeadId }: Props) {
  const [reports, setReports] = useState<DailyReportWithEntries[]>([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = async (p: number) => {
    setLoading(true);
    const data = await getReportHistory(teamLeadId, p, PAGE_SIZE);
    if (p === 0) {
      setReports(data);
    } else {
      setReports(prev => [...prev, ...data]);
    }
    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
  };

  useEffect(() => { loadPage(0); }, [teamLeadId]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-KE', {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
    });

  if (loading && reports.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#E60000', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-3">📋</div>
        <p className="font-semibold text-gray-700">No reports yet</p>
        <p className="text-sm text-gray-400 mt-1">Submitted reports will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">

      <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold px-1">
        Past Reports — {reports.length} shown
      </p>

      {reports.map(report => (
        <div key={report.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Report header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <div>
              <p className="text-sm font-bold text-gray-900">{formatDate(report.report_date)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Submitted {report.submitted_at
                  ? new Date(report.submitted_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
            </div>
            <div className="rounded-xl px-3 py-1.5 text-center bg-gray-900">
              <p className="text-white font-bold text-lg leading-none">{report.total_gas}</p>
              <p className="text-white/50 text-[9px] uppercase tracking-wide">GAs</p>
            </div>
          </div>

          {/* Per-promoter rows */}
          {report.entries.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-3">No entries recorded</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {report.entries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{entry.promoter_name}</p>
                    <p className="text-[11px] text-gray-400">{entry.promoter_msisdn}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#E60000' }}>{entry.ga_count} GAs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {hasMore && (
        <button
          onClick={() => { const next = page + 1; setPage(next); loadPage(next); }}
          disabled={loading}
          className="w-full py-3 bg-white rounded-2xl shadow-sm text-sm font-semibold text-gray-600 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}

    </div>
  );
}
