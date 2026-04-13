import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, MapPin, Plus, Trash2, Clock, CheckCircle, Lock,
  ChevronDown, ChevronUp, Loader2, AlertCircle, Save,
  Pause, ArrowLeft, Phone, Users, Target, TrendingUp,
  MessageSquare
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getSupabaseClient } from '../../utils/supabase/client';
import { useTheme } from '../theme-provider';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653`;

interface SessionCheckinModalProps {
  program: {
    id: string;
    title: string;
    description?: string;
    points_value?: number;
    points_enabled?: boolean;
    zone_filtering_enabled?: boolean;
    linked_checkin_program_id?: string; // Checkout mode: linked check-in program
  };
  userId: string;
  onClose: () => void;
  onSuccess: (pointsAwarded: number, newTotal: number) => void;
}

interface PromoterEntry {
  id: string;
  msisdn: string;
  ga_done?: number;
  from_checkin?: boolean;
}

interface SiteEntry {
  id: string;
  name: string;
  ga_target?: number; // Daily GA target for this site
  ga_actual?: number; // GAs achieved — only editable after 6 PM
  gps?: { lat: number; lng: number; accuracy?: number };
  added_at: string;
  promoters: PromoterEntry[]; // MSISDNs are per-site
}

interface CheckinSession {
  id: string;
  program_id: string;
  user_id: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  sites: SiteEntry[];
  total_gas: number;
  comments?: string;
  number_plate?: string;
}

export function SessionCheckinModal({ program, userId, onClose, onSuccess }: SessionCheckinModalProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [session, setSession] = useState<CheckinSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const [isAfter6PM, setIsAfter6PM] = useState(false);
  const [alreadyClosed, setAlreadyClosed] = useState(false);

  // Site entry
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [siteSearchQuery, setSiteSearchQuery] = useState('');
  const [siteSearchResults, setSiteSearchResults] = useState<any[]>([]);
  const [searchingSites, setSearchingSites] = useState(false);
  const siteSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-site MSISDN entry — track which site is being edited
  const [activeMsisdnSiteId, setActiveMsisdnSiteId] = useState<string | null>(null);
  const [newMsisdn, setNewMsisdn] = useState('');
  const [msisdnError, setMsisdnError] = useState('');

  // Expandable sections
  const [sitesExpanded, setSitesExpanded] = useState(true);
  const [expandedSiteIds, setExpandedSiteIds] = useState<Set<string>>(new Set());

  // Comments / notes
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const commentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savingAndClosing, setSavingAndClosing] = useState(false);

  // Checkout mode detection
  const isCheckoutMode = !!program.linked_checkin_program_id;
  const [checkinDataLoaded, setCheckinDataLoaded] = useState(false);
  const [checkinDataMessage, setCheckinDataMessage] = useState('');

  // 🚐 Van / Number Plate registration
  const [numberPlate, setNumberPlate] = useState('');
  const [vanRegistered, setVanRegistered] = useState(false);
  const [vanRegistering, setVanRegistering] = useState(false);
  const [showVanInput, setShowVanInput] = useState(false);

  // ============================================
  // API HELPERS
  // ============================================

  const apiHeaders = useCallback(() => ({
    'Authorization': `Bearer ${publicAnonKey}`,
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  }), [userId]);

  // ============================================
  // LOAD / CREATE SESSION
  // ============================================

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('[SessionCheckin] Loading session for program:', program.id);

        const res = await fetch(`${API_BASE}/programs/${program.id}/checkin/open`, {
          headers: apiHeaders(),
        });

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load session');
        }

        console.log('[SessionCheckin] Session loaded:', {
          id: data.session.id,
          is_new: data.is_new,
          is_after_6pm: data.is_after_6pm,
          already_closed: data.already_closed,
          opened_at: data.session.opened_at,
          sites: data.session.sites?.length || 0,
        });

        // Normalize session — ensure sites have promoters arrays
        const rawSites = Array.isArray(data.session.sites) ? data.session.sites : [];
        const normalizedSites: SiteEntry[] = rawSites.map((s: any) => ({
          ...s,
          promoters: Array.isArray(s.promoters) ? s.promoters : [],
        }));

        const normalizedSession: CheckinSession = {
          ...data.session,
          sites: normalizedSites,
          total_gas: data.session.total_gas ?? 0,
          comments: data.session.comments || '',
        };
        setSession(normalizedSession);
        setIsAfter6PM(data.is_after_6pm);
        setAlreadyClosed(data.already_closed || false);

        // 🚐 Restore number plate from session data
        if (data.session.number_plate) {
          setNumberPlate(data.session.number_plate);
          setVanRegistered(true);
        }

        // Auto-expand all sites that have promoters
        const expanded = new Set<string>();
        normalizedSites.forEach(s => {
          if (s.promoters.length > 0) expanded.add(s.id);
        });
        setExpandedSiteIds(expanded);

        // Auto-expand comments if there's existing content
        if (data.session.comments) {
          setCommentsExpanded(true);
        }

        // Checkout mode: auto-populate MSISDNs from linked check-in
        if (isCheckoutMode && data.is_new && program.linked_checkin_program_id) {
          try {
            console.log('[SessionCheckin] Checkout mode: fetching linked check-in data from', program.linked_checkin_program_id);
            const linkedRes = await fetch(
              `${API_BASE}/programs/${program.id}/checkin/linked-data?linked_program_id=${program.linked_checkin_program_id}`,
              { headers: apiHeaders() }
            );
            const linkedData = await linkedRes.json();

            if (linkedData.success && linkedData.has_checkin && linkedData.sites?.length > 0) {
              const importedSites: SiteEntry[] = linkedData.sites.map((s: any) => ({
                id: crypto.randomUUID(),
                name: s.name,
                ga_target: s.ga_target || 0,
                added_at: new Date().toISOString(),
                promoters: (s.promoters || []).map((p: any) => ({
                  id: crypto.randomUUID(),
                  msisdn: p.msisdn,
                  ga_done: 0,
                  from_checkin: true,
                })),
              }));

              const totalImportedPromoters = importedSites.reduce((sum: number, s: SiteEntry) => sum + s.promoters.length, 0);

              const updatedSession: CheckinSession = {
                ...normalizedSession,
                sites: importedSites,
              };
              setSession(updatedSession);

              const importedExpanded = new Set<string>();
              importedSites.forEach(s => importedExpanded.add(s.id));
              setExpandedSiteIds(importedExpanded);

              // Save immediately (use inline save to avoid stale ref)
              try {
                await fetch(`${API_BASE}/programs/${program.id}/checkin/save`, {
                  method: 'POST',
                  headers: apiHeaders(),
                  body: JSON.stringify({
                    session_id: updatedSession.id,
                    sites: updatedSession.sites,
                    total_gas: 0,
                    comments: '',
                  }),
                });
              } catch {}

              setCheckinDataLoaded(true);
              setCheckinDataMessage(`Auto-populated ${totalImportedPromoters} MSISDNs from ${importedSites.length} site(s) from today's check-in`);
              console.log(`[SessionCheckin] Checkout: imported ${totalImportedPromoters} MSISDNs from ${importedSites.length} sites`);
            } else {
              setCheckinDataMessage(linkedData.message || 'No check-in data found for today. Add MSISDNs manually.');
              console.log('[SessionCheckin] Checkout: no check-in data available');
            }
          } catch (linkedErr: any) {
            console.error('[SessionCheckin] Error fetching linked check-in data:', linkedErr);
            setCheckinDataMessage('Could not load check-in data. You can add MSISDNs manually.');
          }
        }
      } catch (err: any) {
        console.error('[SessionCheckin] Error loading session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [program.id, userId]);

  // ============================================
  // AUTO-SAVE (debounced)
  // ============================================

  const autoSave = useCallback(async (updatedSession: CheckinSession) => {
    if (updatedSession.status !== 'open') return;

    setSaving(true);
    try {
      console.log('[SessionCheckin] Auto-saving...');
      // Read number_plate from the session object to avoid stale closure issues
      const sessionPlate = updatedSession.number_plate;
      const res = await fetch(`${API_BASE}/programs/${program.id}/checkin/save`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          session_id: updatedSession.id,
          sites: updatedSession.sites,
          total_gas: updatedSession.total_gas,
          comments: updatedSession.comments,
          number_plate: sessionPlate || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        console.error('[SessionCheckin] Save failed:', data.error);
      } else {
        console.log('[SessionCheckin] Auto-saved successfully');
      }
    } catch (err: any) {
      console.error('[SessionCheckin] Auto-save error:', err);
    } finally {
      setSaving(false);
    }
  }, [program.id, apiHeaders]);

  const debouncedSave = useCallback((updatedSession: CheckinSession) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => autoSave(updatedSession), 500);
  }, [autoSave]);

  // ============================================
  // SITE SEARCH
  // ============================================

  const searchSites = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSiteSearchResults([]);
      return;
    }
    setSearchingSites(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error: searchErr } = await supabase
        .from('sitewise')
        .select('*')
        .ilike('SITE', `%${query}%`)
        .limit(30);

      if (searchErr) {
        console.warn('[SessionCheckin] Site search error:', searchErr.message);
        const { data: fallback, error: fallbackErr } = await supabase
          .from('sitewise')
          .select('*')
          .or(`"SITE ID".ilike.%${query}%,"TOWN CATEGORY".ilike.%${query}%`)
          .limit(30);
        if (fallbackErr) {
          setSiteSearchResults([]);
        } else {
          setSiteSearchResults(fallback || []);
        }
      } else {
        setSiteSearchResults(data || []);
      }
    } catch (err) {
      console.error('[SessionCheckin] Site search error:', err);
      setSiteSearchResults([]);
    } finally {
      setSearchingSites(false);
    }
  }, []);

  const handleSiteSearchChange = useCallback((query: string) => {
    setSiteSearchQuery(query);
    if (siteSearchTimer.current) clearTimeout(siteSearchTimer.current);
    siteSearchTimer.current = setTimeout(() => searchSites(query), 300);
  }, [searchSites]);

  const getSiteDisplayName = (siteRow: any): string => {
    return siteRow['SITE'] || siteRow['SITE ID'] || siteRow['site_name'] || siteRow['SITE_NAME'] || siteRow['SITE NAME'] ||
           siteRow['name'] || siteRow['NAME'] || JSON.stringify(siteRow).slice(0, 50);
  };

  // ============================================
  // SITE ACTIONS
  // ============================================

  const handleAddSite = useCallback((siteName: string, siteData?: any) => {
    if (!session || session.status !== 'open') return;

    if (session.sites.some(s => s.name === siteName)) {
      setError('This site has already been added');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const siteId = crypto.randomUUID();

    // Capture GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSession(prev => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              sites: prev.sites.map(s =>
                s.id === siteId
                  ? { ...s, gps: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy } }
                  : s
              ),
            };
            debouncedSave(updated);
            return updated;
          });
        },
        () => { /* GPS unavailable */ },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    const newSite: SiteEntry = {
      id: siteId,
      name: siteName,
      added_at: new Date().toISOString(),
      promoters: [],
    };

    const updated = {
      ...session,
      sites: [...session.sites, newSite],
    };

    setSession(updated);
    debouncedSave(updated);
    setShowSiteSelector(false);
    setSiteSearchQuery('');
    setSiteSearchResults([]);
    setError('');

    // Auto-expand the newly added site
    setExpandedSiteIds(prev => new Set([...prev, siteId]));
  }, [session, debouncedSave]);

  const handleRemoveSite = useCallback((siteId: string) => {
    if (!session || session.status !== 'open') return;

    const updated = {
      ...session,
      sites: session.sites.filter(s => s.id !== siteId),
    };
    // Recalculate total GAs
    updated.total_gas = isCheckoutMode
      ? updated.sites.reduce((sum, s) => sum + s.promoters.reduce((pSum, p) => pSum + (p.ga_done || 0), 0), 0)
      : updated.sites.reduce((sum, s) => sum + (s.ga_actual || 0), 0);
    setSession(updated);
    debouncedSave(updated);

    // Clean up expanded state
    setExpandedSiteIds(prev => {
      const next = new Set(prev);
      next.delete(siteId);
      return next;
    });
    if (activeMsisdnSiteId === siteId) {
      setActiveMsisdnSiteId(null);
      setNewMsisdn('');
      setMsisdnError('');
    }
  }, [session, debouncedSave, activeMsisdnSiteId]);

  // ============================================
  // PER-SITE PROMOTER (MSISDN) ACTIONS
  // ============================================

  const validateMsisdn = (msisdn: string, siteId: string): string | null => {
    const cleaned = msisdn.replace(/\s/g, '');
    const normalized = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;

    if (!/^\d+$/.test(normalized)) return 'Must contain only digits';
    if (normalized.length !== 9) return 'Must be 9 digits (without leading 0)';

    // Check duplicate within this site
    const site = session?.sites.find(s => s.id === siteId);
    if (site?.promoters.some(p => p.msisdn === normalized)) return 'This MSISDN already added to this site';

    return null;
  };

  const handleAddPromoter = useCallback((siteId: string) => {
    if (!session || session.status !== 'open') return;

    const cleaned = newMsisdn.replace(/\s/g, '');
    const normalized = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    const validationError = validateMsisdn(cleaned, siteId);

    if (validationError) {
      setMsisdnError(validationError);
      return;
    }

    const newPromoter: PromoterEntry = {
      id: crypto.randomUUID(),
      msisdn: normalized,
      ...(isCheckoutMode ? { ga_done: 0, from_checkin: false } : {}),
    };

    const updated = {
      ...session,
      sites: session.sites.map(s =>
        s.id === siteId
          ? { ...s, promoters: [...s.promoters, newPromoter] }
          : s
      ),
    };

    setSession(updated);
    debouncedSave(updated);
    setNewMsisdn('');
    setMsisdnError('');
  }, [session, newMsisdn, debouncedSave]);

  const handleRemovePromoter = useCallback((siteId: string, promoterId: string) => {
    if (!session || session.status !== 'open') return;

    const updated = {
      ...session,
      sites: session.sites.map(s =>
        s.id === siteId
          ? { ...s, promoters: s.promoters.filter(p => p.id !== promoterId) }
          : s
      ),
    };
    updated.total_gas = isCheckoutMode
      ? updated.sites.reduce((sum, s) => sum + s.promoters.reduce((pSum, p) => pSum + (p.ga_done || 0), 0), 0)
      : updated.sites.reduce((sum, s) => sum + (s.ga_actual || 0), 0);
    setSession(updated);
    debouncedSave(updated);
  }, [session, debouncedSave, isCheckoutMode]);

  // Per-MSISDN GA Done — used in checkout mode
  const handlePromoterGAChange = useCallback((siteId: string, promoterId: string, gaValue: number) => {
    if (!session || session.status === 'closed' || alreadyClosed) return;

    const updated = {
      ...session,
      sites: session.sites.map(s =>
        s.id === siteId
          ? {
              ...s,
              promoters: s.promoters.map(p =>
                p.id === promoterId ? { ...p, ga_done: gaValue } : p
              ),
            }
          : s
      ),
    };
    // In checkout mode, total_gas = sum of all per-MSISDN ga_done values
    if (isCheckoutMode) {
      updated.total_gas = updated.sites.reduce((sum, s) =>
        sum + s.promoters.reduce((pSum, p) => pSum + (p.ga_done || 0), 0), 0
      );
    }
    setSession(updated);
    debouncedSave(updated);
  }, [session, debouncedSave, alreadyClosed, isCheckoutMode]);

  // Per-site GA Actual — only editable after 6 PM
  const handleGAActualChange = useCallback((siteId: string, actualValue: number) => {
    if (!session || session.status === 'closed' || alreadyClosed) return;

    const updated = {
      ...session,
      sites: session.sites.map(s =>
        s.id === siteId ? { ...s, ga_actual: actualValue } : s
      ),
    };
    updated.total_gas = updated.sites.reduce((sum, s) => sum + (s.ga_actual || 0), 0);
    setSession(updated);
    debouncedSave(updated);
  }, [session, debouncedSave, alreadyClosed]);

  const handleGATargetChange = useCallback((siteId: string, targetValue: number) => {
    if (!session || session.status === 'closed' || alreadyClosed) return;

    const updated = {
      ...session,
      sites: session.sites.map(s =>
        s.id === siteId ? { ...s, ga_target: targetValue } : s
      ),
    };
    setSession(updated);
    debouncedSave(updated);
  }, [session, debouncedSave, alreadyClosed]);

  const toggleSiteExpanded = useCallback((siteId: string) => {
    setExpandedSiteIds(prev => {
      const next = new Set(prev);
      if (next.has(siteId)) {
        next.delete(siteId);
        if (activeMsisdnSiteId === siteId) {
          setActiveMsisdnSiteId(null);
          setNewMsisdn('');
          setMsisdnError('');
        }
      } else {
        next.add(siteId);
      }
      return next;
    });
  }, [activeMsisdnSiteId]);

  // ============================================
  // VAN REGISTRATION
  // ============================================

  const registerVan = useCallback(async (plate: string) => {
    if (!plate.trim() || !session) return;

    const plateNormalized = plate.trim().toUpperCase();
    setVanRegistering(true);

    try {
      console.log(`[SessionCheckin] 🚐 Registering van: ${plateNormalized} for program ${program.id}`);

      // 1. Register via van-register endpoint (creates KV entry for fast lookup)
      const res = await fetch(`${API_BASE}/checkin/van-register`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          program_id: program.id,
          number_plate: plateNormalized,
          session_id: session.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        console.log(`[SessionCheckin] ✅ Van registered: ${plateNormalized}`);
        setVanRegistered(true);
        setNumberPlate(plateNormalized);
        setShowVanInput(false);

        // 2. Also save to session data (so it persists in the session and appears in submissions)
        const updatedSession = { ...session, number_plate: plateNormalized };
        setSession(updatedSession);
        debouncedSave(updatedSession);
      } else {
        console.error('[SessionCheckin] Van registration failed:', data.error);
        setError(`Failed to register van: ${data.error}`);
      }
    } catch (err: any) {
      console.error('[SessionCheckin] Van registration error:', err);
      setError(`Van registration error: ${err.message}`);
    } finally {
      setVanRegistering(false);
    }
  }, [session, program.id, apiHeaders, debouncedSave]);

  // ============================================
  // CLOSE SESSION
  // ============================================

  const handleCloseSession = useCallback(async () => {
    if (!session) return;

    if (session.sites.length === 0) {
      setError('Please add at least one site before closing');
      return;
    }

    const totalPromoters = session.sites.reduce((sum, s) => sum + s.promoters.length, 0);
    if (totalPromoters === 0) {
      setError('Please add at least one MSISDN to any site before closing');
      return;
    }

    if (!confirm('Are you sure you want to close this session? This action cannot be undone.')) {
      return;
    }

    setClosing(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/programs/${program.id}/checkin/close`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          session_id: session.id,
          sites: session.sites,
          total_gas: session.total_gas,
          comments: session.comments,
          number_plate: numberPlate || session.number_plate || undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.session && data.session.status === 'closed') {
          console.warn('[SessionCheckin] Session was already closed');
          const rawSites = Array.isArray(data.session.sites) ? data.session.sites : [];
          const closedNormalized: CheckinSession = {
            ...data.session,
            sites: rawSites.map((s: any) => ({ ...s, promoters: Array.isArray(s.promoters) ? s.promoters : [] })),
            total_gas: data.session.total_gas ?? 0,
          };
          setSession(closedNormalized);
          setAlreadyClosed(true);
          setClosing(false);
          return;
        }
        throw new Error(data.error || 'Failed to close session');
      }

      console.log('[SessionCheckin] Session closed successfully');
      const rawSites = Array.isArray(data.session.sites) ? data.session.sites : [];
      const closedNormalized: CheckinSession = {
        ...data.session,
        sites: rawSites.map((s: any) => ({ ...s, promoters: Array.isArray(s.promoters) ? s.promoters : [] })),
        total_gas: data.session.total_gas ?? 0,
      };
      setSession(closedNormalized);
      setAlreadyClosed(true);

      const supabase = getSupabaseClient();
      const { data: userData } = await supabase
        .from('app_users')
        .select('total_points')
        .eq('id', userId)
        .single();

      const storedUser = localStorage.getItem('tai_user');
      if (storedUser && userData) {
        const user = JSON.parse(storedUser);
        user.total_points = userData.total_points;
        localStorage.setItem('tai_user', JSON.stringify(user));
      }

      onSuccess(program.points_value || 0, userData?.total_points || 0);
    } catch (err: any) {
      console.error('[SessionCheckin] Close error:', err);
      setError(err.message);
    } finally {
      setClosing(false);
    }
  }, [session, program, userId, apiHeaders, onSuccess]);

  // ============================================
  // SAVE & CONTINUE LATER
  // ============================================

  const handleSaveAndContinueLater = useCallback(async () => {
    if (!session || session.status !== 'open') {
      onClose();
      return;
    }

    setSavingAndClosing(true);
    setError('');

    try {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      console.log('[SessionCheckin] Saving and closing for later...');
      const res = await fetch(`${API_BASE}/programs/${program.id}/checkin/save`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({
          session_id: session.id,
          sites: session.sites,
          total_gas: session.total_gas,
          comments: session.comments,
          number_plate: session.number_plate || undefined,
          save_and_continue: true,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        console.error('[SessionCheckin] Save-and-close failed:', data.error);
        setError('Failed to save session. Please try again.');
        setSavingAndClosing(false);
        return;
      }

      console.log('[SessionCheckin] Saved successfully — closing modal');
      onClose();
    } catch (err: any) {
      console.error('[SessionCheckin] Save-and-close error:', err);
      setError('Network error while saving. Please try again.');
      setSavingAndClosing(false);
    }
  }, [session, program.id, apiHeaders, onClose]);

  // ============================================
  // DERIVED STATE
  // ============================================

  const isReadOnly = session?.status === 'closed' || alreadyClosed;
  // In checkout mode: no time gate restriction — can close any time
  const canClose = isCheckoutMode
    ? (session?.status === 'open' && !alreadyClosed)
    : (isAfter6PM && session?.status === 'open' && !alreadyClosed);
  // In checkout mode: can always add content (no time gate)
  const canAddContent = isCheckoutMode ? !isReadOnly : (!isAfter6PM && !isReadOnly);
  const canEditGAActual = isCheckoutMode ? !isReadOnly : (isAfter6PM && !isReadOnly);

  const sites: SiteEntry[] = session?.sites && Array.isArray(session.sites)
    ? session.sites.map(s => ({ ...s, promoters: Array.isArray(s.promoters) ? s.promoters : [] }))
    : [];
  const totalPromoters = sites.reduce((sum, s) => sum + s.promoters.length, 0);
  // In checkout mode, GAs are tracked per-MSISDN
  const totalGaActual = isCheckoutMode
    ? sites.reduce((sum, s) => sum + s.promoters.reduce((pSum, p) => pSum + (p.ga_done || 0), 0), 0)
    : sites.reduce((sum, s) => sum + (s.ga_actual || 0), 0);
  const totalGaTarget = sites.reduce((sum, s) => sum + (s.ga_target || 0), 0);
  const overallAchievement = totalGaTarget > 0 ? Math.round((totalGaActual / totalGaTarget) * 100) : 0;

  const getAchievementColor = (pct: number) => {
    if (pct >= 100) return tc.success;
    if (pct >= 75) return '#22c55e'; // green-ish
    if (pct >= 50) return tc.warning;
    return tc.danger;
  };

  const formatTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
        <div className="rounded-3xl p-10 max-w-lg w-full text-center" style={{ backgroundColor: tc.bgCard, boxShadow: `0 25px 50px ${tc.shadowColor}` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: `linear-gradient(135deg, ${tc.primaryGradientFrom}, ${tc.primaryGradientTo})` }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: tc.textOnPrimary }} />
          </div>
          <p className="font-semibold text-base" style={{ color: tc.textPrimary }}>Loading check-in session...</p>
          <p className="text-xs mt-1" style={{ color: tc.textMuted }}>Preparing your workspace</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
        <div className="rounded-3xl p-10 max-w-lg w-full text-center" style={{ backgroundColor: tc.bgCard, boxShadow: `0 25px 50px ${tc.shadowColor}` }}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: tc.danger }} />
          <p className="font-semibold mb-5" style={{ color: tc.danger }}>{error || 'Failed to load session'}</p>
          <button onClick={onClose} className="px-8 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95" style={{ backgroundColor: tc.bgSubtle, color: tc.textSecondary }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl max-h-[95vh] flex flex-col overflow-hidden" style={{ backgroundColor: tc.bgCard, boxShadow: `0 25px 60px ${tc.shadowColor}` }}>
        {/* Header */}
        <div data-tour="program-header" className="px-5 py-4 flex items-center justify-between relative overflow-hidden" style={{ background: isReadOnly ? tc.bgSubtle : `linear-gradient(135deg, ${tc.primaryGradientFrom}, ${tc.primaryGradientTo})`, borderBottom: `1px solid ${isReadOnly ? tc.border : 'transparent'}` }}>
          {!isReadOnly && (
            <>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'white', transform: 'translate(30%,-40%)', filter: 'blur(20px)' }} />
              <div className="absolute bottom-0 left-10 w-20 h-20 rounded-full opacity-5" style={{ background: 'white', filter: 'blur(15px)' }} />
            </>
          )}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shadow-sm" style={{ backgroundColor: isReadOnly ? tc.border : 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
              {isReadOnly ? <Lock className="w-5 h-5" style={{ color: tc.textMuted }} /> : '📋'}
            </div>
            <div>
              <h2 className="font-bold text-[15px] tracking-tight" style={{ color: isReadOnly ? tc.textPrimary : tc.textOnPrimary }}>{program.title}</h2>
              <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: isReadOnly ? tc.textMuted : 'rgba(255,255,255,0.75)' }}>
                <Clock className="w-3 h-3" />
                <span>Opened {formatDate(session.opened_at)} at {formatTime(session.opened_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style={{ backgroundColor: isReadOnly ? tc.bgSubtle : 'rgba(255,255,255,0.2)', color: isReadOnly ? tc.textMuted : tc.textOnPrimary, border: isReadOnly ? `1px solid ${tc.border}` : '1px solid rgba(255,255,255,0.3)' }}>
              {isReadOnly ? 'CLOSED' : 'OPEN'}
            </span>
            {saving && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: isReadOnly ? tc.textMuted : 'rgba(255,255,255,0.7)' }}>
                <Save className="w-3 h-3 animate-pulse" /> Saving...
              </span>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95" style={{ backgroundColor: isReadOnly ? tc.bgSubtle : 'rgba(255,255,255,0.15)' }}>
              <X className="w-4 h-4" style={{ color: isReadOnly ? tc.textMuted : tc.textOnPrimary }} />
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-5 py-2.5 flex items-center gap-2" style={{ backgroundColor: tc.dangerLight, borderBottom: `1px solid ${tc.danger}20` }}>
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: tc.danger }} />
            <p className="text-sm flex-1" style={{ color: tc.danger }}>{error}</p>
            <button onClick={() => setError('')} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" style={{ color: tc.danger }} /></button>
          </div>
        )}

        {/* Summary Bar */}
        <div data-tour="program-stats" className="px-5 py-3 grid grid-cols-5 gap-2 text-center" style={{ backgroundColor: tc.bgSubtle, borderBottom: `1px solid ${tc.border}` }}>
          <div className="rounded-2xl py-2" style={{ backgroundColor: tc.bgCard, boxShadow: `0 1px 3px ${tc.shadowColor}` }}>
            <p className="text-xl font-black tabular-nums" style={{ color: tc.primary }}>{sites.length}</p>
            <p className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: tc.textMuted }}>Sites</p>
          </div>
          <div className="rounded-2xl py-2" style={{ backgroundColor: tc.bgCard, boxShadow: `0 1px 3px ${tc.shadowColor}` }}>
            <p className="text-xl font-black tabular-nums" style={{ color: tc.info }}>{totalPromoters}</p>
            <p className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: tc.textMuted }}>MSISDNs</p>
          </div>
          <div className="rounded-2xl py-2" style={{ backgroundColor: tc.bgCard, boxShadow: `0 1px 3px ${tc.shadowColor}` }}>
            <p className="text-xl font-black tabular-nums" style={{ color: tc.warning }}>{totalGaTarget || '-'}</p>
            <p className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: tc.textMuted }}>Target</p>
          </div>
          <div className="rounded-2xl py-2" style={{ backgroundColor: tc.bgCard, boxShadow: `0 1px 3px ${tc.shadowColor}` }}>
            <p className="text-xl font-black tabular-nums" style={{ color: tc.success }}>{totalGaActual}</p>
            <p className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: tc.textMuted }}>GAs Done</p>
          </div>
          <div className="rounded-2xl py-2" style={{ backgroundColor: tc.bgCard, boxShadow: `0 1px 3px ${tc.shadowColor}` }}>
            <p className="text-xl font-black tabular-nums" style={{ color: (isCheckoutMode || isAfter6PM || isReadOnly) && totalGaTarget > 0 ? getAchievementColor(overallAchievement) : tc.textMuted }}>
              {(isCheckoutMode || isAfter6PM || isReadOnly) && totalGaTarget > 0 ? `${overallAchievement}%` : '-'}
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-widest mt-0.5" style={{ color: tc.textMuted }}>Achieved</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ backgroundColor: tc.bgPage }}>
          {/* 🚐 VAN NUMBER PLATE SECTION */}
          {!isCheckoutMode && (
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: tc.bgCard, border: `1px solid ${tc.border}`, boxShadow: `0 1px 3px ${tc.shadowColor}` }}>
              <div className="px-4 py-3" style={{ backgroundColor: tc.bgSubtle }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ede9fe' }}>
                      <span className="text-sm">🚐</span>
                    </div>
                    <div>
                      <span className="font-bold text-sm" style={{ color: tc.textPrimary }}>Van Number Plate</span>
                      {vanRegistered && numberPlate && (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
                          ✅ {numberPlate}
                        </span>
                      )}
                    </div>
                  </div>
                  {!isReadOnly && !vanRegistered && (
                    <button
                      onClick={() => setShowVanInput(!showVanInput)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                      style={{ backgroundColor: tc.primaryLight, color: tc.primary }}
                    >
                      {showVanInput ? 'Cancel' : '+ Add Van'}
                    </button>
                  )}
                  {!isReadOnly && vanRegistered && (
                    <button
                      onClick={() => { setVanRegistered(false); setNumberPlate(''); setShowVanInput(true); }}
                      className="text-[11px] font-medium px-2 py-1 rounded-lg transition-all"
                      style={{ color: tc.textMuted }}
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>
              {showVanInput && !isReadOnly && (
                <div className="px-4 py-3 flex gap-2" style={{ borderTop: `1px solid ${tc.border}` }}>
                  <input
                    type="text"
                    value={numberPlate}
                    onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
                    placeholder="e.g. KAA 123B"
                    className="flex-1 px-3 py-2 text-sm font-mono font-bold rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: tc.bgSubtle,
                      border: `1px solid ${tc.border}`,
                      color: tc.textPrimary,
                      focusRingColor: tc.primary,
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => registerVan(numberPlate)}
                    disabled={!numberPlate.trim() || vanRegistering}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${tc.primaryGradientFrom}, ${tc.primaryGradientTo})` }}
                  >
                    {vanRegistering ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Register'
                    )}
                  </button>
                </div>
              )}
              {!vanRegistered && !showVanInput && !isReadOnly && (
                <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${tc.border}` }}>
                  <p className="text-[11px]" style={{ color: tc.textMuted }}>
                    Register your van's number plate so the checkout form can verify your check-in.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SITES SECTION */}
          <div data-tour="program-fields" className="rounded-2xl overflow-hidden" style={{ backgroundColor: tc.bgCard, border: `1px solid ${tc.border}`, boxShadow: `0 1px 3px ${tc.shadowColor}` }}>
            <button onClick={() => setSitesExpanded(!sitesExpanded)} className="w-full flex items-center justify-between px-4 py-3 transition-colors" style={{ backgroundColor: tc.bgSubtle }}>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: tc.primaryLight }}>
                  <MapPin className="w-3.5 h-3.5" style={{ color: tc.primary }} />
                </div>
                <span className="font-bold text-sm" style={{ color: tc.textPrimary }}>Sites ({sites.length})</span>
                {totalPromoters > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: tc.infoLight, color: tc.info }}>
                    {totalPromoters} MSISDNs
                  </span>
                )}
              </div>
              {sitesExpanded ? <ChevronUp className="w-4 h-4" style={{ color: tc.textMuted }} /> : <ChevronDown className="w-4 h-4" style={{ color: tc.textMuted }} />}
            </button>
            {sitesExpanded && (
              <div className="p-3 space-y-2">
                {sites.length === 0 && <p className="text-sm text-center py-5" style={{ color: tc.textMuted }}>No sites added yet</p>}

                {sites.map((site, idx) => {
                  const isSiteExpanded = expandedSiteIds.has(site.id);
                  const sitePromoterCount = site.promoters.length;
                  const siteGaDone = isCheckoutMode
                    ? site.promoters.reduce((sum, p) => sum + (p.ga_done || 0), 0)
                    : (site.ga_actual || 0);
                  const siteAchievement = site.ga_target && site.ga_target > 0
                    ? Math.round((siteGaDone / site.ga_target) * 100) : null;

                  return (
                    <div key={site.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: tc.bgSubtle, border: `1px solid ${tc.border}` }}>
                      {/* Site Header Row */}
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <span className="w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: tc.primaryLight, color: tc.primary }}>{idx + 1}</span>
                        <button
                          onClick={() => toggleSiteExpanded(site.id)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="text-sm font-semibold truncate" style={{ color: tc.textPrimary }}>{site.name}</p>
                          <div className="flex items-center gap-2 text-[11px] mt-0.5" style={{ color: tc.textMuted }}>
                            <span>{formatTime(site.added_at)}</span>
                            {site.gps && <span className="flex items-center gap-0.5" style={{ color: tc.success }}><MapPin className="w-3 h-3" /> GPS</span>}
                            <span className="flex items-center gap-0.5" style={{ color: sitePromoterCount > 0 ? tc.info : tc.textMuted }}>
                              <Phone className="w-3 h-3" /> {sitePromoterCount}
                            </span>
                          </div>
                        </button>
                        {/* GA Target Input */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Target className="w-3.5 h-3.5" style={{ color: tc.warning }} />
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="TGT"
                            value={site.ga_target ? site.ga_target : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '');
                              handleGATargetChange(site.id, val === '' ? 0 : parseInt(val, 10));
                            }}
                            disabled={isReadOnly || isAfter6PM}
                            className="w-12 text-center text-xs font-bold px-1 py-1 rounded-lg focus:outline-none focus:ring-2 tabular-nums"
                            style={{
                              backgroundColor: (isReadOnly || isAfter6PM) ? tc.bgSubtle : tc.bgCard,
                              border: `1.5px solid ${site.ga_target ? tc.warning : tc.border}`,
                              color: site.ga_target ? tc.warning : tc.textMuted,
                            }}
                          />
                        </div>
                        {/* In checkout mode, show per-site GA sum badge instead of input */}
                        {isCheckoutMode && siteGaDone > 0 && (
                          <span className="text-xs font-black px-2 py-1 rounded-lg tabular-nums shrink-0" style={{ backgroundColor: `${tc.success}15`, color: tc.success }}>
                            {siteGaDone} GAs
                          </span>
                        )}
                        {/* GA Actual Input — only after 6 PM (non-checkout mode) */}
                        {!isCheckoutMode && (isAfter6PM || isReadOnly) && (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <TrendingUp className="w-3.5 h-3.5" style={{ color: tc.success }} />
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="GAs"
                              value={site.ga_actual ? site.ga_actual : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                handleGAActualChange(site.id, val === '' ? 0 : parseInt(val, 10));
                              }}
                              disabled={isReadOnly}
                              className="w-12 text-center text-xs font-bold px-1 py-1 rounded-lg focus:outline-none focus:ring-2 tabular-nums"
                              style={{
                                backgroundColor: isReadOnly ? tc.bgSubtle : tc.bgCard,
                                border: `1.5px solid ${site.ga_actual ? tc.success : tc.border}`,
                                color: site.ga_actual ? tc.success : tc.textMuted,
                              }}
                            />
                          </div>
                        )}
                        {/* Per-site achievement badge */}
                        {(isCheckoutMode || isAfter6PM || isReadOnly) && siteAchievement !== null && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md tabular-nums shrink-0" style={{
                            backgroundColor: `${getAchievementColor(siteAchievement)}15`,
                            color: getAchievementColor(siteAchievement),
                          }}>
                            {siteAchievement}%
                          </span>
                        )}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => toggleSiteExpanded(site.id)}
                            className="p-1 rounded-lg transition-all"
                            style={{ color: tc.textMuted }}
                          >
                            {isSiteExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {canAddContent && (
                            <button onClick={() => handleRemoveSite(site.id)} className="p-1 rounded-lg transition-all hover:scale-110 active:scale-95" style={{ color: tc.danger }}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded: Per-Site MSISDN List */}
                      {isSiteExpanded && (
                        <div className="px-3 pb-3 pt-1" style={{ borderTop: `1px solid ${tc.border}` }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Phone className="w-3 h-3" style={{ color: tc.info }} />
                            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: tc.textMuted }}>
                              Promoter MSISDNs ({sitePromoterCount})
                            </span>
                            {isAfter6PM && !isReadOnly && (
                              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1" style={{ backgroundColor: `${tc.danger}15`, color: tc.danger }}>
                                <Lock className="w-3 h-3" /> Locked
                              </span>
                            )}
                          </div>

                          {sitePromoterCount === 0 && (
                            <p className="text-xs text-center py-3" style={{ color: tc.textMuted }}>No MSISDNs added to this site</p>
                          )}

                          {sitePromoterCount > 0 && (
                            <div className="space-y-1">
                              {/* Column header for checkout mode */}
                              {isCheckoutMode && sitePromoterCount > 0 && (
                                <div className="flex items-center gap-2 px-2 py-1">
                                  <span className="w-5 shrink-0" />
                                  <span className="flex-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: tc.textMuted }}>MSISDN</span>
                                  <span className="w-16 text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: tc.success }}>GA</span>
                                  {canAddContent && <span className="w-7" />}
                                </div>
                              )}
                              {site.promoters.map((promoter, pIdx) => (
                                <div key={promoter.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5" style={{ backgroundColor: tc.bgCard }}>
                                  <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0" style={{ backgroundColor: promoter.from_checkin ? '#7c3aed15' : tc.infoLight, color: promoter.from_checkin ? '#7c3aed' : tc.info }}>{pIdx + 1}</span>
                                  <span className="flex-1 text-sm font-mono tracking-wide" style={{ color: tc.textPrimary }}>
                                    {promoter.msisdn}
                                    {promoter.from_checkin && (
                                      <span className="ml-1 text-[9px] font-semibold px-1 py-0.5 rounded" style={{ backgroundColor: '#7c3aed10', color: '#7c3aed' }}>CI</span>
                                    )}
                                  </span>
                                  {/* GA Done input — always visible in checkout mode */}
                                  {isCheckoutMode && (
                                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="0"
                                        value={promoter.ga_done ? promoter.ga_done : ''}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/[^0-9]/g, '');
                                          handlePromoterGAChange(site.id, promoter.id, val === '' ? 0 : parseInt(val, 10));
                                        }}
                                        disabled={isReadOnly}
                                        className="w-16 text-center text-xs font-bold px-1 py-1.5 rounded-lg focus:outline-none focus:ring-2 tabular-nums"
                                        style={{
                                          backgroundColor: isReadOnly ? tc.bgSubtle : tc.bgPage,
                                          border: `1.5px solid ${promoter.ga_done ? tc.success : tc.border}`,
                                          color: promoter.ga_done ? tc.success : tc.textMuted,
                                        }}
                                      />
                                    </div>
                                  )}
                                  {canAddContent && (
                                    <button onClick={() => handleRemovePromoter(site.id, promoter.id)} className="p-1 rounded transition-all hover:scale-110 active:scale-95" style={{ color: tc.danger }}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add MSISDN Input — only before 6 PM */}
                          {canAddContent && (
                            <div className="mt-2">
                              {activeMsisdnSiteId === site.id ? (
                                <div>
                                  <div className="flex gap-2">
                                    <input
                                      type="tel"
                                      inputMode="numeric"
                                      placeholder="e.g. 0712345678"
                                      value={newMsisdn}
                                      onChange={(e) => { setNewMsisdn(e.target.value); setMsisdnError(''); }}
                                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPromoter(site.id); } }}
                                      autoFocus
                                      className="flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                                      style={{ backgroundColor: tc.bgCard, border: `1px solid ${msisdnError ? tc.danger : tc.border}`, color: tc.textPrimary }}
                                    />
                                    <button
                                      onClick={() => handleAddPromoter(site.id)}
                                      disabled={!newMsisdn.trim()}
                                      className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-40"
                                      style={{ background: newMsisdn.trim() ? `linear-gradient(135deg, ${tc.info}, ${tc.primary})` : tc.bgSubtle, color: newMsisdn.trim() ? tc.textOnPrimary : tc.textMuted }}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                  {msisdnError && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: tc.danger }}><AlertCircle className="w-3 h-3" /> {msisdnError}</p>}
                                  <button onClick={() => { setActiveMsisdnSiteId(null); setNewMsisdn(''); setMsisdnError(''); }} className="text-xs mt-1.5 font-medium" style={{ color: tc.textMuted }}>Cancel</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setActiveMsisdnSiteId(site.id); setNewMsisdn(''); setMsisdnError(''); }}
                                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all active:scale-[0.98]"
                                  style={{ backgroundColor: tc.infoLight, color: tc.info, border: `1.5px dashed ${tc.info}40` }}
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add MSISDN
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Site Button — only before 6 PM */}
                {canAddContent && (
                  <>
                    {showSiteSelector ? (
                      <div className="rounded-xl p-3" style={{ backgroundColor: tc.primaryLight, border: `1px solid ${tc.primary}30` }}>
                        <label className="block text-xs font-bold mb-1.5" style={{ color: tc.textSecondary }}>Search for a site</label>
                        <input type="text" placeholder="Type site name (min 2 chars)..." value={siteSearchQuery} onChange={(e) => handleSiteSearchChange(e.target.value)} autoFocus className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2" style={{ backgroundColor: tc.bgCard, border: `1px solid ${tc.border}`, color: tc.textPrimary }} />
                        {searchingSites && <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: tc.textMuted }}><Loader2 className="w-3 h-3 animate-spin" /> Searching...</div>}
                        {siteSearchResults.length > 0 && (
                          <div className="mt-2 max-h-40 overflow-y-auto rounded-xl" style={{ backgroundColor: tc.bgCard, border: `1px solid ${tc.border}` }}>
                            {siteSearchResults.map((siteRow, i) => {
                              const displayName = getSiteDisplayName(siteRow);
                              const alreadyAdded = sites.some(s => s.name === displayName);
                              return (
                                <button key={i} disabled={alreadyAdded} onClick={() => handleAddSite(displayName, siteRow)} className="w-full text-left px-3 py-2.5 text-sm" style={{ borderBottom: `1px solid ${tc.borderLight}`, color: alreadyAdded ? tc.textMuted : tc.textPrimary, cursor: alreadyAdded ? 'not-allowed' : 'pointer', opacity: alreadyAdded ? 0.5 : 1 }}>
                                  <span className="font-medium">{displayName}</span>
                                  {alreadyAdded && <span className="ml-2 text-xs" style={{ color: tc.textMuted }}>(already added)</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {siteSearchQuery.length >= 2 && !searchingSites && siteSearchResults.length === 0 && <p className="mt-2 text-xs" style={{ color: tc.textMuted }}>No sites found matching "{siteSearchQuery}"</p>}
                        <button onClick={() => { setShowSiteSelector(false); setSiteSearchQuery(''); setSiteSearchResults([]); }} className="mt-2 text-xs font-medium" style={{ color: tc.textMuted }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowSiteSelector(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]" style={{ backgroundColor: tc.primaryLight, color: tc.primary, border: `2px dashed ${tc.primary}40` }}>
                        <Plus className="w-4 h-4" /> Add Site
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* CHECKOUT MODE BANNER */}
          {isCheckoutMode && !isReadOnly && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: '#7c3aed10', border: '1px solid #7c3aed30' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#7c3aed20' }}>
                <TrendingUp className="w-4 h-4" style={{ color: '#7c3aed' }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: tc.textPrimary }}>
                  {checkinDataLoaded ? 'Check-in MSISDNs loaded' : 'Checkout Mode'}
                </p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: tc.textSecondary }}>
                  {checkinDataMessage || 'Enter GAs done next to each MSISDN. You can also add new numbers.'}
                </p>
              </div>
            </div>
          )}

          {/* 6 PM NOTICE — before 6 PM (only in non-checkout mode) */}
          {!isCheckoutMode && !isAfter6PM && !isReadOnly && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: tc.warningLight, border: `1px solid ${tc.warning}30` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${tc.warning}20` }}>
                <Clock className="w-4 h-4" style={{ color: tc.warning }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: tc.textPrimary }}>GA entry available after 6:00 PM EAT</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: tc.textSecondary }}>Continue adding sites and MSISDNs throughout the day. After 6 PM, sites &amp; MSISDNs lock and the "GAs Done" column goes live.</p>
              </div>
            </div>
          )}

          {/* AFTER 6 PM NOTICE — content locked (only in non-checkout mode) */}
          {!isCheckoutMode && isAfter6PM && !isReadOnly && (
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: `${tc.success}10`, border: `1px solid ${tc.success}30` }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${tc.success}20` }}>
                <TrendingUp className="w-4 h-4" style={{ color: tc.success }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: tc.textPrimary }}>Enter your GAs achieved per site</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: tc.textSecondary }}>Sites and MSISDNs are now locked. Enter the GAs you achieved at each site, then close the session when done.</p>
              </div>
            </div>
          )}

          {/* TOTAL GAs + ACHIEVEMENT DISPLAY */}
          {(isCheckoutMode || isAfter6PM || isReadOnly) && sites.length > 0 && totalGaActual > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${tc.success}30` }}>
              <div className="p-5 text-center" style={{ backgroundColor: `${tc.success}10` }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: tc.success }}>Total GAs Achieved</p>
                <p className="text-4xl font-black mt-1 tabular-nums" style={{ color: tc.success }}>{totalGaActual}</p>
                {totalGaTarget > 0 && (
                  <div className="mt-2">
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${tc.border}` }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{
                        width: `${Math.min(overallAchievement, 100)}%`,
                        backgroundColor: getAchievementColor(overallAchievement),
                      }} />
                    </div>
                    <p className="text-lg font-black mt-1.5 tabular-nums" style={{ color: getAchievementColor(overallAchievement) }}>
                      {overallAchievement}% <span className="text-xs font-semibold" style={{ color: tc.textMuted }}>of {totalGaTarget} target</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMMENTS / NOTES SECTION */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: tc.bgCard, border: `1px solid ${tc.border}`, boxShadow: `0 1px 3px ${tc.shadowColor}` }}>
            <button
              onClick={() => setCommentsExpanded(!commentsExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors"
              style={{ backgroundColor: tc.bgSubtle }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${tc.warning}15` }}>
                  <MessageSquare className="w-3.5 h-3.5" style={{ color: tc.warning }} />
                </div>
                <span className="font-bold text-sm" style={{ color: tc.textPrimary }}>Comments / Notes</span>
                {session.comments && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${tc.warning}15`, color: tc.warning }}>
                    Has notes
                  </span>
                )}
              </div>
              {commentsExpanded ? <ChevronUp className="w-4 h-4" style={{ color: tc.textMuted }} /> : <ChevronDown className="w-4 h-4" style={{ color: tc.textMuted }} />}
            </button>
            {commentsExpanded && (
              <div className="p-3">
                <textarea
                  placeholder={isReadOnly ? 'No comments added' : 'Add any comments, issues, or notes about this session...'}
                  value={session.comments || ''}
                  onChange={(e) => {
                    if (isReadOnly) return;
                    const updated = { ...session, comments: e.target.value };
                    setSession(updated);
                    // Debounce comment saves with a longer delay (1s) to avoid too many saves while typing
                    if (commentTimerRef.current) clearTimeout(commentTimerRef.current);
                    commentTimerRef.current = setTimeout(() => debouncedSave(updated), 500);
                  }}
                  disabled={isReadOnly}
                  rows={3}
                  className="w-full px-3.5 py-3 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 resize-none"
                  style={{
                    backgroundColor: isReadOnly ? tc.bgSubtle : tc.bgPage,
                    border: `1.5px solid ${session.comments ? tc.warning + '40' : tc.border}`,
                    color: tc.textPrimary,
                    opacity: isReadOnly && !session.comments ? 0.5 : 1,
                  }}
                />
                <p className="text-[10px] mt-1.5 flex items-center gap-1" style={{ color: tc.textMuted }}>
                  <AlertCircle className="w-3 h-3" />
                  {isReadOnly
                    ? 'Comments are locked after session close'
                    : 'Report issues, site problems, or anything noteworthy. Auto-saved.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div data-tour="program-submit" className="px-5 py-4 space-y-2.5" style={{ backgroundColor: tc.bgSubtle, borderTop: `1px solid ${tc.border}` }}>
          {!isReadOnly && (
            <>
              {canClose && (
                <button onClick={handleCloseSession} disabled={closing || sites.length === 0 || totalPromoters === 0} className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2" style={{ background: !(closing || sites.length === 0 || totalPromoters === 0) ? `linear-gradient(135deg, ${tc.primaryGradientFrom}, ${tc.primaryGradientTo})` : tc.bgSubtle, color: !(closing || sites.length === 0 || totalPromoters === 0) ? tc.textOnPrimary : tc.textMuted, boxShadow: !(closing || sites.length === 0 || totalPromoters === 0) ? `0 4px 14px ${tc.primary}40` : 'none' }}>
                  {closing ? <><Loader2 className="w-4 h-4 animate-spin" /> Closing Session...</> : <><CheckCircle className="w-5 h-5" /> Close Session & Submit</>}
                </button>
              )}
              <button onClick={handleSaveAndContinueLater} disabled={savingAndClosing} className="w-full py-3 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2" style={{ backgroundColor: tc.bgCard, color: tc.info, border: `1.5px solid ${tc.info}40`, boxShadow: `0 1px 3px ${tc.shadowColor}` }}>
                {savingAndClosing ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Pause className="w-4 h-4" /> Save & Continue Later</>}
              </button>
              <button onClick={onClose} className="w-full py-2.5 rounded-2xl font-medium text-sm transition-all flex items-center justify-center gap-1.5" style={{ color: tc.textMuted }}>
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Programs
              </button>
            </>
          )}
          {isReadOnly && (
            <>
              <div className="text-center py-2">
                <p className="text-sm flex items-center justify-center gap-1.5" style={{ color: tc.textMuted }}><Lock className="w-4 h-4" /> Session closed {session.closed_at ? `at ${formatTime(session.closed_at)}` : ''}</p>
              </div>
              <button onClick={onClose} className="w-full py-3 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]" style={{ backgroundColor: tc.bgCard, color: tc.textPrimary, border: `1px solid ${tc.border}` }}>Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}