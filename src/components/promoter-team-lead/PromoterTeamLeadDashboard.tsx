// src/components/promoter-team-lead/PromoterTeamLeadDashboard.tsx
import React, { useEffect, useState } from 'react';
import { TLUser, getTLSession, getMonthTotalGas, getActivePromoters } from './promoter-tl-api';
import { TodayTab }     from './tabs/TodayTab';
import { PromotersTab } from './tabs/PromotersTab';
import { HistoryTab }   from './tabs/HistoryTab';
import { SettingsTab }  from './tabs/SettingsTab';

type Tab = 'today' | 'promoters' | 'history' | 'settings';

interface Props {
  onLogout: () => void;
}

export function PromoterTeamLeadDashboard({ onLogout }: Props) {
  const tlUser = getTLSession();

  const [activeTab,      setActiveTab]      = useState<Tab>('today');
  const [todayTotal,     setTodayTotal]     = useState(0);
  const [monthTotal,     setMonthTotal]     = useState(0);
  const [promoterCount,  setPromoterCount]  = useState(0);
  const [promoterRefKey, setPromoterRefKey] = useState(0);

  const refreshHeader = async () => {
    if (!tlUser) return;
    const [month, members] = await Promise.all([
      getMonthTotalGas(tlUser.id),
      getActivePromoters(tlUser.id),
    ]);
    setMonthTotal(month);
    setPromoterCount(members.length);
  };

  useEffect(() => { refreshHeader(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePromoterChange = () => {
    setPromoterRefKey(k => k + 1);
    refreshHeader();
  };

  if (!tlUser) {
    onLogout();
    return null;
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'today',     icon: '📋', label: 'Today'     },
    { id: 'promoters', icon: '👥', label: 'Promoters' },
    { id: 'history',   icon: '📈', label: 'History'   },
    { id: 'settings',  icon: '⚙️', label: 'Settings'  },
  ];

  const stats = [
    { num: promoterCount, lbl: 'Promoters'   },
    { num: todayTotal,    lbl: "Today's GAs" },
    { num: monthTotal,    lbl: 'Month GAs'   },
  ];

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-50 overflow-hidden">

      {/* ── Header ── */}
      <div style={{ background: '#E60000' }} className="px-5 pt-7 pb-4 flex-shrink-0">
        <p className="text-white/80 text-xs tracking-wide">{greeting()}, Team Lead 👋</p>
        <p className="text-white text-2xl font-black tracking-tight mt-0.5 mb-4">
          {tlUser.full_name.split(' ')[0]}
        </p>

        <div className="flex gap-2.5">
          {stats.map(({ num, lbl }) => (
            <div
              key={lbl}
              className="flex-1 rounded-2xl px-3 py-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >
              <p className="text-white text-xl font-black leading-none">{num}</p>
              <p className="text-white/70 text-[9px] uppercase tracking-wide mt-1">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
        {activeTab === 'today' && (
          <TodayTab
            tlUser={tlUser}
            refreshKey={promoterRefKey}
            onTotalChange={t => setTodayTotal(t)}
          />
        )}
        {activeTab === 'promoters' && (
          <PromotersTab
            teamLeadId={tlUser.id}
            onPromoterChange={handlePromoterChange}
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab teamLeadId={tlUser.id} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab tlUser={tlUser} onLogout={onLogout} />
        )}
      </div>

      {/* ── Tab bar ── */}
      <div
        className="bg-white border-t border-gray-100 flex flex-shrink-0"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}
      >
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors"
            style={{ color: activeTab === t.id ? '#E60000' : '#9ca3af' }}
          >
            <span className="text-xl leading-none">{t.icon}</span>
            <span className="text-[10px] font-semibold tracking-wide">{t.label}</span>
            {activeTab === t.id && (
              <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#E60000' }} />
            )}
          </button>
        ))}
      </div>

    </div>
  );
}
