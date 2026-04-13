// HBB Calendar Slot Picker — Google Calendar-style appointment booking
// Algorithm: "Earliest Available Slot with Backfill"
// 
// The problem: If we just assign the "next available" slot, but a closer slot
// opens up (cancellation/reschedule), users would miss it.
//
// Solution: We compute availability per-day by checking existing bookings
// against installer capacity. We scan the next 14 days, for each day we
// calculate how many slots are taken vs total capacity, then present slots
// with real-time availability. When a cancellation opens a gap, it immediately
// appears because we recompute on every render. This is a "greedy scan with
// live backfill" — no stale future bookings block closer open slots.

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, Users, Check, Zap, X } from 'lucide-react';
import { getCalendarAvailability } from './hbb-api';
import { TIME_SLOTS, SLOT_DURATION_HOURS } from './hbb-data';

const ACCENT = '#E60000';
const DAYS_TO_SCAN = 14;

interface Props {
  townId: number | null;
  onSelect: (date: string, time: string) => void;
  onClose: () => void;
  selectedDate?: string;
  selectedTime?: string;
}

interface DayAvailability {
  date: string;
  dateObj: Date;
  dayLabel: string;
  totalCapacity: number;   // total installer slots for this day
  booked: number;          // already booked
  available: number;       // remaining
  slots: SlotInfo[];
}

interface SlotInfo {
  time: string;
  label: string;
  available: number;       // how many installers can take this slot
  total: number;
  status: 'open' | 'limited' | 'full';
}

