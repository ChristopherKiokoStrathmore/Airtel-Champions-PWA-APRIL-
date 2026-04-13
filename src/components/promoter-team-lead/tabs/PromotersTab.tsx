// src/components/promoter-team-lead/tabs/PromotersTab.tsx
import React, { useEffect, useState } from 'react';
import { PromoterMember, getActivePromoters, addPromoter, dropPromoter } from '../promoter-tl-api';

interface Props {
  teamLeadId: string;
  onPromoterChange: () => void;
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#E60000,#ff4444)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#3b82f6,#60a5fa)',
  'linear-gradient(135deg,#f59e0b,#fbbf24)',
  'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  'linear-gradient(135deg,#ec4899,#f472b6)',
];

function avatarGradient(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function PromotersTab({ teamLeadId, onPromoterChange }: Props) {
  const [promoters, setPromoters] = useState<PromoterMember[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [newName,   setNewName]   = useState('');
  const [newMsisdn, setNewMsisdn] = useState('');
  const [adding,    setAdding]    = useState(false);
  const [addError,  setAddError]  = useState('');
  const [dropId,    setDropId]    = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await getActivePromoters(teamLeadId);
    setPromoters(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [teamLeadId]);

  const handleAdd = async () => {
    setAddError('');
    const name   = newName.trim();
    const msisdn = newMsisdn.trim();
    if (!name)   { setAddError("Enter the promoter's name."); return; }
    if (!msisdn) { setAddError("Enter the promoter's MSISDN."); return; }

    setAdding(true);
    const { member, error } = await addPromoter(teamLeadId, name, msisdn);
    setAdding(false);

    if (error) { setAddError(error); return; }
    if (member) {
      setPromoters(prev => [...prev, member]);
      setNewName('');
      setNewMsisdn('');
      onPromoterChange();
    }
  };

  const handleDrop = async (member: PromoterMember) => {
    if (!window.confirm(`Remove ${member.promoter_name} from your team?`)) return;
    setDropId(member.id);
    await dropPromoter(member.id);
    setPromoters(prev => prev.filter(p => p.id !== member.id));
    setDropId(null);
    onPromoterChange();
  };

  const inputCls = 'w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400 text-gray-900';

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* Stats */}
      <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{promoters.length}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Active Promoters</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-2xl">👥</div>
      </div>

      {/* Active list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#E60000', borderTopColor: 'transparent' }} />
        </div>
      ) : promoters.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <p className="text-gray-400 text-sm">No promoters yet. Add your first one below.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {promoters.map((p, idx) => (
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
              <button
                onClick={() => handleDrop(p)}
                disabled={dropId === p.id}
                className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 active:scale-95 transition-all"
                style={{ background: '#fff5f5', color: '#E60000' }}
              >
                {dropId === p.id ? '…' : 'Drop'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add promoter form */}
      <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Add New Promoter</p>

        <input
          type="text"
          value={newName}
          onChange={e => { setNewName(e.target.value); setAddError(''); }}
          placeholder="Promoter Full Name"
          className={inputCls}
          style={{ '--tw-ring-color': '#E60000' } as React.CSSProperties}
        />
        <input
          type="tel"
          value={newMsisdn}
          onChange={e => { setNewMsisdn(e.target.value); setAddError(''); }}
          placeholder="MSISDN (e.g. 0712 345 678)"
          className={inputCls}
        />

        {addError && (
          <p className="text-xs font-medium px-1" style={{ color: '#E60000' }}>{addError}</p>
        )}

        <button
          onClick={handleAdd}
          disabled={adding}
          className="w-full py-3 text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-[0.98] transition-all"
          style={{ background: '#1c1c1e' }}
        >
          {adding ? 'Adding…' : 'Add Promoter'}
        </button>

        <div className="bg-amber-50 rounded-xl p-3 flex gap-2">
          <span className="text-sm flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-700">
            If this MSISDN is already mapped to another Team Lead, you'll see an error and the promoter will not be added.
          </p>
        </div>
      </div>

    </div>
  );
}
