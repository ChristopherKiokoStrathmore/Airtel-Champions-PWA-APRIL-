/**
 * Installer Calendar View
 * Monthly grid with job badges per day.
 * Tap any day → bottom sheet with jobs for that day.
 */
import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Phone, Package, Clock, X } from 'lucide-react';
import { supabase } from '../../utils/supabase/client';

const STATUS_COLOR: Record<string, { dot: string; bg: string; text: string; label: string }> = {
  assigned:   { dot: '#F59E0B', bg: '#FFFBEB', text: '#B45309', label: 'Assigned'  },
  on_way:     { dot: '#8B5CF6', bg: '#F5F3FF', text: '#6D28D9', label: 'En Route'  },
  arrived:    { dot: '#F97316', bg: '#FFF7ED', text: '#C2410C', label: 'On Site'   },
  completed:  { dot: '#10B981', bg: '#ECFDF5', text: '#047857', label: 'Done'      },
  cancelled:  { dot: '#9CA3AF', bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled' },
  rescheduled:{ dot: '#6366F1', bg: '#EEF2FF', text: '#4338CA', label: 'Rescheduled'},
};
const fallbackStatus = STATUS_COLOR.assigned;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NARROW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad(n: number) { return String(n).padStart(2, '0'); }

interface InstallerCalendarProps {
  installerId: string;
  installerIdDirect?: string; // preferred installer ID (installers.id); falls back to installerId
}

export function InstallerCalendar({ installerId, installerIdDirect }: InstallerCalendarProps) {
  const [now, setNow] = useState(new Date());
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'

  const year  = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const monthStart = `${year}-${pad(month + 1)}-01`;
    const monthEnd   = `${year}-${pad(month + 1)}-${pad(new Date(year, month + 1, 0).getDate())}`;

    // Use installerIdDirect if available (unified installers.id), fall back to installerId
    const effectiveId = installerIdDirect || installerId;
    if (!effectiveId) {
      setAllJobs([]);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('jobs')
        .select('id, customer_name, customer_phone, estate_name, town, package, scheduled_date, scheduled_time, assigned_at, status, remarks')
        .eq('installer_id', effectiveId)
        .order('scheduled_date', { ascending: true });

      const mapped = (data || []).map((j: any) => ({
        ...j,
        _source: 'jobs',
        _dateKey: j.scheduled_date || j.assigned_at?.split('T')[0],
        _time: j.scheduled_time,
      })).filter(j => {
        if (!j._dateKey) return false;
        const dk = j._dateKey.split('T')[0];
        return dk >= monthStart && dk <= monthEnd;
      });

      setAllJobs(mapped);
    } catch (err) {
      console.error('[InstallerCalendar] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [installerId, installerIdDirect, year, month]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Group by date key
  const byDay: Record<string, any[]> = {};
  allJobs.forEach(j => {
    const key = j._dateKey?.split('T')[0];
    if (!key) return;
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(j);
  });

  // Calendar grid math
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const todayKey = `${new Date().getFullYear()}-${pad(new Date().getMonth() + 1)}-${pad(new Date().getDate())}`;

  const selectedJobs = selectedDate ? (byDay[selectedDate] || []) : [];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* ── Month navigator ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setNow(new Date(year, month - 1, 1))}
            className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-900">
              {now.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{allJobs.length} job{allJobs.length !== 1 ? 's' : ''} this month</p>
          </div>
          <button
            onClick={() => setNow(new Date(year, month + 1, 1))}
            className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 pb-1">
          {DAY_NARROW.map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* ── Calendar grid ─────────────────────────────────────────────── */}
        <div className="bg-white px-3 pb-4 border-b border-gray-100">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`pad-${i}`} className="h-14" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day     = i + 1;
                const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
                const dayJobs = byDay[dateKey] || [];
                const isToday    = dateKey === todayKey;
                const isSelected = selectedDate === dateKey;
                const isPast     = dateKey < todayKey;
                const hasJobs    = dayJobs.length > 0;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                    className="h-14 flex flex-col items-center justify-start pt-1.5 rounded-xl transition-all active:scale-90"
                    style={{
                      backgroundColor: isSelected
                        ? '#E60000'
                        : isToday
                        ? 'rgba(230,0,0,0.08)'
                        : hasJobs
                        ? 'rgba(230,0,0,0.04)'
                        : 'transparent',
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: isSelected
                          ? '#fff'
                          : isToday
                          ? '#E60000'
                          : isPast
                          ? '#9ca3af'
                          : '#1f2937',
                      }}
                    >
                      {day}
                    </span>

                    {/* Status dots */}
                    {hasJobs && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-1">
                        {dayJobs.slice(0, 4).map((job, ji) => {
                          const cfg = STATUS_COLOR[job.status] || fallbackStatus;
                          return (
                            <div
                              key={ji}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : cfg.dot,
                              }}
                            />
                          );
                        })}
                        {dayJobs.length > 4 && (
                          <span
                            className="text-[8px] font-bold"
                            style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : '#9ca3af' }}
                          >
                            +{dayJobs.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Status legend ─────────────────────────────────────────────── */}
        <div className="px-4 py-3 bg-white mt-2 border-b border-gray-100">
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {Object.entries(STATUS_COLOR)
              .filter(([k]) => ['assigned', 'on_way', 'arrived', 'completed'].includes(k))
              .map(([, cfg]) => (
                <div key={cfg.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  <span className="text-[10px] text-gray-500">{cfg.label}</span>
                </div>
              ))}
          </div>
        </div>

        {/* ── Selected day job list ──────────────────────────────────────── */}
        {selectedDate ? (
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-KE', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center active:scale-90"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            </div>

            {selectedJobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-sm text-gray-400">No jobs on this day</p>
              </div>
            ) : (
              selectedJobs.map((job, i) => {
                const cfg = STATUS_COLOR[job.status] || fallbackStatus;
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.dot }} />
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {job.customer_name || 'Unknown'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          {(job.customer_phone) && (
                            <a href={`tel:${job.customer_phone}`} className="flex items-center gap-2">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{job.customer_phone}</span>
                            </a>
                          )}
                          {(job.estate_name || job.estate || job.town) && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {[job.estate_name || job.estate, job.town].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                          {job.package && (
                            <div className="flex items-center gap-2">
                              <Package className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{job.package}</span>
                            </div>
                          )}
                          {job._time && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{job._time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cfg.bg, color: cfg.text }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <p className="text-xs text-gray-400">Tap a day to see scheduled jobs</p>
          </div>
        )}
      </div>
    </div>
  );
}
