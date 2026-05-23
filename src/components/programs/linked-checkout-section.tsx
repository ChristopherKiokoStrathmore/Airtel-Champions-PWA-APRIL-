// Linked Checkout Section — Steve Jobs Edition
// "Simplicity is the ultimate sophistication."
// Clean, minimal, typography-driven design with purposeful whitespace

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Gauge, ArrowRight, Users, TrendingUp, AlertTriangle, Lightbulb, ChevronDown, Smartphone } from 'lucide-react';

export interface LinkedMSISDN {
  id: string;
  msisdn: string;
  site_name?: string;
  ga_done: string;
  fromCheckIn: boolean;
}

interface LinkedCheckoutSectionProps {
  linkedMSISDNs: LinkedMSISDN[];
  setLinkedMSISDNs: React.Dispatch<React.SetStateAction<LinkedMSISDN[]>>;
  morningOdometer?: number | null;
  currentOdometer?: number | null;
  onOdometerChange?: (value: number | null) => void;
  onOdometerBlur?: () => void;
}

export function LinkedCheckoutSection({ linkedMSISDNs, setLinkedMSISDNs, morningOdometer, currentOdometer, onOdometerChange, onOdometerBlur }: LinkedCheckoutSectionProps) {
  const [newMSISDN, setNewMSISDN] = useState('');
  const [addError, setAddError] = useState('');
  const [showAddField, setShowAddField] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const odoInputRef = useRef<HTMLInputElement>(null);
  const [localOdometer, setLocalOdometer] = useState<string>(
    currentOdometer !== null && currentOdometer !== undefined ? String(currentOdometer) : ''
  );
  const hadValidDistanceRef = useRef(false);
  // Track whether we've already auto-focused the odometer input (prevent re-focus on every GA keystroke)
  const hasAutoFocusedOdo = useRef(false);

  const totalGAs = linkedMSISDNs.reduce((sum, m) => sum + (parseInt(m.ga_done) || 0), 0);
  const fromCheckInCount = linkedMSISDNs.filter(m => m.fromCheckIn).length;
  const manualCount = linkedMSISDNs.filter(m => !m.fromCheckIn).length;

  // Odometer calculations
  const hasMorning = morningOdometer !== null && morningOdometer !== undefined;
  // When we own the input (onOdometerChange provided), use localOdometer as source of truth
  // This handles the case where the parent has no odometer form field to store/read back the value
  const effectiveCurrentOdometer = onOdometerChange
    ? (localOdometer !== '' ? parseFloat(localOdometer) : null)
    : (currentOdometer !== null && currentOdometer !== undefined ? currentOdometer : null);
  const hasCurrent = effectiveCurrentOdometer !== null && !isNaN(effectiveCurrentOdometer);
  const distance = hasMorning && hasCurrent ? effectiveCurrentOdometer - morningOdometer : null;
  const isValidDistance = distance !== null && distance >= 0;

  // Auto-focus the odometer input when the tracker card appears — ONCE ONLY
  useEffect(() => {
    if (hasMorning && onOdometerChange && odoInputRef.current && !hasAutoFocusedOdo.current) {
      hasAutoFocusedOdo.current = true;
      const timer = setTimeout(() => {
        odoInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [hasMorning]); // ⚠️ intentionally exclude onOdometerChange — it's a new ref every render

  // Haptic feedback when a valid distance is first calculated
  useEffect(() => {
    if (isValidDistance && !hadValidDistanceRef.current) {
      hadValidDistanceRef.current = true;
      if (navigator.vibrate) {
        navigator.vibrate([15, 50, 15]);
      }
    }
    if (!isValidDistance) {
      hadValidDistanceRef.current = false;
    }
  }, [isValidDistance]);

  return (
    <div className="space-y-5 mb-8">

      {/* ══════════════════════════════════════════════════════
          ODOMETER TRACKER — Minimal, data-forward
          ═══════════════════════════════════════════════════════ */}
      {hasMorning && (
        <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
          {/* Minimal Header */}
          <div className="px-5 pt-5 pb-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
              <Gauge className="w-[18px] h-[18px] text-white" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">Odometer</h3>
              <p className="text-[11px] text-gray-400 font-medium">Distance tracker</p>
            </div>
          </div>

          {/* Three Column Data */}
          <div className="px-5 pb-5">
            <div className="flex items-stretch gap-px bg-gray-100 rounded-2xl overflow-hidden">
              {/* Morning */}
              <div className="flex-1 bg-white px-3 py-4 text-center first:rounded-l-2xl">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-2">Start</div>
                <div className="text-xl font-bold text-gray-900 tabular-nums tracking-tight">
                  {morningOdometer?.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-300 mt-1 font-medium">km</div>
              </div>

              {/* Now */}
              <div className={`flex-1 bg-white px-3 py-4 text-center`}>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.08em] mb-2">Now</div>
                {onOdometerChange ? (
                  <input
                    ref={odoInputRef}
                    type="number"
                    inputMode="numeric"
                    value={localOdometer}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setLocalOdometer(raw);
                      const num = raw === '' ? null : parseFloat(raw);
                      onOdometerChange(num);
                    }}
                    onBlur={onOdometerBlur}
                    placeholder="Enter"
                    className="w-full text-xl font-bold tabular-nums tracking-tight text-center bg-transparent border-b-2 border-dashed border-gray-200 focus:border-gray-900 outline-none pb-0.5 transition-colors text-gray-900 placeholder:text-gray-300 placeholder:font-medium placeholder:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                ) : (
                  <div className={`text-xl font-bold tabular-nums tracking-tight ${
                    hasCurrent ? 'text-gray-900' : 'text-gray-200'
                  }`}>
                    {hasCurrent ? currentOdometer?.toLocaleString() : '—'}
                  </div>
                )}
                <div className="text-[10px] text-gray-300 mt-1 font-medium">km</div>
              </div>

              {/* Distance */}
              <div className={`flex-1 px-3 py-4 text-center last:rounded-r-2xl ${
                isValidDistance
                  ? 'bg-gray-900'
                  : hasCurrent && distance !== null && distance < 0
                  ? 'bg-red-50'
                  : 'bg-white'
              }`}>
                <div className={`text-[10px] font-semibold uppercase tracking-[0.08em] mb-2 ${
                  isValidDistance ? 'text-gray-400' : hasCurrent && distance !== null && distance < 0 ? 'text-red-400' : 'text-gray-400'
                }`}>Distance</div>
                <div className={`text-xl font-bold tabular-nums tracking-tight ${
                  isValidDistance
                    ? 'text-white'
                    : hasCurrent && distance !== null && distance < 0
                    ? 'text-red-600'
                    : 'text-gray-200'
                }`}>
                  {hasCurrent && distance !== null
                    ? distance < 0
                      ? `-${Math.abs(distance).toLocaleString()}`
                      : distance.toLocaleString()
                    : '—'
                  }
                </div>
                <div className={`text-[10px] mt-1 font-medium ${
                  isValidDistance ? 'text-gray-500' : hasCurrent && distance !== null && distance < 0 ? 'text-red-400' : 'text-gray-300'
                }`}>
                  {isValidDistance ? 'km covered' : hasCurrent && distance !== null && distance < 0 ? 'invalid' : 'km'}
                </div>
              </div>
            </div>

            {/* Invalid reading warning — clean, not alarming */}
            {hasCurrent && distance !== null && distance < 0 && (
              <div className="mt-3 flex items-start gap-2.5 px-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600 leading-relaxed">
                  Current reading is lower than the morning reading. Please double-check the odometer.
                </p>
              </div>
            )}

            {/* Hint when no current reading — subtle, helpful */}
            {!hasCurrent && onOdometerChange && (
              <div className="mt-3 flex items-start gap-2.5 px-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Tap the <strong>Now</strong> column above to enter your current reading.
                </p>
              </div>
            )}
            {!hasCurrent && !onOdometerChange && (
              <div className="mt-3 flex items-start gap-2.5 px-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Enter today's odometer reading in the form field to see distance.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          PROMOTER MSISDNs — Clean list, elegant interactions
          ═══════════════════════════════════════════════════════ */}
      <div className="rounded-2xl bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
                <Users className="w-[18px] h-[18px] text-white" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">Promoters</h3>
                <p className="text-[11px] text-gray-400 font-medium">
                  {fromCheckInCount} synced{manualCount > 0 ? ` · ${manualCount} added` : ''}
                </p>
              </div>
            </div>
            {/* Total GAs pill */}
            <div className="flex flex-col items-end">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.06em]">Total GAs</div>
              <div className="text-2xl font-bold text-gray-900 tabular-nums tracking-tight leading-tight">{totalGAs}</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-5" />

        {/* MSISDN List */}
        <div className="max-h-[340px] overflow-y-auto">
          {linkedMSISDNs.map((msisdn, index) => (
            <div
              key={msisdn.id}
              className={`px-5 py-3.5 flex items-center gap-3 transition-colors ${
                index !== linkedMSISDNs.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              {/* Index */}
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-400">{index + 1}</span>
              </div>

              {/* MSISDN + Site */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold text-gray-900 tracking-wide">{msisdn.msisdn}</span>
                  {msisdn.fromCheckIn ? (
                    <span className="text-[9px] px-1.5 py-[2px] rounded-md font-semibold bg-gray-100 text-gray-500 uppercase tracking-wider">Synced</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-[2px] rounded-md font-semibold bg-blue-50 text-blue-500 uppercase tracking-wider">New</span>
                  )}
                </div>
                {msisdn.site_name && (
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{msisdn.site_name}</p>
                )}
              </div>

              {/* GA Input — minimal, focused */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">GA</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={msisdn.ga_done}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLinkedMSISDNs(prev => prev.map((m, i) =>
                      i === index ? { ...m, ga_done: val } : m
                    ));
                  }}
                  placeholder="0"
                  className="w-14 px-2 py-1.5 text-center text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 focus:outline-none transition-all"
                />
              </div>

              {/* Remove — only for manually added */}
              {!msisdn.fromCheckIn && (
                <button
                  type="button"
                  onClick={() => setLinkedMSISDNs(prev => prev.filter((_, i) => i !== index))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* Empty state */}
          {linkedMSISDNs.length === 0 && (
            <div className="px-5 py-12 text-center">
              <Smartphone className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">No promoters from check-in</p>
              <p className="text-[11px] text-gray-300 mt-1">Add MSISDNs manually below</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Add New MSISDN — expandable, clean */}
        <div className="px-5 py-3">
          {!showAddField ? (
            <button
              type="button"
              onClick={() => { setShowAddField(true); setTimeout(() => inputRef.current?.focus(), 100); }}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add promoter
            </button>
          ) : (
            <div>
              {addError && (
                <p className="text-[11px] text-red-500 mb-2 font-medium">{addError}</p>
              )}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="tel"
                  inputMode="numeric"
                  value={newMSISDN}
                  onChange={(e) => { setNewMSISDN(e.target.value.replace(/\D/g, '')); setAddError(''); }}
                  placeholder="Enter MSISDN..."
                  maxLength={12}
                  className="flex-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900/10 focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newMSISDN.length >= 10) {
                      if (linkedMSISDNs.some(m => m.msisdn === newMSISDN)) {
                        setAddError('Already added');
                        return;
                      }
                      setLinkedMSISDNs(prev => [...prev, {
                        id: `manual-${Date.now()}`,
                        msisdn: newMSISDN,
                        ga_done: '',
                        fromCheckIn: false,
                      }]);
                      setNewMSISDN('');
                      setAddError('');
                    }
                  }}
                  disabled={newMSISDN.length < 10}
                  className="px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-[0.97]"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddField(false); setNewMSISDN(''); setAddError(''); }}
                  className="px-3 py-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Footer — clean stats */}
        {linkedMSISDNs.length > 0 && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-medium">
                {linkedMSISDNs.length} promoter{linkedMSISDNs.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[13px] text-gray-900 font-bold tabular-nums">
                  {totalGAs} GAs
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// CHECK-IN REQUIRED BLOCK — Calm authority, not panic
// ═══════════════════════════════════════════════════════════
interface LinkedCheckoutBlockProps {
  onClose: () => void;
}

export function LinkedCheckoutBlock({ onClose }: LinkedCheckoutBlockProps) {
  return (
    <div className="overflow-hidden">
      {/* Clean header */}
      <div className="px-8 pt-10 pb-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Check-In First</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-[260px] mx-auto leading-relaxed">
          Complete today's check-in before you can submit a checkout.
        </p>
      </div>

      {/* Steps — minimal, numbered */}
      <div className="px-8 pb-6">
        <div className="bg-gray-50 rounded-2xl p-5 space-y-4">
          {[
            { step: 1, text: 'Open MINI ROAD SHOW — CHECK IN' },
            { step: 2, text: 'Start your session and add sites + MSISDNs' },
            { step: 3, text: 'Return here to check out' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[11px] font-bold text-white">{step}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="px-8 pb-8">
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all active:scale-[0.98]"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}