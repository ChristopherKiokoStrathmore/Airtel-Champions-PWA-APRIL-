import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../utils/supabase/client';
import {
  sendCustomerOTP,
  getShujaaSession,
  ShujaaCustomer,
  verifyCustomerOTPAndAdd,
} from './shujaa-api';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import {
  Users,
  Download,
  RefreshCw,
  LogOut,
  CheckCircle2,
  ChevronLeft,
  Phone,
  User,
  AlertCircle,
  Loader2,
  UserPlus,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface Props {
  onLogout?: () => void;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.length === 9) return `0${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  if (d.length === 10) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  if (d.length === 12) return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return raw;
}

function customerInitials(name?: string, phone?: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.trim().slice(0, 2).toUpperCase();
  }
  const digits = (phone || '').replace(/\D/g, '');
  return digits.slice(-2) || '??';
}

function shujaaInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.trim().slice(0, 2).toUpperCase();
}

export function ShujaaDashboard({ onLogout }: Props) {
  const session = useMemo(() => getShujaaSession(), []);
  const [customers, setCustomers] = useState<ShujaaCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [session?.id]);

  async function fetchCustomers() {
    if (!session?.id) {
      setError('Session expired. Please log in again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('shujaa_customers')
        .select('id, shujaa_id, msisdn, customer_name, added_at')
        .eq('shujaa_id', session.id)
        .order('added_at', { ascending: false });

      if (fetchError || !data) {
        setCustomers([]);
        setError('Could not load your customer list right now.');
      } else {
        setCustomers(data as ShujaaCustomer[]);
      }
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    if (!customers.length) return;
    const rows = customers.map(c => ({
      id: c.id,
      shujaa_id: c.shujaa_id,
      msisdn: c.msisdn,
      customer_name: c.customer_name || '',
      added_at: c.added_at,
    }));
    const header = Object.keys(rows[0]);
    const csv = [header.join(',')]
      .concat(rows.map(r => header.map(h => `"${(r as any)[h] ?? ''}"`).join(',')))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shujaa_customers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const stats = useMemo(
    () => ({
      total: customers.length,
      named: customers.filter(c => c.customer_name?.trim()).length,
      latest: customers[0]?.added_at || null,
    }),
    [customers],
  );

  function openAdd() {
    setShowAdd(true);
    setStep(1);
    setCustomerPhone('');
    setCustomerName('');
    setOtpCode('');
    setError('');
    setMessage('');
  }

  function closeAdd() {
    setShowAdd(false);
    setStep(1);
    setCustomerPhone('');
    setCustomerName('');
    setOtpCode('');
    setError('');
    setMessage('');
  }

  const handleSendOtp = async () => {
    setError('');
    setMessage('');
    if (!customerPhone.trim()) {
      setError('Enter the customer phone number first.');
      return;
    }
    setActionLoading(true);
    const result = await sendCustomerOTP(customerPhone);
    setActionLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to send OTP.');
      return;
    }
    setStep(2);
    setMessage('OTP sent — ask the customer for the 6-digit code.');
  };

  const handleVerifyAndAdd = async () => {
    setError('');
    setMessage('');
    if (!session?.id) {
      setError('Session expired. Please log in again.');
      return;
    }
    if (!customerPhone.trim() || otpCode.length < 6) {
      setError('Enter all 6 digits of the OTP code.');
      return;
    }
    setActionLoading(true);
    const result = await verifyCustomerOTPAndAdd(
      session.id,
      customerPhone,
      otpCode,
      customerName,
    );
    setActionLoading(false);
    if (!result.customer) {
      setError(result.error || 'Could not verify OTP.');
      return;
    }
    setMessage('Customer added successfully!');
    await fetchCustomers();
    setTimeout(closeAdd, 1400);
  };

  return (
    <div className="min-h-[100dvh]" style={{ background: '#f5f5f7' }}>
      <div className="mx-auto max-w-md px-4 pb-12 pt-5">

        {/* ── Hero card ───────────────────────────────────────── */}
        <header className="relative mb-5 overflow-hidden rounded-[2rem] shadow-[0_10px_28px_rgba(168,12,35,0.24)]">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(155deg, #E60000 0%, #C8102E 70%, #A80C23 100%)' }} />
          <div className="absolute -right-10 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-white/8" />

          <div className="relative px-5 pb-5 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[18px] text-sm font-black tracking-tight text-white"
                  style={{
                    background: 'rgba(255,255,255,0.16)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
                  }}
                >
                  {session?.full_name ? shujaaInitials(session.full_name) : 'SJ'}
                </div>

                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/80">
                    Shujaa
                  </p>
                  <h1 className="mt-0.5 text-[18px] font-black leading-tight text-white">
                    {session?.full_name || 'Champion'}
                  </h1>
                  {(session?.zone || session?.se_cluster) && (
                    <p className="mt-0.5 text-xs font-medium text-white/70">
                      {[session?.zone, session?.se_cluster].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white active:scale-95"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl px-3 py-2.5 text-center" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <p className="text-white text-xl font-black leading-none">{stats.total}</p>
                <p className="text-white/70 text-[9px] uppercase tracking-wide mt-1">Total</p>
              </div>
              <div className="rounded-2xl px-3 py-2.5 text-center" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <p className="text-white text-xl font-black leading-none">{stats.named}</p>
                <p className="text-white/70 text-[9px] uppercase tracking-wide mt-1">Named</p>
              </div>
              <div className="rounded-2xl px-3 py-2.5 text-center" style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <p className="text-white text-[15px] font-black leading-none">{stats.latest ? relativeTime(stats.latest) : '—'}</p>
                <p className="text-white/70 text-[9px] uppercase tracking-wide mt-1">Last add</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Primary CTA ─────────────────────────────────────── */}
        {!showAdd && (
          <button
            onClick={openAdd}
            className="mb-4 flex w-full items-center justify-between rounded-2xl px-5 py-4 text-sm font-bold text-white transition active:scale-[0.98]"
            style={{
              background: 'linear-gradient(90deg,#E60000 0%,#cc0000 100%)',
              boxShadow: '0 8px 24px rgba(230,0,0,0.24)',
            }}
          >
            <span className="flex items-center gap-2.5">
              <UserPlus className="h-4 w-4" />
              Add a customer
            </span>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </button>
        )}

        {/* ── Add Customer Panel ───────────────────────────────── */}
        {showAdd && (
          <div className="mb-4 overflow-hidden rounded-[1.75rem] bg-white shadow-[0_4px_32px_rgba(15,23,42,0.09)]">
            {/* Panel header */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              {step === 2 && (
                <button
                  onClick={() => {
                    setStep(1);
                    setOtpCode('');
                    setError('');
                    setMessage('');
                  }}
                  className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 active:scale-95"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[9px] font-extrabold uppercase tracking-[0.22em]"
                  style={{ color: '#E60000' }}
                >
                  Step {step} of 2
                </p>
                <p className="text-sm font-bold text-slate-950">
                  {step === 1 ? 'Customer details' : 'Verify with OTP'}
                </p>
              </div>
              {/* Progress pills */}
              <div className="flex shrink-0 items-center gap-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: step >= 1 ? '16px' : '6px',
                    background: step >= 1 ? '#E60000' : '#e2e8f0',
                  }}
                />
                <div
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: step >= 2 ? '16px' : '6px',
                    background: step >= 2 ? '#E60000' : '#e2e8f0',
                  }}
                />
              </div>
            </div>

            <div className="space-y-3.5 px-5 py-5">
              {step === 1 && (
                <>
                  {/* Name input */}
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-slate-300" />
                    <input
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Customer name (optional)"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50"
                    />
                  </div>
                  {/* Phone input */}
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-slate-300" />
                    <input
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="Customer phone number"
                      inputMode="tel"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50"
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <div className="py-3 text-center">
                  {/* Icon */}
                  <div
                    className="mx-auto mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(230,0,0,0.07)' }}
                  >
                    <Shield className="h-5 w-5" style={{ color: '#E60000' }} />
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    Ask{' '}
                    {customerName
                      ? customerName
                      : formatPhone(customerPhone)}{' '}
                    for the code
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    OTP sent to {formatPhone(customerPhone)}
                  </p>

                  {/* OTP input */}
                  <div className="mt-5 flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={(val: string) => setOtpCode(val.replace(/\D/g, '').slice(0, 6))}
                    >
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="h-12 w-10 rounded-none border-slate-200 bg-slate-50 text-base font-black text-slate-950 first:rounded-l-xl first:border-l last:rounded-r-xl data-[active=true]:border-red-400 data-[active=true]:ring-2 data-[active=true]:ring-red-100"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {/* Success */}
              {message && (
                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-700">{message}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={closeAdd}
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 active:scale-95"
                >
                  Cancel
                </button>

                {step === 1 ? (
                  <button
                    onClick={handleSendOtp}
                    disabled={actionLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.97] disabled:opacity-60"
                    style={{ background: '#E60000' }}
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleVerifyAndAdd}
                    disabled={actionLoading || otpCode.length < 6}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.97] disabled:opacity-60"
                    style={{ background: '#E60000' }}
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      'Verify & Add'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Customer list ────────────────────────────────────── */}
        <section>
          {/* Section header */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
              My Customers
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchCustomers}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-slate-600 active:scale-95"
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              {customers.length > 0 && (
                <button
                  onClick={exportCSV}
                  className="flex h-8 items-center gap-1.5 rounded-xl px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 transition hover:bg-white hover:text-slate-600"
                >
                  <Download className="h-3 w-3" />
                  CSV
                </button>
              )}
            </div>
          </div>

          {/* Loading — skeleton cards */}
          {loading && (
            <div className="space-y-2.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)]"
                >
                  <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3 w-32 animate-pulse rounded-full bg-slate-100" />
                    <div className="h-2.5 w-20 animate-pulse rounded-full bg-slate-100" />
                  </div>
                  <div className="h-2.5 w-10 animate-pulse rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && customers.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
              <div
                className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(230,0,0,0.06)' }}
              >
                <Users className="h-6 w-6" style={{ color: '#E60000' }} />
              </div>
              <h3 className="text-[15px] font-black text-slate-950">No customers yet</h3>
              <p className="mx-auto mt-2 max-w-[200px] text-sm leading-relaxed text-slate-400">
                Tap "Add a customer" to start building your Shujaa list.
              </p>
            </div>
          )}

          {/* Customer cards */}
          {!loading && customers.length > 0 && (
            <div className="space-y-2.5">
              {customers.map(customer => (
                <div
                  key={customer.id}
                  className="flex items-center gap-3.5 rounded-2xl bg-white px-4 py-4 shadow-[0_1px_6px_rgba(15,23,42,0.04)] transition hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
                >
                  {/* Avatar */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-black text-slate-500">
                    {customerInitials(customer.customer_name, customer.msisdn)}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {formatPhone(customer.msisdn)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {customer.customer_name?.trim() || (
                        <span className="italic text-slate-300">No name</span>
                      )}
                    </p>
                  </div>

                  {/* Relative time */}
                  <div className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                    {relativeTime(customer.added_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
