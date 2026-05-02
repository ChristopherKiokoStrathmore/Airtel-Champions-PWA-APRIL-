// LoginPage.tsx — Airtel Champions login page with 3D cube mode selector.
//
// ─── Auth flow (in order) ──────────────────────────────────────────────────
//
//  1. Normalise phone number (strip spaces / country code prefix).
//
//  2. INSTALLER TABLE CHECK  (INHOUSE_INSTALLER_6TOWNS_MARCH)
//     · Query by "Installer contact" column (all phone formats).
//     · If a row is found, validate the "PIN" column.
//     · If phone+PIN match:
//         – HBB mode → login as hbb_installer  (→ HBBInstallerDashboard)
//         – Sales mode → block: "Sorry, user cannot log in"
//     · If phone found but PIN wrong → "Sorry, user cannot log in"
//     · If table doesn't exist yet → silently skip; fall through to step 3.
//
//  2b. DSE TABLE CHECK  (DSE_14TOWNS)
//     · Query by "Phone" column (all phone formats).
//     · If a row is found, validate the "pin" column.
//     · If phone+PIN match:
//         – HBB mode → login as hbb_dse  (→ DSEDashboard)
//         – Sales mode → block: "Sorry, user cannot log in"
//
//  3. MODE-SPECIFIC AUTH  (only runs if step 2 found nothing)
//     · Sales mode
//         – RPC se_login against app_users
//         – Direct app_users query
//         – employee_id lookup
//         – Presence check in SE_MARCH, ZSM_MARCH (graceful if absent)
//         – Any success → login to Sales dashboard
//         – No match → "Sorry, user cannot log in"
//     · HBB mode
//         – hbbLogin edge fn (validates against agents_HBB / installers_HBB)
//         – Any success → login to HBB dashboard (role-based in App.tsx)
//         – No match → "Sorry, user cannot log in"
//
//  4. Any unhandled error → "Sorry, user cannot log in"
//
// ─── Mode persistence ──────────────────────────────────────────────────────
//  localStorage key "lastLoginMode" ('sales' | 'hbb')
//
// ─── Routing after login ───────────────────────────────────────────────────
//  App.tsx reads user.role and renders the correct dashboard:
//    hbb_installer → HBBInstallerDashboard   (already wired in App.tsx)
//    hbb_agent     → HBBAgentDashboard
//    sales_*       → HomeScreen / role dashboards

import React, { useState, useEffect, Suspense } from 'react';

import { RubiksCube, AppMode } from './RubiksCube';
import { PromoterTeamLeadEntryPage } from './promoter-team-lead/PromoterTeamLeadEntryPage';
import { AMSignUpForm } from './airtel-money/AMSignUpForm';
import { amAgentLogin, amAdminLogin } from './airtel-money/am-api';

import { supabase } from '../utils/supabase/client';
import { hbbLogin } from './hbb/hbb-api';
import { trackUserLogin } from '../lib/session-tracker';
import { trackLogin } from '../utils/analytics';
import { initActivityTracking, logPWAAction, ACTION_TYPES } from '../lib/activity-tracker';

import { DatabaseSchemaChecker } from './database-schema-checker';
import { PhoneDiagnosticTool } from './phone-diagnostic-tool';

import airtelChampionsLogo from '../assets/LOGO.png';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Generic error shown for ANY auth or authorisation failure. */
const ERR_GENERIC = 'Sorry, user cannot log in';

/** Safe fields to select from app_users (no sensitive data). */
const SAFE_USER_FIELDS =
  'id, employee_id, full_name, phone_number, role, zone, zsm, region, rank, total_points, avatar_url, profile_photo, pin, two_factor_enabled, gps_tracking_consent' as const;

/** localStorage key for mode persistence. */
const MODE_KEY = 'lastLoginMode';

// ─── Security helpers ─────────────────────────────────────────────────────────

function sanitizeUserForStorage(user: any): any {
  if (!user) return user;
  const { pin: _p, pin_hash: _h, password: _w, ...safe } = user;
  return safe;
}

// ─── Phone helpers ────────────────────────────────────────────────────────────

