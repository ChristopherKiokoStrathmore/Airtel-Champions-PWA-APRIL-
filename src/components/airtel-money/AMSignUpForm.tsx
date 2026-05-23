// AMSignUpForm.tsx — Self-registration form for Airtel Money agents.
// Fields: Name, Super Agent Number, Agent Code, SE, ZSM, Zone, PIN.

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Eye, EyeOff, ChevronDown, Search, X } from 'lucide-react';
import { amSignUp, AMAgent, fetchAppUsersByRole, AppUserOption } from './am-api';

interface Props {
  onBack: () => void;
  onSuccess: (agent: AMAgent) => void;
}

const ACCENT = '#E60000';

const ZONES = [
  'Nairobi', 'Central', 'Rift Valley', 'Nyanza', 'Western',
  'Coast', 'North Eastern', 'Eastern', 'Other',
];

export function AMSignUpForm({ onBack, onSuccess }: Props) {
  const [fullName,          setFullName]          = useState('');
  const [superAgentNumber,  setSuperAgentNumber]  = useState('');
  const [agentCode,         setAgentCode]         = useState('');
  const [se,                setSE]                = useState('');
  const [zsm,               setZSM]               = useState('');
  const [zone,              setZone]              = useState('');
  const [phone,             setPhone]             = useState('');
  const [pin,               setPin]               = useState('');
  const [confirmPin,        setConfirmPin]        = useState('');
  const [showPin,           setShowPin]           = useState(false);
  const [submitting,        setSubmitting]        = useState(false);
  const [error,             setError]             = useState('');

  // Metadata for cascading: maps name -> {zone, zsm}
  const [seMetadata,        setSEMetadata]        = useState<Map<string, AppUserOption>>(new Map());
  const [zsmMetadata,       setZSMMetadata]       = useState<Map<string, AppUserOption>>(new Map());

  const [seOptions,         setSEOptions]         = useState<AppUserOption[]>([]);
  const [zsmOptions,        setZSMOptions]        = useState<AppUserOption[]>([]);
  const [loadingOptions,    setLoadingOptions]    = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAppUsersByRole('sales_executive'),
      fetchAppUsersByRole('zonal_sales_manager'),
    ]).then(([ses, zsms]) => {
      setSEOptions(ses);
      setZSMOptions(zsms);
      
      // Build metadata maps for cascading
      const seMap = new Map(ses.map(s => [s.full_name, s]));
      const zsmMap = new Map(zsms.map(z => [z.full_name, z]));
      setSEMetadata(seMap);
      setZSMMetadata(zsmMap);
    }).finally(() => setLoadingOptions(false));
  }, []);

  // When SE is selected, auto-populate ZSM and Zone
  const handleSEChange = (selectedSE: string) => {
    setSE(selectedSE);
    const seData = seMetadata.get(selectedSE);
    if (seData?.zsm) setZSM(seData.zsm);
    if (seData?.zone) setZone(seData.zone);
  };

  // When ZSM is selected, auto-populate Zone
  const handleZSMChange = (selectedZSM: string) => {
    setZSM(selectedZSM);
    const zsmData = zsmMetadata.get(selectedZSM);
    if (zsmData?.zone) setZone(zsmData.zone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!fullName.trim())         { setError('Full name is required.');              return; }
    if (!superAgentNumber.trim()) { setError('Super Agent Number is required.');     return; }
    if (!agentCode.trim())        { setError('Agent Code is required.');             return; }
    if (!se.trim())               { setError('SE name is required.');                return; }
    if (!zsm.trim())              { setError('ZSM name is required.');               return; }
    if (!zone)                    { setError('Please select your zone.');            return; }
    if (!phone.trim())            { setError('Phone number is required.');           return; }
    if (pin.length < 4)           { setError('PIN must be at least 4 digits.');      return; }
    if (pin !== confirmPin)       { setError('PINs do not match.');                  return; }

    setSubmitting(true);
    try {
      const agent = await amSignUp({
        full_name:          fullName.trim(),
        phone:              phone.trim(),
        super_agent_number: superAgentNumber.trim(),
        agent_code:         agentCode.trim(),
        se:                 se.trim(),
        zsm:                zsm.trim(),
        zone,
        pin:                pin.trim(), // Explicitly trim PIN
      });
      onSuccess(agent);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto bg-white">
      <div className="flex-1 flex flex-col px-6 py-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900">Agent Registration</h1>
            <p className="text-xs text-gray-400">Airtel Money</p>
          </div>
        </div>

        {/* Red accent bar */}
        <div className="h-1 rounded-full mb-6" style={{ background: `linear-gradient(90deg, ${ACCENT}, #FF6B6B)` }} />

        <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-sm mx-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
              {error}
            </div>
          )}

          <Field label="Full Name *"
            value={fullName} onChange={setFullName}
            placeholder="e.g. John Kamau"
            type="text" />

          <Field label="Phone Number *"
            value={phone} onChange={setPhone}
            placeholder="e.g. 0712345678"
            type="tel" />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Super Agent No. *"
              value={superAgentNumber} onChange={setSuperAgentNumber}
              placeholder="e.g. SA001234"
              type="text" />
            <Field label="Agent Code *"
              value={agentCode} onChange={setAgentCode}
              placeholder="e.g. AGT-001"
              type="text" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SearchableDropdown
              label="SE *"
              value={se}
              onChange={handleSEChange}
              options={seOptions}
              loading={loadingOptions}
              placeholder="Sales Executive"
            />
            <SearchableDropdown
              label="ZSM *"
              value={zsm}
              onChange={handleZSMChange}
              options={zsmOptions}
              loading={loadingOptions}
              placeholder="Zonal Sales Mgr"
            />
          </div>

          {/* Zone selector - searchable */}
          <ZoneDropdown
            value={zone}
            onChange={setZone}
            zones={ZONES}
          />

          {/* PIN */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">PIN *</label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="4–6 digit PIN"
                maxLength={6}
                className="w-full pl-4 pr-10 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400"
                style={{ color: '#111827' }}
              />
              <button type="button" onClick={() => setShowPin(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm PIN *</label>
            <input
              type={showPin ? 'text' : 'password'}
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Re-enter PIN"
              maxLength={6}
              className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400"
              style={{ color: '#111827' }}
            />
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
                Registering…
              </span>
            ) : 'CREATE ACCOUNT'}
          </button>

          <p className="text-center text-xs text-gray-400 pt-1">
            Already registered?{' '}
            <button type="button" onClick={onBack} className="font-semibold" style={{ color: ACCENT }}>
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Reusable field ───────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-gray-400"
        style={{ color: '#111827' }}
      />
    </div>
  );
}

