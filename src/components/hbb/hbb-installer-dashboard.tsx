// HBB Installer Dashboard — Mobile-first view for field installers
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, ClipboardList, Clock, User, LogOut, RefreshCw, Wifi, MapPin, Phone, Calendar, CheckCircle, XCircle, AlertTriangle, ChevronRight, Navigation, MessageCircle, Award, TrendingUp, Shield, Zap, Star, Copy, Lock, Bell, Camera, Upload, Navigation2 } from 'lucide-react';
import { getServiceRequests, updateServiceRequestStatus, getInstallerByPhone, generateWhatsAppLink, changePin } from './hbb-api';
import { NotificationBell } from './hbb-notifications';
import { toast } from 'sonner';
import { supabase } from '../../utils/supabase/client';
import { useLiveLocation } from '../../hooks/useLiveLocation';
import { RejectDialog } from './hbb-reject-dialog';
import { InstallerCalendar } from './hbb-installer-calendar';
import { recordRejectionAndReassign } from './hbb-auto-assign';
import { InstallerLocationSender } from '../InstallerLocationSender';
import { HBBInstallerGADashboard } from './hbb-installer-ga-dashboard';

const ACCENT = '#E60000';
const ACCENT_DARK = '#CC0000';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  assigned: { label: 'Assigned', color: '#F59E0B', bg: '#FFFBEB', icon: ClipboardList },
  completed: { label: 'Completed', color: '#10B981', bg: '#ECFDF5', icon: CheckCircle },
  failed: { label: 'Failed', color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
  rescheduled: { label: 'Rescheduled', color: '#8B5CF6', bg: '#F5F3FF', icon: Clock },
  unreachable: { label: 'Unreachable', color: '#6B7280', bg: '#F3F4F6', icon: AlertTriangle },
  not_ready: { label: 'Not Ready', color: '#D97706', bg: '#FFF7ED', icon: AlertTriangle },
};

interface Props {
  user: any;
  userData: any;
  onLogout: () => void;
}

