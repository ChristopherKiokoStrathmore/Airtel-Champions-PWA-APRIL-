// am-complaints.tsx — Agent complaints module.
// Raise tickets, track status, view admin responses, rate resolved tickets.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PlusCircle, AlertCircle, Clock, CheckCircle2, MessageSquare,
  ChevronRight, ChevronLeft, Star, Camera, X, Send, RefreshCw,
} from 'lucide-react';
import {
  AMComplaint,
  submitComplaint,
  getAgentComplaints,
  rateComplaint,
  uploadComplaintPhoto,
} from './am-api';

interface Props {
  agentId: number;
}

const ACCENT = '#E60000';

const CATEGORIES = [
  'Transaction Issue',
  'System/App Error',
  'Customer Complaint',
  'Float Management',
  'Commission Query',
  'Registration Issue',
  'Security Concern',
  'Other',
];

type View = 'list' | 'new' | 'detail';

export function AMComplaints({ agentId }: Props) {
  const [view,       setView]       = useState<View>('list');
  const [complaints, setComplaints] = useState<AMComplaint[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<AMComplaint | null>(null);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAgentComplaints(agentId);
      setComplaints(data);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { loadComplaints(); }, [loadComplaints]);

  const openDetail = (c: AMComplaint) => { setSelected(c); setView('detail'); };

  if (view === 'new') {
    return <NewComplaintForm agentId={agentId} onBack={() => setView('list')} onSubmitted={() => { setView('list'); loadComplaints(); }} />;
  }

  if (view === 'detail' && selected) {
    return (
      <ComplaintDetail
        complaint={selected}
        agentId={agentId}
        onBack={() => { setView('list'); loadComplaints(); }}
        onRefresh={async () => {
          await loadComplaints();
          // Refresh selected with updated data
          const updated = (await getAgentComplaints(agentId)).find(c => c.id === selected.id);
          if (updated) setSelected(updated);
        }}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">My Complaints</h2>
          <p className="text-xs text-gray-400">{complaints.length} ticket{complaints.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadComplaints} className="text-gray-400 hover:text-gray-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('new')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-[0.97]"
            style={{ background: ACCENT }}
          >
            <PlusCircle className="w-3.5 h-3.5" /> New Ticket
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: ACCENT, borderTopColor: 'transparent' }} />
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No complaints yet</p>
            <p className="text-xs text-gray-400 mt-1">Tap "New Ticket" to raise an issue</p>
          </div>
        ) : (
          complaints.map(c => (
            <button
              key={c.id}
              onClick={() => openDetail(c)}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={c.status} />
                    <span className="text-[11px] text-gray-400">{c.category}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{c.description}</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
              </div>
              {(c.responses?.length ?? 0) > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-blue-500">
                  <MessageSquare className="w-3 h-3" />
                  {c.responses!.length} response{c.responses!.length !== 1 ? 's' : ''}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AMComplaint['status'] }) {
  const map = {
    open:        { label: 'Open',        bg: '#FEF3C7', color: '#D97706', icon: <Clock       className="w-3 h-3" /> },
    in_progress: { label: 'In Progress', bg: '#EFF6FF', color: '#2563EB', icon: <AlertCircle className="w-3 h-3" /> },
    resolved:    { label: 'Resolved',    bg: '#F0FDF4', color: '#16A34A', icon: <CheckCircle2 className="w-3 h-3" /> },
  };
  const s = map[status] || map.open;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: s.bg, color: s.color }}>
      {s.icon} {s.label}
    </span>
  );
}

// ─── New complaint form ───────────────────────────────────────────────────────

function NewComplaintForm({ agentId, onBack, onSubmitted }: { agentId: number; onBack: () => void; onSubmitted: () => void }) {
  const [category,    setCategory]    = useState('');
  const [description, setDescription] = useState('');
  const [photoFile,   setPhotoFile]   = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category)     { setError('Please select a category.'); return; }
    if (!description.trim()) { setError('Please describe the issue.'); return; }
    setError('');
    setSubmitting(true);
    try {
      let photo_url: string | undefined;
      if (photoFile) {
        photo_url = await uploadComplaintPhoto(photoFile);
      }
      await submitComplaint({ agent_id: agentId, category, description: description.trim(), photo_url });
      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold text-gray-900">New Complaint</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Category *</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all border"
                style={
                  category === cat
                    ? { background: ACCENT, color: '#fff', borderColor: ACCENT }
                    : { background: '#f9fafb', color: '#374151', borderColor: '#e5e7eb' }
                }
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Description *</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe the issue in detail…"
            className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 resize-none"
            style={{ color: '#111827' }}
          />
        </div>

        {/* Photo */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Photo (optional)</label>
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Preview" className="w-full rounded-xl object-cover max-h-40" />
              <button
                type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-gray-300 transition-colors"
            >
              <Camera className="w-6 h-6" />
              <span className="text-xs">Tap to attach a photo</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50"
          style={{ background: ACCENT }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting…
            </span>
          ) : 'Submit Complaint'}
        </button>
      </form>
    </div>
  );
}