// ─── Zone Dropdown (Searchable) ────────────────────────────────────────────

function ZoneDropdown({
  value, onChange, zones,
}: {
  value: string;
  onChange: (v: string) => void;
  zones: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = zones.filter(z =>
    z.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (zone: string) => {
    onChange(zone);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Zone *</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left appearance-none px-3 pr-8 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 flex items-center justify-between"
          style={{ color: value ? '#111827' : '#9CA3AF' }}
        >
          <span>{value || 'Select zone…'}</span>
        </button>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-10 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search zones…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>

            {filtered.length > 0 ? (
              filtered.map(zone => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => handleSelect(zone)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 transition-colors flex items-center gap-2"
                  style={value === zone ? { background: '#FED7D7', color: '#7C2D12' } : {}}
                >
                  <span>{zone}</span>
                  {value === zone && <span className="ml-auto text-xs font-semibold">✓</span>}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-400">No zones found</div>
            )}
          </div>
        )}
      </div>

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}

// ─── Searchable Dropdown ────────────────────────────────────────────────────

function SearchableDropdown({
  label, value, onChange, options, loading, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: AppUserOption[];
  loading: boolean;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(opt =>
    opt.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className="w-full text-left appearance-none px-3 pr-8 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-60 flex items-center justify-between"
          style={{ color: value ? '#111827' : '#9CA3AF' }}
        >
          <span>{value || placeholder}</span>
        </button>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-10 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />

        {isOpen && !loading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>

            {filtered.length > 0 ? (
              filtered.map((opt, idx) => (
                <button
                  key={`${opt.full_name}-${opt.zone}-${opt.zsm}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(opt.full_name)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 transition-colors flex items-center gap-2"
                  style={value === opt.full_name ? { background: '#FED7D7', color: '#7C2D12' } : {}}
                >
                  <span>{opt.full_name}</span>
                  {value === opt.full_name && <span className="ml-auto text-xs font-semibold">✓</span>}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-400">No matches</div>
            )}
          </div>
        )}
      </div>

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
}