export const HBBInstallerDashboard = React.memo(function HBBInstallerDashboard({ user, userData, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState('home');
  const [installer, setInstaller] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ── Immediate-dispatch (jobs table) ─────────────────────────────────────
  const [inHouseInstallerId, setInHouseInstallerId] = useState<string | null>(null);
  const [newJobs, setNewJobs] = useState<any[]>([]);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // ── Accept / Reject dialog state ─────────────────────────────────────────
  // acceptedJobs: jobs the installer confirmed but hasn't pressed "En Route" yet
  const [acceptedJobs, setAcceptedJobs] = useState<Set<string>>(new Set());
  const [rejectDialogJob, setRejectDialogJob] = useState<any | null>(null);

  // Stream GPS while an immediate job is active
  useLiveLocation({
    jobId: activeJob ? String(activeJob.id) : null,
    installerId: inHouseInstallerId,
    active: isTracking,
  });

  const userName = userData?.full_name || user?.full_name || 'Installer';
  const userPhone = String(userData?.phone_number || user?.phone_number || '');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // If user came from HBB login via installers table, we already have the installer ID
      const hbbInstallerId = (userData?.source_table === 'installers_HBB' || userData?.source_table === 'installers') ? userData.id : null;
      
      let inst: any = null;
      if (hbbInstallerId) {
        // Direct lookup — no phone matching needed
        const result = await getServiceRequests({ installer_id: hbbInstallerId, limit: 1 });
        // Use installer data from our direct lookup (already set in installer state)
        inst = installer;
        if (!inst) {
          // Construct minimal installer object from login data
          inst = { id: hbbInstallerId, name: userName, phone: userPhone, town: userData.town, status: userData.status, max_jobs_per_day: userData.max_jobs_per_day };
        }
      } else {
        // Use installer data from our direct lookup (already set in installer state)
        inst = installer;
      }
      
      setInstaller(inst);

      if (inst) {
        const result = await getServiceRequests({ installer_id: inst.id, limit: 100 });
        setJobs(result.data);
      }
    } catch (e) {
      console.error('[HBB Installer] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [installer, userPhone, userData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Find this installer in the unified installers table by phone
  useEffect(() => {
    if (!userPhone) return;
    const base9 = userPhone.replace(/[\s\-\(\)\+]/g, '').replace(/^0/, '').replace(/^254/, '');
    const phoneVariants = ['0' + base9, '254' + base9, '+254' + base9, base9];

    const lookupInstaller = async () => {
      try {
        const { data } = await supabase
          .from('installers')
          .select('id, name, phone, town, status, max_jobs_per_day')
          .in('phone', phoneVariants)
          .limit(1);

        const inst = data?.[0];
        if (inst) {
          console.log('[Installer] Found:', inst.name);
          setInHouseInstallerId(String(inst.id));
          setInstaller({ id: inst.id, name: inst.name || 'Installer', phone: inst.phone || userPhone });
        } else {
          console.log('[Installer] Not found for phone:', userPhone);
        }
      } catch (err: unknown) {
        console.error('[Installer] Lookup failed:', err);
      }
    };

    void lookupInstaller();
  }, [userPhone]);

  // Subscribe to immediate-dispatch jobs via Realtime
  useEffect(() => {
    if (!inHouseInstallerId) return;

    const refresh = async () => {
      const { data: pending } = await supabase
        .from('jobs').select('*')
        .eq('installer_id', inHouseInstallerId).eq('status', 'assigned')
        .order('assigned_at', { ascending: false });
      setNewJobs(pending || []);

      const { data: active } = await supabase
        .from('jobs').select('*')
        .eq('installer_id', inHouseInstallerId)
        .in('status', ['on_way', 'arrived'])
        .order('assigned_at', { ascending: false }).limit(1);
      if (active?.[0]) { setActiveJob(active[0]); setIsTracking(true); }
    };
    refresh();

    const ch = supabase.channel(`new-jobs-${inHouseInstallerId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs', filter: `installer_id=eq.${inHouseInstallerId}` }, (payload: { new: any }) => {
        const job = (payload as { new: any }).new as any;
        if (job?.status === 'assigned') {
          setNewJobs(prev => prev.some(j => j.id === job.id) ? prev.map(j => j.id === job.id ? job : j) : [job, ...prev]);
        } else {
          setNewJobs(prev => prev.filter(j => j.id !== job?.id));
          if (job && ['on_way', 'arrived'].includes(job.status)) { setActiveJob(job); setIsTracking(true); }
          else if (job && ['completed', 'cancelled'].includes(job.status)) {
            setActiveJob((prev: any | null) => (prev?.id === job.id ? null : prev));
            setIsTracking(false);
          }
        }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [inHouseInstallerId]);

  // Step 1: Accept = mark locally confirmed (no DB change yet)
  const handleAcceptJob = async (job: any) => {
    setAcceptedJobs(prev => new Set(prev).add(job.id));
    toast.success('Job accepted — press "En Route" when you start moving');
  };

  // Step 2: En Route = DB update + GPS tracking starts
  const handleEnRoute = async (job: any) => {
    try {
      const { error } = await supabase.from('jobs')
        .update({ status: 'on_way', on_way_at: new Date().toISOString() }).eq('id', job.id);
      if (error) throw error;
      await supabase.from('installers')
        .update({ is_available: false, current_job_id: job.id }).eq('id', Number(inHouseInstallerId));
      setActiveJob({ ...job, status: 'on_way' });
      setNewJobs(prev => prev.filter(j => j.id !== job.id));
      setAcceptedJobs(prev => { const s = new Set(prev); s.delete(job.id); return s; });
      setIsTracking(true);
      toast.success('En Route — live location sharing started!');
    } catch (err: any) { toast.error(err.message || 'Failed to update status'); }
  };

  // Show rejection dialog
  const handleRejectJob = async (job: any) => {
    setRejectDialogJob(job);
  };

  // Confirmed rejection with reason → smart re-assign
  const handleConfirmReject = async (reason: string) => {
    const job = rejectDialogJob;
    if (!job || !inHouseInstallerId) return;
    setRejectDialogJob(null);
    setAcceptedJobs(prev => { const s = new Set(prev); s.delete(job.id); return s; });
    setNewJobs(prev => prev.filter(j => j.id !== job.id));

    try {
      const result = await recordRejectionAndReassign(
        { id: job.id, remarks: job.remarks, town: job.town, estate_name: job.estate_name || job.estate },
        Number(inHouseInstallerId),
        userName,
        reason
      );
      if (result.escalated) {
        toast.success('Job declined and escalated to manager');
      } else if (result.success) {
        toast.success(`Job declined and reassigned to ${result.installerName}`);
      } else {
        toast.success('Job declined — system will find another installer');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process rejection');
    }
  };

  const handleActiveJobUpdate = async (status: 'arrived' | 'completed') => {
    if (!activeJob) return;
    if (status === 'completed') { setShowCompletionModal(true); return; }
    try {
      const { error } = await supabase.from('jobs')
        .update({ status, arrived_at: new Date().toISOString() }).eq('id', activeJob.id);
      if (error) throw error;
      setActiveJob((prev: any) => ({ ...prev, status }));
      toast.success('Marked as Arrived');
    } catch (err: any) { toast.error(err.message || 'Update failed'); }
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string, remarks?: string, location?: { lat: number; lng: number; accuracy?: number }) => {
    try {
      await updateServiceRequestStatus(jobId, newStatus, remarks, location);
      toast.success(`Job updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      setSelectedJob(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const assignedJobs = useMemo(() => jobs.filter(j => j.status === 'assigned'), [jobs]);
  const completedJobs = useMemo(() => jobs.filter(j => j.status === 'completed'), [jobs]);
  const todayJobs = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return jobs.filter(j => j.scheduled_date === today || j.assigned_at?.startsWith(today));
  }, [jobs]);

  const tabs = [
    { id: 'home',     label: 'Home',     icon: Home },
    { id: 'requests', label: 'Requests', icon: Bell },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'history',  label: 'History',  icon: Clock },
    { id: 'ga',       label: 'GA',       icon: TrendingUp },
    { id: 'profile',  label: 'Profile',  icon: User },
  ];

  const renderContent = () => {
    // Job detail modal
    if (selectedJob) {
      return (
        <JobDetailView
          job={selectedJob}
          onBack={() => setSelectedJob(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      );
    }

    switch (activeTab) {
      case 'requests':
        return (
          <NewRequestsTab
            newJobs={newJobs}
            activeJob={activeJob}
            acceptedJobs={acceptedJobs}
            onAccept={handleAcceptJob}
            onEnRoute={handleEnRoute}
            onReject={handleRejectJob}
            onActiveJobUpdate={handleActiveJobUpdate}
            loading={loading}
          />
        );
      case 'ga':
        return <HBBInstallerGADashboard userPhone={userPhone} userName={installer?.name || userName} />;
      case 'calendar':
        return (
          <InstallerCalendar
            installerId={installer?.id ? String(installer.id) : ''}
            installerIdDirect={inHouseInstallerId || undefined}
          />
        );
      case 'history':
        return (
          <JobsList
            jobs={jobs.filter(j => j.status !== 'assigned')}
            title="Job History"
            emptyMessage="No completed jobs yet"
            onSelectJob={setSelectedJob}
            loading={loading}
          />
        );
      case 'profile':
        return <InstallerProfile user={userData || user} installer={installer} stats={{ total: jobs.length, completed: completedJobs.length, assigned: assignedJobs.length }} jobs={jobs} onLogout={onLogout} />;
      default:
        return (
          <InstallerHome
            userName={userName}
            installerName={installer?.name || userName}
            assignedCount={assignedJobs.length}
            todayCount={todayJobs.length}
            completedCount={completedJobs.length}
            totalCount={jobs.length}
            todayJobs={todayJobs.length > 0 ? todayJobs : assignedJobs.slice(0, 3)}
            loading={loading}
            onRefresh={fetchData}
            onSelectJob={setSelectedJob}
            onViewAll={() => setActiveTab('jobs')}
          />
        );
    }
  };

  return (
    <div
      data-testid="hbb-installer-dashboard"
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%)' }}
    >
      {/* Live location sender for INHOUSE_INSTALLER_6TOWNS_MARCH ID */}
      {userData?.ID && (
        <InstallerLocationSender installerId={userData.ID} />
      )}
      {/* Top Bar */}
      <div
        className="flex-shrink-0 px-4 pb-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(155deg, ${ACCENT} 0%, ${ACCENT_DARK} 80%, #A80C23 100%)`,
          paddingTop: 'calc(max(env(safe-area-inset-top), 0px) + 14px)',
          boxShadow: '0 10px 24px rgba(168,12,35,0.24)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/18 border border-white/15">
            <Wifi className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-[15px] tracking-wide leading-tight">HBB Installer</h1>
            <p className="text-white/72 text-[10px]">Field Operations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {assignedJobs.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white bg-white/20 border border-white/15">
              {assignedJobs.length} pending
            </span>
          )}
          <NotificationBell userPhone={userPhone} role="installer" />
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold active:bg-white/30 transition-colors"
            >
              {userName.charAt(0)}
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden"
                  style={{ animation: 'hbb-dropdown-in 0.2s ease-out' }}>
                  {/* User Header */}
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${ACCENT_DARK} 0%, ${ACCENT} 100%)` }} />
                    <div className="relative px-5 py-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold border border-white/30 bg-white/20">
                        {userName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{userName}</p>
                        <p className="text-white/70 text-xs">{userPhone}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 text-white">
                          HBB Installer
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setShowProfileMenu(false); setActiveTab('profile'); }}
                      className="w-full px-4 py-3 text-left active:bg-gray-50 transition-colors flex items-center"
                    >
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center mr-3">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">My Profile</p>
                        <p className="text-[11px] text-gray-500">View your details</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>

                    <div className="my-1 mx-4 h-px bg-gray-100" />

                    <button
                      onClick={() => { setShowProfileMenu(false); onLogout(); }}
                      className="w-full px-4 py-3 text-left active:bg-red-50 transition-colors flex items-center"
                    >
                      <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mr-3">
                        <LogOut className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-red-600 text-sm">Sign Out</p>
                        <p className="text-[11px] text-red-400">Log out of HBB CRM</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {renderContent()}
      </div>

      {/* Bottom Tab Bar */}
      {!selectedJob && (
        <div
          className="flex-shrink-0 bg-white/96 border-t border-gray-200 flex backdrop-blur"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom), 10px)',
            minHeight: '76px',
            boxShadow: '0 -6px 20px rgba(0,0,0,0.06)',
          }}
        >
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative"
                style={{ color: isActive ? ACCENT : '#9CA3AF' }}
              >
                <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-normal'}`}>
                  {tab.label}
                </span>
                {tab.id === 'requests' && (newJobs.length > 0 || activeJob) && (
                  <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: '#EF4444' }}>
                    {newJobs.length + (activeJob ? 1 : 0)}
                  </span>
                )}
                {tab.id === 'jobs' && assignedJobs.length > 0 && (
                  <span className="absolute top-1 right-1/4 w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                    style={{ backgroundColor: '#EF4444' }}>
                    {assignedJobs.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Rejection dialog */}
      {rejectDialogJob && (
        <RejectDialog
          job={rejectDialogJob}
          onConfirm={handleConfirmReject}
          onCancel={() => setRejectDialogJob(null)}
        />
      )}

      {/* Completion photo modal */}
      {showCompletionModal && activeJob && inHouseInstallerId && (
        <CompletionModal
          job={activeJob}
          installerId={inHouseInstallerId}
          onClose={() => setShowCompletionModal(false)}
          onComplete={() => {
            setActiveJob(null);
            setIsTracking(false);
            setShowCompletionModal(false);
            toast.success('Installation completed!');
          }}
        />
      )}

      {/* Dropdown animation */}
      <style>{`
        @keyframes hbb-dropdown-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
});

// ─── INSTALLER HOME ─────────────────────────────────────────────────────────
function InstallerHome({ userName, assignedCount, todayCount, completedCount, totalCount, todayJobs, loading, onRefresh, onSelectJob, onViewAll, installerName }: any) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-3 sm:p-4 space-y-4 max-w-md mx-auto w-full pb-5">
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-[15px] font-semibold text-gray-700 tracking-tight">{greeting},</h2>
          <p className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{installerName || userName}</p>
          <p className="text-xs font-medium" style={{ color: ACCENT }}>Installer Dashboard</p>
        </div>
        <button
          onClick={onRefresh}
          className="p-3 rounded-2xl active:scale-95 transition-all shadow-sm"
          style={{ backgroundColor: '#FFF5F5', border: '1px solid rgba(230,0,0,0.08)' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: ACCENT }} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label="Pending" value={assignedCount} color={ACCENT_DARK} bg="#FFF5F5" />
        <StatCard label="Today" value={todayCount} color={ACCENT} bg="#FEF2F2" />
        <StatCard label="Done" value={completedCount} color="#10B981" bg="#ECFDF5" />
      </div>

      {/* Upcoming Jobs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800 tracking-tight">
            {todayCount > 0 ? "Today's Jobs" : 'Next Up'}
          </h3>
          {assignedCount > 0 && (
            <button onClick={onViewAll} className="text-xs font-semibold" style={{ color: ACCENT }}>
              View all →
            </button>
          )}
        </div>

        {todayJobs.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#FEF2F2' }}>
              <CheckCircle className="w-6 h-6" style={{ color: ACCENT }} />
            </div>
            <p className="text-sm font-semibold text-gray-700">All clear!</p>
            <p className="text-xs text-gray-400 mt-1">No pending jobs right now</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayJobs.map((job: any) => (
              <JobMiniCard key={job.id} job={job} onSelect={() => onSelectJob(job)} />
            ))}
          </div>
        )}
      </div>

      {/* Performance */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: ACCENT }}>Performance</h3>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xl font-bold" style={{ color: ACCENT_DARK }}>{totalCount}</p>
            <p className="text-[10px] text-gray-500">Total Jobs</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-xl font-bold" style={{ color: ACCENT }}>
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </p>
            <p className="text-[10px] text-gray-500">Completion</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-xl font-bold" style={{ color: ACCENT_DARK }}>{assignedCount}</p>
            <p className="text-[10px] text-gray-500">In Queue</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── JOBS LIST ──────────────────────────────────────────────────────────────
function JobsList({ jobs, title, emptyMessage, onSelectJob, loading }: {
  jobs: any[]; title: string; emptyMessage: string; onSelectJob: (j: any) => void; loading: boolean;
}) {
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        jobs.map(job => (
          <JobMiniCard key={job.id} job={job} onSelect={() => onSelectJob(job)} />
        ))
      )}
    </div>
  );
}

// ─── JOB MINI CARD ──────────────────────────────────────────────────────────
function JobMiniCard({ job, onSelect }: { job: any; onSelect: () => void }) {
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.assigned;
  const townName = job.town || '—';

  // Stale job warning: assigned > 48h ago
  const isStale = job.status === 'assigned' && job.assigned_at &&
    (Date.now() - new Date(job.assigned_at).getTime() > 48 * 60 * 60 * 1000);

  return (
    <button onClick={onSelect}
      className={`w-full bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3 text-left active:bg-gray-50 transition-colors ${isStale ? 'border-orange-300' : 'border-gray-100'}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: isStale ? '#FFF7ED' : cfg.bg }}>
        {isStale ? (
          <AlertTriangle className="w-5 h-5 text-orange-500" />
        ) : (
          <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{job.customer_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
            <MapPin className="w-3 h-3" /> {townName}
          </span>
          {job.scheduled_date && (
            <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />
              {new Date(job.scheduled_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        {isStale && (
          <p className="text-[10px] text-orange-600 font-medium mt-1">Overdue — assigned {Math.round((Date.now() - new Date(job.assigned_at).getTime()) / (60 * 60 * 1000))}h ago</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ backgroundColor: isStale ? '#FFF7ED' : cfg.bg, color: isStale ? '#D97706' : cfg.color }}>
          {isStale ? 'Overdue' : cfg.label}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-300" />
      </div>
    </button>
  );
}

// ─── JOB DETAIL VIEW ────────────────────────────────────────────────────────
function JobDetailView({ job, onBack, onUpdateStatus }: {
  job: any; onBack: () => void; onUpdateStatus: (id: string, status: string, remarks?: string, location?: { lat: number; lng: number; accuracy?: number }) => void;
}) {
  const [remarks, setRemarks] = useState(job.remarks || '');
  const [updating, setUpdating] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.assigned;
  const townName = job.town || '—';

  // Capture GPS location
  const captureGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('[GPS] Raw position object:', pos);
        console.log('[GPS] Position coords:', pos.coords);
        
        // Validate GPS coordinates to prevent NaN values
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        
        console.log('[GPS] Extracted values:', {
          lat,
          lng,
          accuracy,
          latIsNaN: isNaN(lat),
          lngIsNaN: isNaN(lng),
          accuracyIsNaN: accuracy ? isNaN(accuracy) : 'N/A'
        });
        
        if (isNaN(lat) || isNaN(lng) || (accuracy && isNaN(accuracy))) {
          setGpsError('Invalid GPS coordinates received');
          setGpsLoading(false);
          toast.error('Invalid GPS coordinates');
          return;
        }
        
        setGpsLocation({
          lat: lat,
          lng: lng,
          accuracy: accuracy,
        });
        setGpsLoading(false);
        toast.success('Location captured!');
      },
      (err) => {
        setGpsError(err.message || 'Failed to get location');
        setGpsLoading(false);
        toast.error('Could not capture location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleAction = async (status: string) => {
    setUpdating(true);
    // For completed status, include GPS if available and valid
    let loc = undefined;
    if (status === 'completed' && gpsLocation) {
      // Validate GPS data one more time before sending
      if (!isNaN(gpsLocation.lat) && !isNaN(gpsLocation.lng) && 
          (!gpsLocation.accuracy || !isNaN(gpsLocation.accuracy))) {
        loc = gpsLocation;
      } else {
        console.warn('Invalid GPS data detected, not sending location');
      }
    }
    await onUpdateStatus(job.id, status, remarks, loc);
    setUpdating(false);
  };

  // WhatsApp message
  const getWhatsAppMessage = () => {
    const dateStr = job.scheduled_date
      ? new Date(job.scheduled_date).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'long' })
      : 'TBD';
    return `Hello ${job.customer_name}, this is your Airtel HBB installer. Your home broadband installation${job.package ? ` (${job.package})` : ''} is scheduled for ${dateStr}${job.scheduled_time ? ` at ${job.scheduled_time}` : ''}. I'll be arriving at your location${job.estate_name ? ` in ${job.estate_name}` : ''}, ${townName}. Please ensure someone is available. Reply to confirm or call me for any changes.`;
  };

  const whatsappLink = generateWhatsAppLink(job.customer_phone, getWhatsAppMessage());

  return (
    <div className="p-4 space-y-4 pb-8">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium" style={{ color: ACCENT }}>
        ← Back to jobs
      </button>

      {/* SR Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-gray-400">{job.sr_number || `#${job.id}`}</span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">{job.customer_name}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{townName}{job.estate_name ? `, ${job.estate_name}` : ''}</span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</h3>
        <DetailRow icon={Phone} label="Phone" value={job.customer_phone} isLink />
        {job.package && <DetailRow icon={ClipboardList} label="Package" value={job.package} />}
        {job.scheduled_date && (
          <DetailRow icon={Calendar} label="Date"
            value={new Date(job.scheduled_date).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })} />
        )}
        {job.scheduled_time && <DetailRow icon={Clock} label="Time" value={job.scheduled_time} />}
      </div>

      {/* GPS Check-in (for assigned jobs) */}
      {job.status === 'assigned' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">GPS Check-in</h3>
          {gpsLocation ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700">Location captured</p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}
                  {gpsLocation.accuracy && ` (±${Math.round(gpsLocation.accuracy)}m)`}
                </p>
              </div>
              <button onClick={captureGPS} className="text-[10px] font-medium" style={{ color: ACCENT }}>
                Refresh
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={captureGPS}
                disabled={gpsLoading}
                className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center gap-2 text-sm font-medium text-gray-600 active:bg-gray-50 disabled:opacity-50"
              >
                {gpsLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Getting location...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    Capture My Location
                  </>
                )}
              </button>
              {gpsError && (
                <p className="text-[11px] text-red-500 mt-2 text-center">{gpsError}</p>
              )}
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                Location will be attached when you mark the job as completed
              </p>
            </>
          )}
        </div>
      )}

      {/* Remarks */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Remarks</h3>
        <textarea
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          placeholder="Add installation notes..."
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 resize-none"
        />
      </div>

      {/* Action Buttons (only for assigned jobs) */}
      {job.status === 'assigned' && (
        <div className="space-y-2">
          <button onClick={() => handleAction('completed')} disabled={updating}
            className="w-full py-3.5 rounded-2xl bg-green-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all">
            <CheckCircle className="w-5 h-5" />
            {gpsLocation ? 'Complete with GPS Check-in' : 'Mark as Completed'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleAction('rescheduled')} disabled={updating}
              className="py-3 rounded-2xl bg-purple-50 text-purple-600 font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]">
              <Clock className="w-4 h-4" /> Reschedule
            </button>
            <button onClick={() => handleAction('failed')} disabled={updating}
              className="py-3 rounded-2xl bg-red-50 text-red-600 font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]">
              <XCircle className="w-4 h-4" /> Failed
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleAction('unreachable')} disabled={updating}
              className="py-3 rounded-2xl bg-gray-100 text-gray-600 font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]">
              <AlertTriangle className="w-4 h-4" /> Unreachable
            </button>
            <button onClick={() => handleAction('not_ready')} disabled={updating}
              className="py-3 rounded-2xl bg-orange-50 text-orange-600 font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98]">
              <AlertTriangle className="w-4 h-4" /> Not Ready
            </button>
          </div>
        </div>
      )}

      {/* Customer Communication */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Customer</h3>
        <a href={`tel:${job.customer_phone}`}
          className="w-full py-3 rounded-2xl border-2 border-green-500 text-green-600 font-semibold text-sm flex items-center justify-center gap-2 active:bg-green-50 transition-colors">
          <Phone className="w-4 h-4" />
          Call Customer
        </a>
        <a href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 active:opacity-90 transition-opacity"
          style={{ backgroundColor: '#25D366' }}>
          <MessageCircle className="w-4 h-4" />
          WhatsApp Confirmation
        </a>
      </div>
    </div>
  );
}

// ─── INSTALLER PROFILE ──────────────────────────────────────────────────────
function InstallerProfile({ user, installer, stats, jobs, onLogout }: {
  user: any; installer: any; stats: { total: number; completed: number; assigned: number }; jobs: any[]; onLogout: () => void;
}) {
  const failedJobs = jobs.filter(j => j.status === 'failed').length;
  const rescheduledJobs = jobs.filter(j => j.status === 'rescheduled').length;
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const successRate = (stats.completed + failedJobs) > 0
    ? Math.round((stats.completed / (stats.completed + failedJobs)) * 100) : 0;

  // Weekly activity — last 7 days
  const weekActivity: { day: string; shortDay: string; count: number; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = jobs.filter(j =>
      (j.completed_at?.startsWith(dateStr)) ||
      (j.status === 'completed' && j.assigned_at?.startsWith(dateStr))
    ).length;
    weekActivity.push({
      day: d.toLocaleDateString('en-KE', { weekday: 'short' }),
      shortDay: d.toLocaleDateString('en-KE', { weekday: 'narrow' }),
      count,
      isToday: i === 0,
    });
  }
  const maxWeekCount = Math.max(...weekActivity.map(w => w.count), 1);

  // Member since
  const memberSince = installer?.created_at
    ? new Date(installer.created_at).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
    : null;

  // Achievements
  const achievements = [
    { id: 'first', label: 'First Install', desc: 'Completed first job', icon: Zap, earned: stats.completed >= 1, color: '#F59E0B' },
    { id: 'ten', label: '10 Installs', desc: 'Completed 10 jobs', icon: Star, earned: stats.completed >= 10, color: '#3B82F6' },
    { id: 'fifty', label: '50 Installs', desc: 'Completed 50 jobs', icon: Award, earned: stats.completed >= 50, color: '#8B5CF6' },
    { id: 'century', label: 'Century Club', desc: 'Completed 100 jobs', icon: Shield, earned: stats.completed >= 100, color: ACCENT },
    { id: 'reliable', label: 'Reliable', desc: '90%+ success rate', icon: TrendingUp, earned: successRate >= 90 && stats.total >= 5, color: '#10B981' },
  ];

  const earnedCount = achievements.filter(a => a.earned).length;

  const handleCopyPhone = () => {
    const phone = user?.phone_number || '';
    if (phone && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      toast.success('Phone number copied');
    }
  };

  // SVG ring for completion rate
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (completionRate / 100) * ringCircumference;

  return (
    <div className="pb-8">
      {/* Hero Card */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${ACCENT_DARK} 0%, ${ACCENT} 40%, #FF1A1A 100%)` }} />
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 bg-white" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5 bg-white" />

        <div className="relative px-4 pt-6 pb-8 flex flex-col items-center">
          {/* Avatar with ring */}
          <div className="relative mb-3">
            <svg width="108" height="108" className="-rotate-90">
              <circle cx="54" cy="54" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
              <circle cx="54" cy="54" r={ringRadius} fill="none" stroke="white"
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={ringCircumference} strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30"
                style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: 'white' }}>
                {(user?.full_name || 'I').charAt(0)}
              </div>
            </div>
            {/* Online indicator */}
            {installer?.status === 'available' && (
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-400 border-[3px] flex items-center justify-center" style={{ borderColor: ACCENT }}>
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-white">{user?.full_name || 'Installer'}</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <button onClick={handleCopyPhone} className="flex items-center gap-1 text-white/70 text-sm active:text-white/90">
              {user?.phone_number || ''}
              <Copy className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-semibold text-white border border-white/30 bg-white/15">
              HBB Installer
            </span>
            {installer?.status && (
              <span className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                installer.status === 'available'
                  ? 'text-white border-white/30 bg-white/20'
                  : 'text-yellow-200 border-yellow-300/30 bg-yellow-500/20'
              }`}>
                {installer.status === 'available' ? '● On Duty' : installer.status}
              </span>
            )}
          </div>

          {/* Completion label */}
          <p className="text-white/50 text-[10px] mt-3">{completionRate}% completion rate</p>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2">
          <MiniStatCard value={stats.total} label="Total" color={ACCENT} bg="#FEF2F2" />
          <MiniStatCard value={stats.completed} label="Done" color="#10B981" bg="#ECFDF5" />
          <MiniStatCard value={stats.assigned} label="Pending" color={ACCENT_DARK} bg="#FFF5F5" />
          <MiniStatCard value={failedJobs} label="Failed" color="#6B7280" bg="#F3F4F6" />
        </div>

        {/* Success Metrics */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: ACCENT }}>Performance</h3>
          <div className="space-y-3">
            <ProgressMetric label="Success Rate" value={successRate} suffix="%" color="#10B981" />
            <ProgressMetric label="Completion Rate" value={completionRate} suffix="%" color={ACCENT} />
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-500">Daily Capacity</span>
              <span className="text-sm font-semibold text-gray-900">
                {installer?.max_jobs_per_day || '—'} jobs/day
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Activity Heatmap */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: ACCENT }}>This Week's Activity</h3>
          <div className="flex items-end justify-between gap-1.5 h-24">
            {weekActivity.map((day, i) => {
              const barHeight = day.count > 0 ? Math.max(20, (day.count / maxWeekCount) * 100) : 8;
              return (
                <div key={`week-${i}`} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-bold" style={{ color: day.count > 0 ? ACCENT_DARK : '#D1D5DB' }}>{day.count > 0 ? day.count : ''}</span>
                  <div
                    className="w-full rounded-lg transition-all duration-500"
                    style={{
                      height: `${barHeight}%`,
                      backgroundColor: day.isToday
                        ? ACCENT
                        : day.count > 0 ? '#FECACA' : '#F3F4F6',
                      opacity: day.count > 0 ? 1 : 0.5,
                    }}
                  />
                  <span className={`text-[10px] ${day.isToday ? 'font-bold' : 'font-normal'}`}
                    style={{ color: day.isToday ? ACCENT : '#9CA3AF' }}>
                    {day.shortDay}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Weekly total</span>
            <span className="text-sm font-bold" style={{ color: ACCENT_DARK }}>
              {weekActivity.reduce((s, d) => s + d.count, 0)} installations
            </span>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: ACCENT }}>Achievements</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: ACCENT, backgroundColor: '#FEF2F2' }}>
              {earnedCount}/{achievements.length}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {achievements.map(badge => {
              const Icon = badge.icon;
              return (
                <div key={badge.id} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      badge.earned ? 'shadow-sm' : 'opacity-25'
                    }`}
                    style={{
                      backgroundColor: badge.earned ? `${badge.color}15` : '#F3F4F6',
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: badge.earned ? badge.color : '#D1D5DB' }} />
                  </div>
                  <span className={`text-[8px] text-center leading-tight ${
                    badge.earned ? 'text-gray-700 font-semibold' : 'text-gray-400'
                  }`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Installer Details */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: ACCENT }}>Details</h3>
          <div className="space-y-2.5">
            <ProfileDetailRow icon={Phone} label="Phone" value={user?.phone_number || '—'} />
            {user?.employee_id && <ProfileDetailRow icon={Shield} label="ID" value={user.employee_id} />}
            {installer?.town && <ProfileDetailRow icon={MapPin} label="Town" value={installer.town} />}
            {memberSince && <ProfileDetailRow icon={Calendar} label="Joined" value={memberSince} />}
            <ProfileDetailRow icon={Zap} label="Capacity" value={`${installer?.max_jobs_per_day || '—'} jobs/day`} />
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: ACCENT }}>Job Breakdown</h3>
          <div className="space-y-2">
            {[
              { label: 'Completed', count: stats.completed, color: '#10B981' },
              { label: 'Assigned', count: stats.assigned, color: ACCENT_DARK },
              { label: 'Failed', count: failedJobs, color: '#EF4444' },
              { label: 'Rescheduled', count: rescheduledJobs, color: '#8B5CF6' },
            ].filter(s => s.count > 0).map(status => (
              <div key={status.label}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="text-xs text-gray-600">{status.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{status.count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: stats.total > 0 ? `${(status.count / stats.total) * 100}%` : '0%',
                      backgroundColor: status.color,
                      minWidth: status.count > 0 ? '4px' : '0px',
                    }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security — PIN Change */}
        <InstallerPinChange phone={user?.phone_number || ''} />

        {/* App Info */}
        <div className="rounded-2xl px-4 py-3 text-center" style={{ backgroundColor: '#FEF2F2' }}>
          <p className="text-[10px]" style={{ color: ACCENT }}>Airtel HBB CRM v1.0</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#FECACA' }}>Powered by Airtel Champions</p>
        </div>

        {/* Log Out */}
        <button onClick={onLogout}
          className="w-full py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 active:opacity-90 transition-all mb-4 text-white"
          style={{ backgroundColor: ACCENT_DARK }}>
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

// ─── PIN CHANGE ─────────────────────────────────────────────────────────────
function InstallerPinChange({ phone }: { phone: string }) {
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  const handlePinChange = async () => {
    setPinError('');
    if (!currentPin || !newPin || !confirmPin) { setPinError('All fields are required'); return; }
    if (!/^\d{4,6}$/.test(newPin)) { setPinError('New PIN must be 4-6 digits'); return; }
    if (newPin !== confirmPin) { setPinError('New PINs do not match'); return; }
    if (currentPin === newPin) { setPinError('New PIN must be different'); return; }

    setPinLoading(true);
    try {
      await changePin(phone, currentPin, newPin, 'hbb_installer');
      toast.success('PIN changed successfully!');
      setShowPinChange(false);
      setCurrentPin(''); setNewPin(''); setConfirmPin('');
    } catch (err: any) {
      setPinError(err.message || 'Failed to change PIN');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2" style={{ color: ACCENT }}>
          <Lock className="w-3.5 h-3.5" /> Security
        </h3>
      </div>
      {showPinChange ? (
        <div className="space-y-3">
          <input type="password" inputMode="numeric" maxLength={6} placeholder="Current PIN" value={currentPin}
            onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2" />
          <input type="password" inputMode="numeric" maxLength={6} placeholder="New PIN (4-6 digits)" value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2" />
          <input type="password" inputMode="numeric" maxLength={6} placeholder="Confirm New PIN" value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2" />
          {pinError && <p className="text-xs text-red-500">{pinError}</p>}
          <div className="flex gap-2">
            <button onClick={handlePinChange} disabled={pinLoading}
              className="flex-1 py-2.5 rounded-xl text-white font-semibold text-xs disabled:opacity-50"
              style={{ backgroundColor: ACCENT }}>
              {pinLoading ? 'Saving...' : 'Save PIN'}
            </button>
            <button onClick={() => { setShowPinChange(false); setPinError(''); setCurrentPin(''); setNewPin(''); setConfirmPin(''); }}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold text-xs">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowPinChange(true)}
          className="w-full py-2.5 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ borderColor: ACCENT, color: ACCENT }}>
          <Lock className="w-4 h-4" /> Change PIN
        </button>
      )}
    </div>
  );
}

// ─── PROFILE HELPERS ────────────────────────────────────────────────────────
function MiniStatCard({ value, label, color, bg }: { value: number; label: string; color: string; bg: string }) {
  return (
    <div className="rounded-2xl p-3 text-center shadow-sm border border-gray-100" style={{ backgroundColor: bg }}>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[9px] text-gray-600 mt-0.5">{label}</p>
    </div>
  );
}

function ProgressMetric({ label, value, suffix, color }: { label: string; value: number; suffix?: string; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}{suffix}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ProfileDetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEF2F2' }}>
        <Icon className="w-3.5 h-3.5" style={{ color: ACCENT }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── SHARED ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className="rounded-2xl p-3 text-center" style={{ backgroundColor: bg }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-gray-600 mt-0.5">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 capitalize">{value}</span>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, isLink }: { icon: any; label: string; value: string; isLink?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
      {isLink ? (
        <a href={`tel:${value}`} className="text-sm font-medium" style={{ color: ACCENT }}>{value}</a>
      ) : (
        <span className="text-sm text-gray-900 font-medium">{value}</span>
      )}
    </div>
  );
}

// ─── NEW REQUESTS TAB ────────────────────────────────────────────────────────
function NewRequestsTab({ newJobs, activeJob, acceptedJobs, onAccept, onEnRoute, onReject, onActiveJobUpdate, loading }: {
  newJobs: any[]; activeJob: any | null; acceptedJobs: Set<string>;
  onAccept: (job: any) => Promise<void>;
  onEnRoute: (job: any) => Promise<void>;
  onReject: (job: any) => Promise<void>;
  onActiveJobUpdate: (status: 'arrived' | 'completed') => Promise<void>; loading: boolean;
}) {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-base font-bold text-gray-900">New Requests</h2>

      {/* Active immediate job */}
      {activeJob && (
        <div className="bg-white rounded-2xl border-2 shadow-sm overflow-hidden" style={{ borderColor: '#10B981' }}>
          <div className="px-4 py-2 flex items-center gap-2" style={{ background: '#10B981' }}>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Active Job</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                <Phone className="w-3.5 h-3.5 text-gray-400" />{activeJob.customer_phone}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />{activeJob.estate_name}{activeJob.zone ? `, ${activeJob.zone}` : ''}
              </div>
              {activeJob.package && <p className="text-xs text-gray-400 mt-0.5">{activeJob.package}</p>}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-1.5">
              {(['Assigned', 'On Way', 'Arrived', 'Done'] as const).map((lbl, i) => {
                const stMap: Record<string, number> = { assigned: 0, on_way: 1, arrived: 2, completed: 3 };
                const cur = stMap[activeJob.status] ?? 0;
                return (
                  <div key={lbl} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                      i < cur ? 'bg-green-500 text-white' : i === cur ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}>{i < cur ? '✓' : i + 1}</div>
                    <span className={`text-[8px] ${i === cur ? 'font-bold text-blue-600' : i < cur ? 'text-green-600' : 'text-gray-400'}`}>{lbl}</span>
                  </div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {activeJob.status === 'on_way' && (
                <button onClick={() => onActiveJobUpdate('arrived')}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                  <Navigation className="w-4 h-4" /> Arrived
                </button>
              )}
              <button onClick={() => onActiveJobUpdate('completed')}
                className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]"
                style={{ backgroundColor: '#10B981' }}>
                <CheckCircle className="w-4 h-4" /> Completed
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-blue-600 font-medium">Location sharing active</span>
            </div>
          </div>
        </div>
      )}

      {/* Incoming requests */}
      {newJobs.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {newJobs.length} Pending Request{newJobs.length !== 1 ? 's' : ''}
          </p>
          {newJobs.map(job => (
            <NewJobCard
              key={job.id}
              job={job}
              accepted={acceptedJobs.has(job.id)}
              onAccept={() => onAccept(job)}
              onEnRoute={() => onEnRoute(job)}
              onReject={() => onReject(job)}
              disabled={!!activeJob}
            />
          ))}
        </div>
      ) : !activeJob ? (
        <div className="text-center py-16 text-gray-400">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No new requests</p>
          <p className="text-xs mt-1 text-gray-300">Immediate bookings from customers appear here</p>
        </div>
      ) : null}
    </div>
  );
}

// ─── NEW JOB CARD ────────────────────────────────────────────────────────────
function NewJobCard({ job, accepted, onAccept, onEnRoute, onReject, disabled }: {
  job: any;
  accepted: boolean;
  onAccept: () => Promise<void>;
  onEnRoute: () => Promise<void>;
  onReject: () => Promise<void>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const elapsed = job.assigned_at ? Math.round((Date.now() - new Date(job.assigned_at).getTime()) / 60000) : null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  return (
    <div
      className="bg-white rounded-2xl border-2 shadow-sm overflow-hidden"
      style={{ borderColor: accepted ? '#10B981' : '#FDE68A' }}
    >
      {/* Status banner */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ backgroundColor: accepted ? '#ECFDF5' : '#FFFBEB' }}
      >
        <div className="flex items-center gap-1.5">
          {accepted && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: accepted ? '#047857' : '#B45309' }}
          >
            {accepted ? 'Accepted — Press En Route when leaving' : 'New Request'}
          </span>
        </div>
        {elapsed !== null && (
          <span className="text-[10px]" style={{ color: accepted ? '#6B7280' : '#B45309' }}>
            {elapsed}m ago
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Job info */}
        <div>
          {job.customer_name && (
            <p className="text-sm font-bold text-gray-900 mb-1">{job.customer_name}</p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="w-3 h-3 text-gray-400" />{job.customer_phone}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3 text-gray-400" />
            {[job.estate_name || job.estate, job.zone, job.town].filter(Boolean).join(', ')}
          </div>
          {job.package && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
              <Wifi className="w-3 h-3" />{job.package}
            </div>
          )}
        </div>

        {disabled ? (
          <p className="text-[11px] text-gray-400 text-center py-1.5 bg-gray-50 rounded-xl">
            Complete your active job first
          </p>
        ) : accepted ? (
          /* ── Post-accept: En Route button ── */
          <div className="space-y-2">
            <button
              onClick={() => run(onEnRoute)}
              disabled={busy}
              className="w-full py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-all"
              style={{ background: 'linear-gradient(135deg, #0EA5E9, #0284C7)' }}
            >
              {busy
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Navigation2 className="w-4 h-4" />
              }
              I'm En Route — Start GPS
            </button>
            <button
              onClick={() => run(onReject)}
              disabled={busy}
              className="w-full py-2 rounded-xl text-xs text-gray-400 bg-gray-50 active:bg-gray-100 transition-colors"
            >
              Cancel acceptance
            </button>
          </div>
        ) : (
          /* ── Initial: Accept / Decline ── */
          <div className="flex gap-2">
            <button
              onClick={() => run(onReject)}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-semibold text-xs flex items-center justify-center gap-1 disabled:opacity-50 active:scale-[0.98]"
            >
              {busy
                ? <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin" />
                : <XCircle className="w-3.5 h-3.5" />
              }
              Decline
            </button>
            <button
              onClick={() => run(onAccept)}
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-1 disabled:opacity-50 active:scale-[0.98]"
              style={{ backgroundColor: '#10B981' }}
            >
              {busy
                ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                : <CheckCircle className="w-3.5 h-3.5" />
              }
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPLETION MODAL ────────────────────────────────────────────────────────
function CompletionModal({ job, installerId, onClose, onComplete }: {
  job: any; installerId: string; onClose: () => void; onComplete: () => void;
}) {
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState('');
  const [afterPreview, setAfterPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickPhoto = (type: 'before' | 'after') => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*'; inp.capture = 'environment' as any;
    inp.onchange = () => {
      const f = inp.files?.[0]; if (!f) return;
      const url = URL.createObjectURL(f);
      if (type === 'before') { setBeforePhoto(f); setBeforePreview(url); }
      else { setAfterPhoto(f); setAfterPreview(url); }
    };
    inp.click();
  };

  const uploadPhoto = async (file: File, type: 'before' | 'after') => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${installerId}/${job.id}/${type}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('installer_photos')
      .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data: u } = supabase.storage.from('installer_photos').getPublicUrl(path);
    return u.publicUrl;
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      const updates: Record<string, any> = {
        status: 'completed',
        completed_at: new Date().toISOString(),
      };
      if (beforePhoto) updates.before_photo_url = await uploadPhoto(beforePhoto, 'before');
      if (afterPhoto) updates.after_photo_url = await uploadPhoto(afterPhoto, 'after');

      const { error } = await supabase.from('jobs').update(updates).eq('id', job.id);
      if (error) throw error;

      await supabase.from('installers')
        .update({ is_available: true, current_job_id: null }).eq('id', Number(installerId));

      onComplete();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">Complete Installation</h3>
          <button onClick={onClose} className="text-sm text-gray-400 px-2">Skip</button>
        </div>
        <p className="text-xs text-gray-500">Upload before/after photos to verify the installation.</p>

        <div className="grid grid-cols-2 gap-3">
          {([
            { label: 'Before', type: 'before' as const, file: beforePhoto, preview: beforePreview },
            { label: 'After', type: 'after' as const, file: afterPhoto, preview: afterPreview },
          ] as const).map(({ label, type, file, preview }) => (
            <button key={type} onClick={() => pickPhoto(type)}
              className="relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden"
              style={{ borderColor: file ? '#10B981' : '#D1D5DB' }}>
              {preview
                ? <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                : <><Camera className="w-7 h-7 text-gray-300" /><span className="text-xs text-gray-400 font-medium">{label}</span></>
              }
              {file && (
                <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={uploading}
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
          style={{ backgroundColor: uploading ? '#9CA3AF' : '#10B981' }}>
          {uploading
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Uploading…</>
            : <><Upload className="w-4 h-4" />{beforePhoto || afterPhoto ? 'Upload & Complete' : 'Complete Without Photos'}</>
          }
        </button>
      </div>
    </div>
  );
}