// ─── Complaint detail view ────────────────────────────────────────────────────

function ComplaintDetail({ complaint, agentId, onBack, onRefresh }: {
  complaint: AMComplaint;
  agentId: number;
  onBack: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [rating,    setRating]    = useState(complaint.rating?.rating || 0);
  const [comment,   setComment]   = useState(complaint.rating?.comment || '');
  const [ratingErr, setRatingErr] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRate = async () => {
    if (rating === 0) { setRatingErr('Please select a star rating.'); return; }
    setRatingErr('');
    setSubmittingRating(true);
    try {
      await rateComplaint({ complaint_id: complaint.id, agent_id: agentId, rating, comment });
      await onRefresh();
    } catch (err: any) {
      setRatingErr(err.message || 'Failed to submit rating.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const timelineSteps = [
    { label: 'Submitted',   time: complaint.created_at,   done: true },
    { label: 'Picked Up',   time: complaint.picked_up_at, done: !!complaint.picked_up_at },
    { label: 'Resolved',    time: complaint.resolved_at,  done: !!complaint.resolved_at },
  ];

  const fmt = (iso?: string | null) => iso
    ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-bold text-gray-900 leading-tight">Complaint Details</h2>
          <p className="text-[11px] text-gray-400">{complaint.category}</p>
        </div>
        <button onClick={handleRefresh} className={`text-gray-400 hover:text-gray-600 transition-colors ${refreshing ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-4 h-4" />
        </button>
        <StatusBadge status={complaint.status} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
        {/* Description */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Description</p>
          <p className="text-sm text-gray-800">{complaint.description}</p>
          {complaint.photo_url && (
            <img src={complaint.photo_url} alt="Attachment" className="mt-3 w-full rounded-xl object-cover max-h-48" />
          )}
        </div>

        {/* Timeline */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Timeline</p>
          <div className="space-y-3">
            {timelineSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                  {step.done
                    ? <CheckCircle2 className="w-3 h-3 text-white" />
                    : <Clock className="w-3 h-3 text-gray-400" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                  <p className="text-[11px] text-gray-400">{fmt(step.time)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin responses */}
        {(complaint.responses?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
              Responses ({complaint.responses!.length})
            </p>
            <div className="space-y-3">
              {complaint.responses!.map(r => (
                <div key={r.id} className="bg-blue-50 border border-blue-100 rounded-2xl p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Airtel Money HQ</p>
                  <p className="text-sm text-gray-800">{r.message}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{fmt(r.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating section — only after resolved and not yet rated */}
        {complaint.status === 'resolved' && !complaint.rating && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-800 mb-1">Was this resolved?</p>
            <p className="text-xs text-gray-500 mb-3">Rate your experience with how this issue was handled.</p>

            {/* Stars */}
            <div className="flex items-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type="button" onClick={() => setRating(s)}>
                  <Star
                    className="w-7 h-7 transition-colors"
                    style={{ color: s <= rating ? '#F59E0B' : '#D1D5DB' }}
                    fill={s <= rating ? '#F59E0B' : 'none'}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              placeholder="Add a comment (optional)…"
              className="w-full px-3 py-2 text-sm bg-white border border-yellow-200 rounded-xl focus:outline-none resize-none mb-2"
            />

            {ratingErr && <p className="text-xs text-red-600 mb-2">{ratingErr}</p>}

            <button
              onClick={handleRate}
              disabled={submittingRating}
              className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all disabled:opacity-50"
              style={{ background: '#F59E0B' }}
            >
              {submittingRating ? 'Submitting…' : 'Submit Rating'}
            </button>
          </div>
        )}

        {/* Show rating if already submitted */}
        {complaint.rating && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-green-700 mb-2">Your Rating</p>
            <div className="flex items-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className="w-5 h-5" style={{ color: s <= complaint.rating!.rating ? '#F59E0B' : '#D1D5DB' }} fill={s <= complaint.rating!.rating ? '#F59E0B' : 'none'} />
              ))}
              <span className="text-xs text-gray-500 ml-1">{complaint.rating.rating}/5</span>
            </div>
            {complaint.rating.comment && (
              <p className="text-xs text-gray-600 italic">"{complaint.rating.comment}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
