// src/components/promoter-team-lead/tabs/SettingsTab.tsx
import React from 'react';
import { TLUser, clearTLSession } from '../promoter-tl-api';

interface Props {
  tlUser: TLUser;
  onLogout: () => void;
}

export function SettingsTab({ tlUser, onLogout }: Props) {
  const handleLogout = () => {
    clearTLSession();
    onLogout();
  };

  const fields: { label: string; value: string }[] = [
    { label: 'Full Name',    value: tlUser.full_name  },
    { label: 'Phone (MSISDN)', value: tlUser.msisdn   },
    { label: 'Zone',         value: tlUser.zone        },
    { label: 'SE Cluster',   value: tlUser.se_cluster  },
    { label: 'Member Since', value: new Date(tlUser.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* Profile card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-6 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #E60000, #ff3333)' }}>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {tlUser.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{tlUser.full_name}</p>
            <p className="text-white/70 text-sm mt-0.5">Promoter Team Lead</p>
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-5 py-3.5">
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</span>
              <span className="text-sm font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-4 bg-white rounded-2xl shadow-sm font-bold text-sm tracking-wide hover:bg-red-50 active:scale-[0.98] transition-all"
        style={{ color: '#E60000' }}
      >
        Log Out
      </button>

      <p className="text-center text-[10px] text-gray-300 pb-2">
        Airtel Champions · Promoter Team Lead
      </p>
    </div>
  );
}
