// am-agent-dashboard.tsx — Mobile-first Airtel Money agent dashboard.
// Two tabs: Education (training videos) and Complaints (tickets).

import React, { useEffect, useState } from 'react';
import { BookOpen, AlertCircle, LogOut, User } from 'lucide-react';
import { AMEducation } from './am-education';
import { AMComplaints } from './am-complaints';

interface Props {
  user: any;
  userData: any;
  onLogout: () => void;
}

type Tab = 'education' | 'complaints';

const ACCENT = '#E60000';

export function AMAgentDashboard({ user, userData, onLogout }: Props) {
  const [activeTab,        setActiveTab]        = useState<Tab>('education');
  const [showProfileMenu,  setShowProfileMenu]  = useState(false);

  const agentName = userData?.full_name || user?.full_name || 'Agent';
  const agentCode = userData?.agent_code || user?.agent_code || '';
  const agentIdRaw = userData?.id ?? user?.id ?? userData?.agent_id ?? user?.agent_id ?? null;
  const agentId = Number(agentIdRaw);

  useEffect(() => {
    console.log('[AM][Dashboard] Resolved agent id:', { agentIdRaw, agentId, userRole: userData?.role || user?.role });
    if (!Number.isFinite(agentId) || agentId <= 0) {
      console.warn('[AM][Dashboard] Invalid agent id; targeted video visibility may be limited.');
    }
  }, [agentIdRaw, agentId, userData?.role, user?.role]);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {/* Airtel Money logo mark */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
               style={{ background: 'linear-gradient(135deg, #E60000, #FF4444)' }}>
            AM
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Airtel Money</p>
            <p className="text-[11px] text-gray-400 leading-tight">Agent Portal</p>
          </div>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(p => !p)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 active:bg-gray-100 transition-colors"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                 style={{ background: ACCENT }}>
              {agentName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-gray-700 max-w-[80px] truncate">{agentName}</span>
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{agentName}</p>
                  {agentCode && <p className="text-xs text-gray-400">Code: {agentCode}</p>}
                  {(userData?.zone || user?.zone) && (
                    <p className="text-xs text-gray-400">Zone: {userData?.zone || user?.zone}</p>
                  )}
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'education'  && <AMEducation  agentId={agentId} />}
        {activeTab === 'complaints' && <AMComplaints agentId={agentId} />}
      </div>

      {/* ── Bottom navigation ─────────────────────────────────────────────── */}
      <div
        className="bg-white border-t border-gray-100 flex shrink-0"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        {(
          [
            { id: 'education',  label: 'Education',  Icon: BookOpen   },
            { id: 'complaints', label: 'Complaints', Icon: AlertCircle },
          ] as const
        ).map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="relative flex-1 flex flex-col items-center justify-center py-3 transition-colors"
              style={{ color: active ? ACCENT : '#9CA3AF' }}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-semibold mt-1 tracking-wide">{label}</span>
              {active && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-t-full" style={{ background: ACCENT }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