/** Strip formatting and country-code prefix → 9-digit core (e.g. "712345678"). */
function normalisePhone(raw: string): string {
  let p = raw.trim().replace(/[\s\-\(\)]/g, '');
  if      (p.startsWith('+254')) p = p.substring(4);
  else if (p.startsWith('254'))  p = p.substring(3);
  else if (p.startsWith('0'))    p = p.substring(1);
  return p;
}

/** Return all plausible formats for a normalised 9-digit core. */
function phoneFormats(normalised: string): string[] {
  return [
    normalised,
    '0' + normalised,
    '+254' + normalised,
    '254' + normalised,
  ];
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

const ALL_MODES: AppMode[] = ['sales', 'hbb', 'airtel-money'];

function readStoredMode(): AppMode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (ALL_MODES.includes(v as AppMode)) return v as AppMode;
  } catch { /* ignore */ }
  return 'sales';
}

function persistMode(m: AppMode) {
  try { localStorage.setItem(MODE_KEY, m); } catch { /* ignore */ }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface LoginPageProps {
  onShowSignup: () => void;
  setUser: (user: any) => void;
  setUserData: (data: any) => void;
  setIsAuthenticated: (v: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// LoginPage Component
// ─────────────────────────────────────────────────────────────────────────────

export function LoginPage({
  onShowSignup,
  setUser,
  setUserData,
  setIsAuthenticated,
}: LoginPageProps) {

  const [mode, setMode]         = useState<AppMode>(readStoredMode);
  const [phoneNumber, setPhone] = useState('');
  const [pin, setPin]           = useState('');
  const [isLoading, setLoading] = useState(false);
  const [error, setError]       = useState('');

  const [showDiagTool,    setShowDiagTool]    = useState(false);
  const [showSchemaCheck, setShowSchemaCheck] = useState(false);
  const [showHelp,        setShowHelp]        = useState(false);
  const [showTLEntry,     setShowTLEntry]     = useState(false);
  const [showAMSignUp,    setShowAMSignUp]    = useState(false);

  // First-login PIN change interception
  const [requiresPinChange, setRequiresPinChange] = useState(false);
  const [pendingUser,        setPendingUser]       = useState<any>(null);
  const [newPin,             setNewPin]            = useState('');
  const [confirmPin,         setConfirmPin]        = useState('');
  const [pinChangeError,     setPinChangeError]    = useState('');
  const [isPinChanging,      setIsPinChanging]     = useState(false);

  const isDev = (() => {
    try {
      const u = JSON.parse(localStorage.getItem('tai_user') || '{}');
      return u.role === 'developer' || u?.employee_id === 'DEV001';
    } catch { return false; }
  })();

  // Suppress UpdateManager crash when app_versions table is missing.
  useEffect(() => {
    const h = (e: PromiseRejectionEvent) => {
      if (e.reason?.message?.includes('app_versions')) {
        e.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', h);
    return () => window.removeEventListener('unhandledrejection', h);
  }, []);

  // ── PIN helpers ───────────────────────────────────────────────────────────

  /** Write new PIN to whichever source table the user logged in from. */
  const updatePinInDB = async (user: any, updatedPin: string): Promise<void> => {
    try {
      const tbl = user?.source_table ?? '';
      if (tbl === 'INHOUSE_INSTALLER_6TOWNS_MARCH') {
        await supabase.from('INHOUSE_INSTALLER_6TOWNS_MARCH')
          .update({ PIN: updatedPin }).eq('Installer contact', user.phone_number);
      } else if (tbl === 'DSE_14TOWNS') {
        await supabase.from('DSE_14TOWNS')
          .update({ pin: updatedPin }).eq('Phone', user.phone_number);
      } else if (tbl === 'installer_supervisor') {
        await supabase.from('installer_supervisor' as any)
          .update({ pin: updatedPin }).eq('Phone', user.phone_number);
      } else if (tbl === 'installers') {
        await supabase.from('installers' as any)
          .update({ pin: updatedPin }).eq('phone', user.phone_number);
      } else if (user.id) {
        await supabase.from('app_users')
          .update({ pin: updatedPin, pin_changed: true }).eq('id', user.id);
      }
    } catch { /* non-critical — user is still logged in */ }
  };

  /** Final step shared by all login paths. */
  const completeLogin = (user: any) => {
    localStorage.setItem('tai_user', JSON.stringify(sanitizeUserForStorage(user)));
    setUser(user);
    setUserData(user);
    setIsAuthenticated(true);
    setLoading(false);
  };

  /**
   * Default-PIN interception is disabled.
   * Users can continue directly after successful authentication.
   */
  const interceptDefaultPin = (_user: any, _enteredPin: string): boolean => {
    return false;
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    if (!/^\d{4,6}$/.test(newPin)) {
      setPinChangeError('PIN must be 4 – 6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinChangeError('PINs do not match — please re-enter');
      return;
    }
    if (newPin === '1234') {
      setPinChangeError('Choose a PIN different from the default 1234');
      return;
    }
    setIsPinChanging(true);
    await updatePinInDB(pendingUser, newPin);
    setIsPinChanging(false);
    completeLogin(pendingUser!);
  };

  // ── Mode toggle — cycles through all 4 sides ─────────────────────────────
  const handleModeToggle = () => {
    setMode(prev => {
      const idx  = ALL_MODES.indexOf(prev);
      const next = ALL_MODES[(idx + 1) % ALL_MODES.length];
      persistMode(next);
      return next;
    });
    setError('');
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — Installer table check
  // ─────────────────────────────────────────────────────────────────────────────
  const checkInstallerTable = async (
    normalised: string,
    enteredPin: string,
  ): Promise<any | null> => {
    const formats = phoneFormats(normalised);

    try {
      const { data, error: qErr } = await supabase
        .from('INHOUSE_INSTALLER_6TOWNS_MARCH')
        .select('*')
        .in('Installer contact', formats)
        .limit(1);

      if (qErr) {
        console.log('[Auth] INHOUSE_INSTALLER_6TOWNS_MARCH not accessible:', qErr.message);
        return null;
      }

      if (!data || data.length === 0) return null;

      const row = data[0];
      const storedPin = String(row['PIN'] ?? '').trim();

      if (enteredPin !== storedPin) throw new Error(ERR_GENERIC);

      return {
        id:               row['id'] ?? row['Installer contact'],
        full_name:        row['Installer Name'] ?? row['Name'] ?? row['name'] ?? 'Installer',
        phone_number:     row['Installer contact'],
        role:             'hbb_installer',
        town:             row['Town'] ?? row['town'] ?? '',
        source_table:     'INHOUSE_INSTALLER_6TOWNS_MARCH',
        max_jobs_per_day: row['max_jobs_per_day'] ?? null,
        status:           row['Status'] ?? row['status'] ?? 'active',
        _loginAt:         Date.now(),
      };

    } catch (err: any) {
      if (err.message === ERR_GENERIC) throw err;
      console.log('[Auth] Installer table check error (non-fatal):', err.message);
      return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2b — DSE table check
  // ─────────────────────────────────────────────────────────────────────────────
  const checkDSETable = async (
    normalised: string,
    enteredPin: string,
  ): Promise<any | null> => {
    const formats = phoneFormats(normalised);

    try {
      const { data, error: qErr } = await supabase
        .from('DSE_14TOWNS')
        .select('*')
        .in('Phone', formats)
        .limit(1);

      if (qErr) {
        console.log('[Auth] DSE_14TOWNS not accessible:', qErr.message);
        return null;
      }

      if (!data || data.length === 0) return null;

      const row = data[0];
      const storedPin = String(row['pin'] ?? '').trim();

      if (enteredPin !== storedPin) throw new Error(ERR_GENERIC);

      return {
        id:           row['ID'],
        full_name:    row['DSE Name'] ?? 'DSE',
        phone_number: row['Phone'],
        role:         'hbb_dse',
        town:         row['Town'] ?? '',
        site_name:    row['Site Name'] ?? '',
        estate_name:  row['Estate Name'] ?? '',
        source_table: 'DSE_14TOWNS',
        _loginAt:     Date.now(),
      };

    } catch (err: any) {
      if (err.message === ERR_GENERIC) throw err;
      console.log('[Auth] DSE table check error (non-fatal):', err.message);
      return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2c — Installer Supervisor table check
  // ─────────────────────────────────────────────────────────────────────────────
  const checkInstallerSupervisorTable = async (
    normalised: string,
    enteredPin: string,
  ): Promise<any | null> => {
    const formats = phoneFormats(normalised);

    try {
      const { data, error: qErr } = await supabase
        .from('installer_supervisor')
        .select('"Installers supervisor", "Phone", pin')
        .in('"Phone"', formats)
        .limit(1);

      if (qErr) {
        console.log('[Auth] installer_supervisor not accessible:', qErr.message);
        return null;
      }
      if (!data || data.length === 0) return null;

      const row = data[0];
      const storedPin = String(row.pin ?? '1234').trim();
      if (enteredPin !== storedPin) throw new Error(ERR_GENERIC);

      return {
        id:           row['Phone'],
        full_name:    row['Installers supervisor'],
        phone_number: row['Phone'],
        role:         'hbb_installer_supervisor',
        source_table: 'installer_supervisor',
        _loginAt:     Date.now(),
      };
    } catch (err: any) {
      if (err.message === ERR_GENERIC) throw err;
      console.log('[Auth] Supervisor table check error (non-fatal):', err.message);
      return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2d — Unified installers table check
  // Covers installers added after the monthly INHOUSE snapshot (e.g. April+)
  // ─────────────────────────────────────────────────────────────────────────────
  const checkUnifiedInstallersTable = async (
    normalised: string,
    enteredPin: string,
  ): Promise<any | null> => {
    const formats = phoneFormats(normalised);

    try {
      const { data, error: qErr } = await supabase
        .from('installers')
        .select('id, name, phone, pin, town, status, max_jobs_per_day')
        .in('phone', formats)
        .limit(1);

      if (qErr) {
        console.log('[Auth] installers table not accessible:', qErr.message);
        return null;
      }
      if (!data || data.length === 0) return null;

      const row = data[0];
      const storedPin = String(row.pin ?? '1234').trim();
      if (enteredPin !== storedPin) throw new Error(ERR_GENERIC);

      return {
        id:               row.id,
        full_name:        row.name,
        phone_number:     row.phone,
        role:             'hbb_installer',
        town:             row.town ?? '',
        status:           row.status ?? 'active',
        max_jobs_per_day: row.max_jobs_per_day ?? null,
        source_table:     'installers',
        _loginAt:         Date.now(),
      };
    } catch (err: any) {
      if (err.message === ERR_GENERIC) throw err;
      console.log('[Auth] Unified installers table check error (non-fatal):', err.message);
      return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2e — GA monthly table check (new + old)
  // Covers installers who only appear in the GA upload tables.
  // PIN defaults to "1234" (no PIN column on these tables).
  // ─────────────────────────────────────────────────────────────────────────────
  const checkGAMonthlyTable = async (
    normalised: string,
    enteredPin: string,
  ): Promise<any | null> => {
    const formats = phoneFormats(normalised);
    const DEFAULT_PIN = '1234';

    if (enteredPin !== DEFAULT_PIN) {
      // GA tables have no PIN column — only 1234 is accepted
      return null;
    }

    // Try new lowercase table first, fall back to old uppercase
    const tables = [
      { table: 'hbb_installer_ga_monthly', msisdnCol: 'installer_msisdn', nameCol: 'installer_name' },
      { table: 'HBB_INSTALLER_GA_MONTHLY', msisdnCol: 'installer_msisdn', nameCol: 'installer_name' },
    ] as const;

    for (const { table, msisdnCol, nameCol } of tables) {
      try {
        const { data, error: qErr } = await supabase
          .from(table as any)
          .select(`${msisdnCol}, ${nameCol}, town, month_year`)
          .in(msisdnCol, formats)
          .order('month_year', { ascending: false })
          .limit(1);

        if (qErr) {
          console.log(`[Auth] ${table} not accessible:`, qErr.message);
          continue;
        }
        if (!data || data.length === 0) continue;

        const row = data[0] as any;
        const msisdn = row[msisdnCol] ?? normalised;
        const name   = row[nameCol]   ?? 'Installer';
        const town   = row['town']     ?? '';

        console.log(`[Auth] Found installer in ${table}:`, name, msisdn);
        return {
          id:               msisdn,
          full_name:        name,
          phone_number:     msisdn.startsWith('0') ? msisdn : '0' + msisdn,
          role:             'hbb_installer',
          town,
          status:           'active',
          max_jobs_per_day: null,
          source_table:     table,
          _loginAt:         Date.now(),
        };
      } catch (err: any) {
        console.log(`[Auth] ${table} check error (non-fatal):`, err.message);
      }
    }

    return null;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3a — Sales login chain
  // ─────────────────────────────────────────────────────────────────────────────
  const runSalesLogin = async (normalised: string): Promise<void> => {
    const formats = phoneFormats(normalised);

    try {
      const { data, error: rpcErr } = await supabase.rpc('se_login', {
        input_phone: normalised,
        input_pin:   pin || '',
      });
      if (!rpcErr && data?.success) {
        await finaliseSalesLogin(data.user, 'rpc_se_login');
        return;
      }
    } catch {
      // fall through
    }

    const { data: users, error: qErr } = await supabase
      .from('app_users')
      .select(SAFE_USER_FIELDS)
      .in('phone_number', formats)
      .limit(1);

    if (qErr) throw new Error(ERR_GENERIC);

    if (users && users.length > 0) {
      const found = users[0];
      if ((pin || '') !== (found.pin || '1234')) throw new Error(ERR_GENERIC);
      await finaliseSalesLogin(found, 'direct_app_users');
      return;
    }

    const { data: empRows } = await supabase
      .from('app_users')
      .select(SAFE_USER_FIELDS)
      .eq('employee_id', phoneNumber.trim())
      .limit(1);

    if (empRows && empRows.length > 0) {
      const found = empRows[0];
      if ((pin || '') !== (found.pin || '1234')) throw new Error(ERR_GENERIC);
      await finaliseSalesLogin(found, 'employee_id');
      return;
    }

    const AUX_SALES: Array<{ table: string; col: string }> = [
      { table: 'SE_MARCH',  col: 'phone_number' },
      { table: 'ZSM_MARCH', col: 'phone_number' },
    ];

    for (const { table, col } of AUX_SALES) {
      try {
        const { data: auxRows, error: auxErr } = await supabase
          .from(table)
          .select('*')
          .in(col, formats)
          .limit(1);

        if (auxErr) continue;
        if (auxRows && auxRows.length > 0) throw new Error(ERR_GENERIC);
      } catch (e: any) {
        if (e.message === ERR_GENERIC) throw e;
      }
    }

    throw new Error(ERR_GENERIC);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3b — HBB login chain
  // ─────────────────────────────────────────────────────────────────────────────
  const runHbbLogin = async (): Promise<void> => {
    try {
      const result = await hbbLogin(phoneNumber.trim(), pin || '');

      if (result?.role) {
        const hbbData = {
          id:               result.id,
          full_name:        result.full_name,
          phone_number:     result.phone_number,
          role:             result.role,
          town_id:          result.town_id,
          status:           result.status,
          source_table:     result.source_table,
          max_jobs_per_day: result.max_jobs_per_day,
          _loginAt:         Date.now(),
        };
        if (!interceptDefaultPin(hbbData, pin || '')) completeLogin(hbbData);
        return;
      }
    } catch {
      // swallow edge-fn errors below
    }

    throw new Error(ERR_GENERIC);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Shared post-login finalisation (Sales + Installer paths)
  // ─────────────────────────────────────────────────────────────────────────────
  const finaliseSalesLogin = async (user: any, method: string): Promise<void> => {
    trackUserLogin(user.id, user.full_name, user.role);
    await trackLogin(user.id);
    initActivityTracking(user.id, user.full_name, user.role);
    logPWAAction(ACTION_TYPES.LOGIN, { method });

    try {
      await supabase
        .from('app_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);
    } catch { /* non-critical */ }

    if (!interceptDefaultPin(user, pin || '')) completeLogin(user);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3c — Airtel Money login chain (agent → admin)
  // ─────────────────────────────────────────────────────────────────────────────
  const runAMLogin = async (): Promise<void> => {
    // Try agent login first
    const agent = await amAgentLogin(phoneNumber.trim(), (pin || '').trim());
    if (agent) {
      console.log('✅ Airtel Money agent login successful:', agent.full_name);
      const userData = { ...agent, _loginAt: Date.now() };
      if (!interceptDefaultPin(userData, pin || '')) completeLogin(userData);
      return;
    }

    // Try admin login
    const admin = await amAdminLogin(phoneNumber.trim(), (pin || '').trim());
    if (admin) {
      console.log('✅ Airtel Money admin login successful:', admin.full_name);
      const userData = { ...admin, _loginAt: Date.now() };
      if (!interceptDefaultPin(userData, pin || '')) completeLogin(userData);
      return;
    }

    throw new Error(ERR_GENERIC);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Main submit handler
  // ─────────────────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalised = normalisePhone(phoneNumber);
      console.log(`📱 [${mode.toUpperCase()}] Login attempt, normalised:`, normalised);

      // ── STEP 2: Installer table ──────────────────────────────────────────
      const installerUser = await checkInstallerTable(normalised, pin || '');

      if (installerUser) {
        if (mode === 'hbb') {
          console.log('✅ Installer login (INHOUSE table):', installerUser.full_name);
          if (!interceptDefaultPin(installerUser, pin || '')) completeLogin(installerUser);
        } else {
          throw new Error(ERR_GENERIC);
        }
        return;
      }

      // ── STEP 2b: DSE table check ─────────────────────────────────────────
      const dseUser = await checkDSETable(normalised, pin || '');

      if (dseUser) {
        if (mode === 'hbb') {
          console.log('✅ DSE login (DSE_14TOWNS table):', dseUser.full_name);
          if (!interceptDefaultPin(dseUser, pin || '')) completeLogin(dseUser);
        } else {
          throw new Error(ERR_GENERIC);
        }
        return;
      }

      // ── STEP 2c: Installer Supervisor table check ────────────────────────
      if (mode === 'hbb') {
        const supervisorUser = await checkInstallerSupervisorTable(normalised, pin || '');
        if (supervisorUser) {
          console.log('✅ Supervisor login:', supervisorUser.full_name);
          if (!interceptDefaultPin(supervisorUser, pin || '')) completeLogin(supervisorUser);
          return;
        }
      }

      // ── STEP 2d: Unified installers table check ──────────────────────────
      if (mode === 'hbb') {
        const unifiedInstaller = await checkUnifiedInstallersTable(normalised, pin || '');
        if (unifiedInstaller) {
          console.log('✅ Installer login (unified table):', unifiedInstaller.full_name);
          if (!interceptDefaultPin(unifiedInstaller, pin || '')) completeLogin(unifiedInstaller);
          return;
        }
      }

      // ── STEP 2e: GA monthly table check (no edge function needed) ─────────
      if (mode === 'hbb') {
        const gaInstaller = await checkGAMonthlyTable(normalised, pin || '');
        if (gaInstaller) {
          console.log('✅ Installer login (GA monthly table):', gaInstaller.full_name);
          if (!interceptDefaultPin(gaInstaller, pin || '')) completeLogin(gaInstaller);
          return;
        }
      }

      if (mode === 'sales') {
        await runSalesLogin(normalised);
      } else if (mode === 'hbb') {
        // All direct table checks exhausted — fail fast without edge function
        throw new Error(ERR_GENERIC);
      } else if (mode === 'airtel-money') {
        await runAMLogin();
      }

    } catch (err: any) {
      console.error('Login error:', err.message);
      setError(ERR_GENERIC);
      setLoading(false);
    }
  };

  // First-login PIN change screen
  if (requiresPinChange && pendingUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: '#FEF2F2' }}>
              <svg className="w-7 h-7" style={{ color: '#E60000' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Set a new PIN</h2>
            <p className="text-sm text-gray-500 mt-1">
              For your security, please change your default PIN before continuing.
            </p>
          </div>

          <form onSubmit={handlePinChange} className="space-y-3">
            {pinChangeError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
                <p className="font-semibold">{pinChangeError}</p>
              </div>
            )}

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type="password"
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="New PIN (4 – 6 digits)"
                maxLength={6}
                className="w-full pl-12 pr-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-gray-400"
                style={{ color: '#111827' }}
                autoFocus
                required
              />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <input
                type="password"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Confirm new PIN"
                maxLength={6}
                className="w-full pl-12 pr-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-gray-400"
                style={{ color: '#111827' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isPinChanging}
              className="w-full py-3.5 text-sm bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold tracking-wide"
            >
              {isPinChanging ? (
                <span className="flex items-center justify-center">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving…
                </span>
              ) : 'SET NEW PIN & CONTINUE'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show Team Lead entry page when button is tapped
  if (showTLEntry) {
    return (
      <PromoterTeamLeadEntryPage
        onSuccess={() => window.location.reload()}
        onBack={() => setShowTLEntry(false)}
      />
    );
  }

  // Show Airtel Money agent sign-up
  if (showAMSignUp) {
    return (
      <AMSignUpForm
        onBack={() => setShowAMSignUp(false)}
        onSuccess={(newAgent) => {
          const userData = { ...newAgent, _loginAt: Date.now() };
          localStorage.setItem('tai_user', JSON.stringify(userData));
          setUser(userData);
          setUserData(userData);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const isHBB         = mode === 'hbb';
  const isAirtelMoney = mode === 'airtel-money';

  const modeLabel: Record<AppMode, string> = {
    'sales':        'Airtel Champions Sales',
    'hbb':          'Airtel Champions HBB',
    'airtel-money': 'Airtel Champions Airtel Money',
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
      <div className="w-full max-w-sm mx-auto">

        {/* ① 3D logo cube ───────────────────────────────────────────────── */}
        <div style={{ width: '100%', height: '130px' }}>
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-32 h-32 rounded-3xl overflow-hidden"
                  style={{ boxShadow: '0 20px 60px rgba(230,0,0,0.35)' }}>
                  <img src={airtelChampionsLogo} alt="Airtel Champions"
                       className="w-full h-full object-cover" />
                </div>
              </div>
            }
          >
            <RubiksCube logoSrc={airtelChampionsLogo} onToggle={handleModeToggle} />
          </Suspense>
        </div>

        {/* ② Mode label ─────────────────────────────────────────────────── */}
        <p className="text-center text-base font-bold mt-1 tracking-tight"
          style={{ color: '#E60000' }}>
          {modeLabel[mode]}
        </p>

        {/* ③ Tap hint ───────────────────────────────────────────────────── */}
        <p className="text-center text-[11px] text-gray-400 mt-0.5 mb-4 tracking-wide">
          Tap cube to switch mode · Side {ALL_MODES.indexOf(mode) + 1} of 3
        </p>

        {/* ④ Login form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleLogin} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Phone */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </span>
            <input
              data-testid="phone-input"
              type="tel"
              value={phoneNumber}
              onChange={e => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full pl-12 pr-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-gray-400"
              style={{ color: '#111827' }}
              required
              autoFocus
            />
          </div>

          {/* PIN */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              data-testid="pin-input"
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter your PIN"
              maxLength={6}
              className="w-full pl-12 pr-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-gray-400"
              style={{ color: '#111827' }}
            />
          </div>

          {/* SIGN IN */}
          <button
            data-testid="login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 text-sm bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold tracking-wide"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Signing in…
              </span>
            ) : 'SIGN IN'}
          </button>
        </form>

        {/* ⑤ Mode-specific sections ──────────────────────────────────────── */}

        {/* HBB: submit leads */}
        {isHBB && (
          <div className="mt-3">
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-3 text-gray-400 uppercase tracking-widest font-medium"
                  style={{ background: 'var(--theme-bg-card, #ffffff)' }}>
                  Want to submit HBB leads?
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onShowSignup}
              className="w-full py-3.5 text-sm border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all font-semibold tracking-wide"
            >
              SIGN UP
            </button>
          </div>
        )}

        {/* Sales: Promoter Team Lead */}
        {mode === 'sales' && (
          <div className="mt-3">
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-3 text-gray-400 uppercase tracking-widest font-medium"
                  style={{ background: 'var(--theme-bg-card, #ffffff)' }}>
                  Are you a Promoter Team Lead?
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTLEntry(true)}
              className="w-full py-3.5 text-sm border-2 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all font-semibold tracking-wide"
              style={{ borderColor: '#E60000', color: '#E60000' }}
            >
              PROMOTER TEAM LEAD
            </button>
          </div>
        )}

        {/* Airtel Money: agent sign-up */}
        {isAirtelMoney && (
          <div className="mt-3">
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="px-3 text-gray-400 uppercase tracking-widest font-medium"
                  style={{ background: 'var(--theme-bg-card, #ffffff)' }}>
                  New agent?
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAMSignUp(true)}
              className="w-full py-3.5 text-sm border-2 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all font-semibold tracking-wide"
              style={{ borderColor: '#E60000', color: '#E60000' }}
            >
              REGISTER AS AGENT
            </button>
          </div>
        )}

        {/* ⑥ Help link ─────────────────────────────────────────────────────── */}
        <div className="mt-4 text-center">
          <button type="button" onClick={() => setShowHelp(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors tracking-wide">
            Need help signing in?
          </button>
        </div>

        {/* ── Help contact modal ─────────────────────────────────────────── */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md"
               onClick={() => setShowHelp(false)}>
            <div className="relative bg-white/95 w-[calc(100%-3rem)] max-w-sm rounded-3xl p-8 shadow-2xl"
                 onClick={e => e.stopPropagation()}
                 style={{ boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25)' }}>

              <button onClick={() => setShowHelp(false)}
                      className="absolute top-5 right-5 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-5 shadow-lg"
                   style={{ boxShadow: '0 8px 24px -4px rgba(220,38,38,0.4)' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>

              <h3 className="text-center text-lg font-semibold text-gray-900 tracking-tight">
                We're here to help
              </h3>
              <p className="text-center text-xs text-gray-400 mt-1.5 mb-6 leading-relaxed">
                Get assistance with signing in or<br />creating your account
              </p>

              <div className="space-y-2.5">
                <a href="tel:0785638462"
                   className="flex items-center gap-3 w-full py-3.5 px-5 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 active:scale-[0.98] transition-all font-medium text-sm">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Call Support</div>
                    <div className="text-[11px] text-white/60">0785 638 462</div>
                  </div>
                </a>

                <a href="https://wa.me/254785638462?text=Hello%2C%20I%20am%20reaching%20out%20for%20assistance%20with%20signing%20in%20or%20registering%20on%20the%20Airtel%20Champions%20platform.%20Kindly%20assist.%20Thank%20you."
                   target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-3 w-full py-3.5 px-5 bg-green-500 text-white rounded-2xl hover:bg-green-600 active:scale-[0.98] transition-all font-medium text-sm">
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.554 4.107 1.523 5.832L.057 23.704a.75.75 0 00.92.92l5.872-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.726 9.726 0 01-4.964-1.355l-.356-.211-3.685.921.937-3.591-.232-.371A9.722 9.722 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">WhatsApp Support</div>
                    <div className="text-[11px] text-white/60">Chat with us</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Developer diagnostic buttons ──────────────────────────────── */}
        {isDev && (
          <>
            <button onClick={() => setShowSchemaCheck(true)}
                    className="fixed bottom-24 right-6 px-4 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all flex items-center gap-2 text-sm font-medium z-50">
              🔍 DB Check
            </button>
            <button onClick={() => setShowDiagTool(true)}
                    className="fixed bottom-6 right-6 px-4 py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2 text-sm font-medium z-50">
              🔧 Phone Debug
            </button>
          </>
        )}

        {showSchemaCheck && <DatabaseSchemaChecker onClose={() => setShowSchemaCheck(false)} />}
        {showDiagTool    && <PhoneDiagnosticTool   onClose={() => setShowDiagTool(false)} />}

      </div>
      </div>
    </div>
  );
}
