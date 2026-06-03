// src/components/promoter-team-lead/PromoterTeamLeadDashboard.tsx
import React, { useEffect, useState } from 'react';
import { TLUser, getTLSession, getMonthTotalGas, getActivePromoters, getTLFeatureActive } from './promoter-tl-api';
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
  const [tlActive,       setTlActive]       = useState<boolean | null>(null);

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
  useEffect(() => { getTLFeatureActive().then(setTlActive); }, []);

  const handlePromoterChange = () => {
    setPromoterRefKey(k => k + 1);
    refreshHeader();
  };

  if (!tlUser) {
    onLogout();
    return null;
  }

  if (tlActive === null) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ background: 'linear-gradient(155deg, #E60000 0%, #C8102E 70%, #A80C23 100%)' }}
      >
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!tlActive) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        style={{
          background: 'linear-gradient(155deg, #E60000 0%, #C8102E 70%, #A80C23 100%)',
          paddingTop: 'calc(max(env(safe-area-inset-top), 0px) + 32px)',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom), 0px) + 32px)',
        }}
      >
        <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <p className="text-white/70 text-xs uppercase tracking-widest mb-2">Promoter Team Lead</p>
        <p className="text-white text-[26px] font-black leading-tight mb-1">has migrated to</p>
        <p className="text-white text-[26px] font-black leading-tight mb-6">the Sales App</p>
        <p className="text-white/55 text-sm leading-relaxed max-w-[260px] mb-10">
          The Promoter Team Lead portal has moved to the Sales App.
        </p>
        <button
          onClick={onLogout}
          className="px-8 py-3 rounded-2xl text-white font-semibold text-sm active:scale-95 transition-transform"
          style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)' }}
        >
          Log Out
        </button>
      </div>
    );
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
    <div className="flex flex-col h-full min-h-0 overflow-hidden" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%)' }}>

      {/* ── Header ── */}
      <div
        className="px-5 pb-4 flex-shrink-0"
        style={{
          background: 'linear-gradient(155deg, #E60000 0%, #C8102E 70%, #A80C23 100%)',
          paddingTop: 'calc(max(env(safe-area-inset-top), 0px) + 18px)',
          boxShadow: '0 10px 24px rgba(168,12,35,0.28)',
        }}
      >
        <p className="text-white/85 text-xs tracking-wide">{greeting()}, Team Lead</p>
        <p className="text-white text-[28px] font-black tracking-tight mt-0.5 mb-4 leading-tight">
          {tlUser.full_name.split(' ')[0]}
        </p>

        <div className="grid grid-cols-3 gap-2.5">
          {stats.map(({ num, lbl }) => (
            <div
              key={lbl}
              className="rounded-2xl px-3 py-2.5 text-center"
              style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              <p className="text-white text-xl font-black leading-none">{num}</p>
              <p className="text-white/70 text-[9px] uppercase tracking-wide mt-1">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-transparent pt-2">
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
            tlUser={tlUser}
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
        className="bg-white/95 border-t border-gray-100 flex flex-shrink-0 backdrop-blur"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 10px)',
          minHeight: '74px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}
      >
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors"
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