export function HBBCalendarPicker({ townId, onSelect, onClose, selectedDate, selectedTime }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickedDate, setPickedDate] = useState(selectedDate || '');
  const [pickedTime, setPickedTime] = useState(selectedTime || '');

  // ─── Compute date range ──────────────────────────────────────────────
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() + 1); // Start from tomorrow
    
    const days: Date[] = [];
    for (let i = 0; i < DAYS_TO_SCAN; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      // Skip Sundays
      if (d.getDay() !== 0) {
        days.push(d);
      }
    }
    return days;
  }, []);

  // ─── Fetch availability ──────────────────────────────────────────────
  const fetchAvailability = useCallback(async () => {
    if (!townId) {
      setAvailability([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const startDate = dateRange[0]?.toISOString().split('T')[0];
      const endDate = dateRange[dateRange.length - 1]?.toISOString().split('T')[0];

      if (!startDate || !endDate) {
        setAvailability([]);
        setLoading(false);
        return;
      }

      const result = await getCalendarAvailability(townId, startDate, endDate);
      const { installerCount, totalDailyCapacity, bookings } = result;

      // Build booking map: date -> time -> count
      const bookingMap: Record<string, Record<string, number>> = {};
      (bookings || []).forEach((b: any) => {
        const date = b.preferred_date;
        const time = b.preferred_time || 'unscheduled';
        if (!bookingMap[date]) bookingMap[date] = {};
        bookingMap[date][time] = (bookingMap[date][time] || 0) + 1;
      });

      // Compute per-day availability
      const days: DayAvailability[] = dateRange.map(dateObj => {
        const dateStr = dateObj.toISOString().split('T')[0];
        const dayBookings = bookingMap[dateStr] || {};
        const totalBookedToday = Object.values(dayBookings).reduce((s, n) => s + n, 0);

        const slots: SlotInfo[] = TIME_SLOTS.map(ts => {
          const bookedForSlot = dayBookings[ts.label] || dayBookings[ts.id] || 0;
          const availableInstallers = Math.max(0, installerCount - bookedForSlot);

          return {
            time: ts.id,
            label: ts.label,
            available: availableInstallers,
            total: installerCount,
            status: availableInstallers === 0 ? 'full' as const
              : availableInstallers <= 1 ? 'limited' as const
              : 'open' as const,
          };
        });

        return {
          date: dateStr,
          dateObj,
          dayLabel: dateObj.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' }),
          totalCapacity: totalDailyCapacity,
          booked: totalBookedToday,
          available: Math.max(0, totalDailyCapacity - totalBookedToday),
          slots,
        };
      });

      setAvailability(days);
    } catch (err) {
      console.error('[HBB Calendar] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [townId, dateRange]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  // ─── Visible week ────────────────────────────────────────────────────
  const visibleDays = availability.slice(weekOffset * 7, (weekOffset + 1) * 7);
  const maxWeeks = Math.ceil(availability.length / 7);
  const selectedDay = availability.find(d => d.date === pickedDate);

  // ─── Find first available slot (for suggestion) ──────────────────────
  const firstAvailable = useMemo(() => {
    for (const day of availability) {
      const openSlot = day.slots.find(s => s.status !== 'full');
      if (openSlot) return { date: day.date, time: openSlot.time, dayLabel: day.dayLabel, slotLabel: openSlot.label };
    }
    return null;
  }, [availability]);

  const handleConfirm = () => {
    if (pickedDate && pickedTime) {
      const slot = TIME_SLOTS.find(s => s.id === pickedTime);
      onSelect(pickedDate, slot?.label || pickedTime);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Schedule Installation</h3>
            <p className="text-xs text-gray-500">Pick a date & time slot</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : !townId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-gray-400">
            <Clock className="w-8 h-8 mb-2" />
            <p className="text-sm">Select a town first</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* First Available Suggestion */}
            {firstAvailable && !pickedDate && (
              <button
                onClick={() => { setPickedDate(firstAvailable.date); setPickedTime(firstAvailable.time); }}
                className="mx-4 mt-3 p-3 rounded-2xl border-2 flex items-center gap-3 active:scale-[0.98] transition-all"
                style={{ borderColor: ACCENT, backgroundColor: '#F0FAFF' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-xs font-semibold" style={{ color: ACCENT }}>Earliest Available</p>
                  <p className="text-sm font-bold text-gray-900">
                    {firstAvailable.dayLabel} at {firstAvailable.slotLabel}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4" style={{ color: ACCENT }} />
              </button>
            )}

            {/* Week Navigation */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <button
                onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
                className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs font-semibold text-gray-600">
                {visibleDays[0]?.dayLabel} — {visibleDays[visibleDays.length - 1]?.dayLabel}
              </span>
              <button
                onClick={() => setWeekOffset(Math.min(maxWeeks - 1, weekOffset + 1))}
                disabled={weekOffset >= maxWeeks - 1}
                className="p-1.5 rounded-lg bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Day Selector (horizontal scroll) */}
            <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
              {visibleDays.map(day => {
                const isSelected = pickedDate === day.date;
                const hasSlots = day.available > 0;
                const dayOfWeek = day.dateObj.toLocaleDateString('en-KE', { weekday: 'short' });
                const dayNum = day.dateObj.getDate();

                return (
                  <button
                    key={day.date}
                    onClick={() => { setPickedDate(day.date); setPickedTime(''); }}
                    disabled={!hasSlots}
                    className={`flex-shrink-0 w-16 py-2 rounded-2xl flex flex-col items-center gap-0.5 transition-all border-2
                      ${isSelected ? 'shadow-lg scale-105' : 'border-transparent'}
                      ${!hasSlots ? 'opacity-40' : 'active:scale-95'}
                    `}
                    style={isSelected
                      ? { backgroundColor: ACCENT, borderColor: ACCENT }
                      : { backgroundColor: hasSlots ? '#F3F4F6' : '#F9FAFB' }
                    }
                  >
                    <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                      {dayOfWeek}
                    </span>
                    <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {dayNum}
                    </span>
                    {hasSlots ? (
                      <span className={`text-[9px] font-medium ${isSelected ? 'text-white/70' : 'text-green-600'}`}>
                        {day.available} slot{day.available !== 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-red-400">Full</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Time Slots for Selected Day */}
            {selectedDay && (
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">
                    Available times for {selectedDay.dayLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {selectedDay.slots.map(slot => {
                    const isSelected = pickedTime === slot.time && pickedDate === selectedDay.date;
                    const isFull = slot.status === 'full';

                    return (
                      <button
                        key={slot.time}
                        onClick={() => !isFull && setPickedTime(slot.time)}
                        disabled={isFull}
                        className={`relative p-3 rounded-xl border-2 transition-all text-left
                          ${isFull ? 'opacity-40 border-gray-200 bg-gray-50' : ''}
                          ${isSelected ? 'shadow-md scale-[1.02]' : 'border-gray-200 active:scale-95'}
                        `}
                        style={isSelected ? { borderColor: ACCENT, backgroundColor: '#FEF2F2' } : {}}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: ACCENT }}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <p className={`text-sm font-semibold ${isSelected ? '' : 'text-gray-900'}`}
                          style={isSelected ? { color: ACCENT } : {}}>
                          {slot.label}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          {isFull ? (
                            <span className="text-[10px] text-red-500 font-medium">Fully booked</span>
                          ) : slot.status === 'limited' ? (
                            <span className="text-[10px] text-orange-500 font-medium">
                              {slot.available} installer left
                            </span>
                          ) : (
                            <span className="text-[10px] text-green-600 font-medium">
                              {slot.available} available
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <LegendDot color="#10B981" label="Available" />
                  <LegendDot color="#F59E0B" label="Limited" />
                  <LegendDot color="#EF4444" label="Full" />
                </div>
              </div>
            )}

            {!selectedDay && pickedDate === '' && (
              <div className="px-4 pb-6 text-center text-gray-400">
                <p className="text-sm">Select a date above to see time slots</p>
              </div>
            )}
          </div>
        )}

        {/* Confirm Button */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2 safe-bottom">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-sm active:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!pickedDate || !pickedTime}
            className="flex-1 py-3 rounded-2xl text-white font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
            style={{ backgroundColor: ACCENT }}
          >
            Confirm Slot
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}