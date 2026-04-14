// src/components/promoter-team-lead/PromoterTeamLeadEntryPage.tsx
import React, { useState } from 'react';
import { tlLogin, tlSignup, saveTLSession } from './promoter-tl-api';

const ZONES = [
  'ABERDARE', 'COAST', 'EASTERN', 'MT KENYA',
  'NAIROBI EAST', 'NAIROBI METROPOLITAN', 'NAIROBI WEST',
  'NYANZA', 'RIFT VALLEY', 'WESTERN',
];

interface Props {
  onSuccess: () => void;
  onBack:    () => void;
}

export function PromoterTeamLeadEntryPage({ onSuccess, onBack }: Props) {
  // Login
  const [loginMsisdn,   setLoginMsisdn]   = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading,  setLoginLoading]  = useState(false);
  const [loginError,    setLoginError]    = useState('');

  // Signup
  const [signupName,     setSignupName]     = useState('');
  const [signupMsisdn,   setSignupMsisdn]   = useState('');
  const [signupZone,     setSignupZone]     = useState('');
  const [signupCluster,  setSignupCluster]  = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm,  setSignupConfirm]  = useState('');
  const [signupLoading,  setSignupLoading]  = useState(false);
  const [signupError,    setSignupError]    = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginMsisdn.trim() || !loginPassword) {
      setLoginError('Enter your phone number and password.');
      return;
    }
    if (!/^\d{4}$/.test(loginPassword)) {
      setLoginError('PIN must be exactly 4 digits.');
      return;
    }
    setLoginLoading(true);
    const { user, error } = await tlLogin(loginMsisdn.trim(), loginPassword);
    setLoginLoading(false);
    if (error || !user) { setLoginError(error ?? 'Login failed.'); return; }
    saveTLSession(user);
    onSuccess();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (!signupName.trim())               { setSignupError('Enter your full name.');                    return; }
    if (!signupMsisdn.trim())             { setSignupError('Enter your MSISDN.');                       return; }
    if (!signupZone)                      { setSignupError('Select your zone.');                        return; }
    if (!signupCluster.trim())            { setSignupError('Enter your SE cluster / location.');        return; }
    if (!/^\d{4}$/.test(signupPassword))  { setSignupError('PIN must be exactly 4 digits.');            return; }
    if (signupPassword !== signupConfirm) { setSignupError('Passwords do not match.');                 return; }

    setSignupLoading(true);
    const { user, error } = await tlSignup(
      signupName.trim(), signupMsisdn.trim(), signupZone, signupCluster.trim(), signupPassword,
    );
    setSignupLoading(false);
    if (error || !user) { setSignupError(error ?? 'Sign up failed.'); return; }
    saveTLSession(user);
    onSuccess();
  };

  const inputCls =
    'w-full px-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-400 text-gray-900';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-6 py-6">

      {/* Back */}
      <button
        onClick={onBack}
        className="self-start flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6 -ml-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to login
      </button>

      {/* Title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#E60000' }}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="font-black text-gray-900 text-lg leading-tight">Promoter Team Lead</p>
          <p className="text-xs text-gray-400">Airtel Champions Sales</p>
        </div>
      </div>

      {/* ── LOGIN ── */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Log In</p>

      <form onSubmit={handleLogin} className="space-y-3 mb-2">
        {loginError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <p className="text-sm font-medium" style={{ color: '#E60000' }}>{loginError}</p>
          </div>
        )}
        <input
          type="tel"
          value={loginMsisdn}
          onChange={e => setLoginMsisdn(e.target.value)}
          placeholder="Phone number (MSISDN)"
          className={inputCls}
        />
        <input
          type="password"
          value={loginPassword}
          onChange={e => setLoginPassword(e.target.value)}
          placeholder="4-digit PIN"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          className={inputCls}
        />
        <button
          type="submit"
          disabled={loginLoading}
          className="w-full py-3.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all"
          style={{ background: '#E60000', boxShadow: '0 4px 20px rgba(230,0,0,0.3)' }}
        >
          {loginLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Logging in…
            </span>
          ) : 'LOG IN'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium whitespace-nowrap">New here? Sign Up below ↓</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* ── SIGNUP ── */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Create Account</p>

      <form onSubmit={handleSignup} className="space-y-3 pb-8">
        {signupError && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
            <p className="text-sm font-medium" style={{ color: '#E60000' }}>{signupError}</p>
          </div>
        )}
        <input
          type="text"
          value={signupName}
          onChange={e => setSignupName(e.target.value)}
          placeholder="Full Name"
          className={inputCls}
        />
        <input
          type="tel"
          value={signupMsisdn}
          onChange={e => setSignupMsisdn(e.target.value)}
          placeholder="MSISDN (phone number)"
          className={inputCls}
        />
        <select
          value={signupZone}
          onChange={e => setSignupZone(e.target.value)}
          className={`${inputCls} ${!signupZone ? 'text-gray-400' : 'text-gray-900'}`}
        >
          <option value="">Select Zone</option>
          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
        </select>
        <input
          type="text"
          value={signupCluster}
          onChange={e => setSignupCluster(e.target.value)}
          placeholder="SE Cluster / Location (e.g. Eastlands)"
          className={inputCls}
        />
        <input
          type="password"
          value={signupPassword}
          onChange={e => setSignupPassword(e.target.value)}
          placeholder="Create 4-digit PIN"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          className={inputCls}
        />
        <input
          type="password"
          value={signupConfirm}
          onChange={e => setSignupConfirm(e.target.value)}
          placeholder="Confirm 4-digit PIN"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          className={inputCls}
        />
        <button
          type="submit"
          disabled={signupLoading}
          className="w-full py-3.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all"
          style={{ background: '#1c1c1e' }}
        >
          {signupLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account…
            </span>
          ) : 'SIGN UP AS TEAM LEAD'}
        </button>
        <p className="text-center text-[11px] text-gray-400">Already registered? Log in above ↑</p>
      </form>

    </div>
  );
}
