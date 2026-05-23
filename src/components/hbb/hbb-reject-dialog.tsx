/**
 * Installer Rejection Dialog
 * Shown when installer taps "Decline" on a new job request.
 * Captures a mandatory reason + optional notes before submitting.
 */
import { useState } from 'react';
import { XCircle, AlertTriangle, MapPin, Phone, Package } from 'lucide-react';

export const REJECTION_REASONS = [
  { value: 'too_far',            label: 'Too far from my current location' },
  { value: 'at_capacity',        label: 'Already at maximum jobs today' },
  { value: 'outside_area',       label: 'Outside my service area' },
  { value: 'customer_issue',     label: 'Customer unreachable or unresponsive' },
  { value: 'equipment_issue',    label: 'Missing tools / equipment issue' },
  { value: 'emergency',          label: 'Personal emergency — temporarily unavailable' },
  { value: 'other',              label: 'Other (please describe below)' },
];

interface RejectDialogProps {
  job: {
    id: number;
    customer_name?: string;
    customer_phone?: string;
    estate?: string;
    estate_name?: string;
    zone?: string;
    town?: string;
    package?: string;
    assigned_at?: string;
  };
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectDialog({ job, onConfirm, onCancel }: RejectDialogProps) {
  const [selected, setSelected] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const needsNotes = selected === 'other';
  const canSubmit = selected !== '' && (!needsNotes || notes.trim().length > 4);

  const handleConfirm = () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    const label = REJECTION_REASONS.find(r => r.value === selected)?.label ?? selected;
    const full = notes.trim() ? `${label}: ${notes.trim()}` : label;
    onConfirm(full);
  };

  const location = job.estate || job.estate_name || job.zone || job.town || '';
  const elapsed = job.assigned_at
    ? Math.round((Date.now() - new Date(job.assigned_at).getTime()) / 60000)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full bg-white overflow-y-auto"
        style={{ borderRadius: '24px 24px 0 0', maxHeight: '88vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pb-8 pt-2 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">Decline Job Request</p>
              {elapsed !== null && (
                <p className="text-xs text-gray-400">Received {elapsed}m ago</p>
              )}
            </div>
          </div>

          {/* Job summary */}
          <div className="bg-gray-50 rounded-2xl p-3.5 space-y-2">
            {job.customer_name && (
              <p className="text-sm font-bold text-gray-900">{job.customer_name}</p>
            )}
            {job.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600">{job.customer_phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600">{location}</span>
              </div>
            )}
            {job.package && (
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-600">{job.package}</span>
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2.5 bg-amber-50 rounded-2xl p-3.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Declining this job will automatically reassign it to another available installer in your area. Your decline reason is recorded.
            </p>
          </div>

          {/* Reason options */}
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2.5 uppercase tracking-wide">
              Reason for declining <span className="text-red-500">*</span>
            </p>
            <div className="space-y-2">
              {REJECTION_REASONS.map(reason => {
                const isSelected = selected === reason.value;
                return (
                  <button
                    key={reason.value}
                    onClick={() => setSelected(reason.value)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98]"
                    style={{
                      borderColor: isSelected ? '#E60000' : '#e5e7eb',
                      backgroundColor: isSelected ? 'rgba(230,0,0,0.04)' : '#fff',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ borderColor: isSelected ? '#E60000' : '#d1d5db' }}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-red-600" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 leading-snug">{reason.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {selected && (
            <div>
              <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                {needsNotes ? 'Description *' : 'Additional notes (optional)'}
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={needsNotes ? 'Please describe the reason…' : 'Any other details for the record…'}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-2xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500 transition-shadow"
                style={{ borderColor: '#e5e7eb' }}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onCancel}
              className="py-3.5 rounded-2xl text-sm font-semibold text-gray-700 bg-gray-100 active:bg-gray-200 transition-colors"
            >
              Keep Job
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canSubmit || submitting}
              className="py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: canSubmit
                  ? 'linear-gradient(135deg, #CC0000, #E60000)'
                  : '#e5e7eb',
                color: canSubmit ? '#fff' : '#9ca3af',
              }}
            >
              {submitting ? 'Declining…' : 'Confirm Decline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
