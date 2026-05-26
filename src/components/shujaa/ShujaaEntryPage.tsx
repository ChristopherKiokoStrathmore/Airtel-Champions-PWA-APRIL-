import React, { useState } from 'react';
import { shujaaLogin, saveShujaaSession } from './shujaa-api';
import { AlertCircle, ChevronLeft, Loader2, Shield } from 'lucide-react';

interface Props {
  onSuccess: (user: any) => void;
  onBack: () => void;
}

export function ShujaaEntryPage({ onSuccess, onBack }: Props) {
  const [loginMsisdn, setLoginMsisdn] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginMsisdn.trim() || !loginPassword) {
      setLoginError('Enter your phone number and PIN.');
      return;
    }
    if (!/^[0-9]{4}$/.test(loginPassword)) {
      setLoginError('PIN must be exactly 4 digits.');
      return;
    }
    setLoginLoading(true);
    const { user, error } = await shujaaLogin(loginMsisdn.trim(), loginPassword);
    setLoginLoading(false);
    if (error || !user) {
      setLoginError(error ?? 'Login failed.');
      return;
    }
    saveShujaaSession(user);
    onSuccess(user);
  };

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 outline-none shadow-sm transition focus:border-red-300 focus:ring-4 focus:ring-red-50';

  return (
    <div className="flex min-h-[100dvh] flex-col" style={{ background: '#f5f5f7' }}>
      {/* Back button */}
      <div className="px-5 pt-5">
        <button
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-600 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Centered content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-xs">

          {/* Brand mark */}
          <div className="mb-9 flex flex-col items-center text-center">
            <div
              className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-[18px]"
              style={{
                background: 'linear-gradient(145deg,#E60000 0%,#b30000 100%)',
                boxShadow: '0 10px 28px rgba(230,0,0,0.28)',
              }}
            >
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950">Shujaa</h1>
            <p className="mt-1 text-sm text-slate-400">Airtel Champions Sales</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            {loginError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-700">{loginError}</p>
              </div>
            )}

            <input
              type="tel"
              value={loginMsisdn}
              onChange={e => setLoginMsisdn(e.target.value)}
              placeholder="Phone number"
              autoComplete="tel"
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
              autoComplete="current-password"
              className={inputCls}
            />

            <div className="pt-1">
              <button
                type="submit"
                disabled={loginLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition active:scale-[0.97] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(90deg,#E60000 0%,#cc0000 100%)',
                  boxShadow: '0 8px 24px rgba(230,0,0,0.24)',
                }}
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in…
                  </>
                ) : (
                  'Log In'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
