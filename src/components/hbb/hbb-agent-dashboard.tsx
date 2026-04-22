// HBB Agent Dashboard - Mobile-first CRM for HBB agents
import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
let CapacitorApp: any = null;
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  import('@capacitor/app').then(mod => { CapacitorApp = mod.App; }).catch(() => {});
}
import { Home, PlusCircle, List, User, LogOut, RefreshCw, Wifi, ChevronRight, BarChart3, Upload, Lock, Package } from 'lucide-react';
import { HBBNewLeadForm } from './hbb-new-lead-form';
import { HBBMyLeads } from './hbb-my-leads';
import { HBBAnalytics } from './hbb-analytics';
import { HBBBulkImport } from './hbb-bulk-import';
import { HBBOrderTracker } from './hbb-order-tracker';
import { NotificationBell } from './hbb-notifications';
import { getDashboardStats, changePin } from './hbb-api';
import { toast } from 'sonner';

const ACCENT = '#E60000';
const ACCENT_DARK = '#CC0000';

interface Props {
  user: any;
  userData: any;
  onLogout: () => void;
  onBackToMainMenu?: () => void;
}

export function HBBAgentDashboard({ user, userData, onLogout, onBackToMainMenu }: Props) {
  const isCustomerOnly = !!(userData?._customerOnly);
  const [activeTab, setActiveTab] = useState(isCustomerOnly ? 'my-order' : 'home');
  const [stats, setStats] = useState({ open: 0, assigned: 0, completed: 0, failed: 0, total: 0, todayInstallations: 0 });
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const agentName = userData?.full_name || user?.full_name || 'Agent';
  const agentPhone = userData?.phone_number || user?.phone_number || '';

  // Android back button handler
  useEffect(() => {
    const setupBackButton = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('[HBBAgentDashboard] Not running in Capacitor, skipping back button setup');
        return;
      }

      console.log('[HBBAgentDashboard] 📱 Setting up Android back button listener...');

      await CapacitorApp?.addListener('backButton', () => {
        console.log('[HBBAgentDashboard] ⬅️ Back button pressed');

        // If onBackToMainMenu is available, use it to return to HBB selection
        if (onBackToMainMenu) {
          console.log('[HBBAgentDashboard] Calling onBackToMainMenu');
          onBackToMainMenu();
        } else {
          console.log('[HBBAgentDashboard] No onBackToMainMenu handler, using default behavior');
          // Default behavior: logout
          onLogout();
        }
      });

      console.log('[HBBAgentDashboard] ✅ Back button listener setup complete');
    };

    setupBackButton();

    // Cleanup
    return () => {
      if (Capacitor.isNativePlatform()) {
        console.log('[HBBAgentDashboard] 🧹 Cleaning up back button listener');
        CapacitorApp?.removeAllListeners();
      }
    };
  }, [onBackToMainMenu, onLogout]);

  // Browser back button handler for web
  useEffect(() => {
    const handleBrowserBack = (event: PopStateEvent) => {
      console.log('[HBBAgentDashboard] ⬅️ Browser back button pressed');

      // Prevent default back navigation
      event.preventDefault();

      // If onBackToMainMenu is available, use it to return to HBB selection
      if (onBackToMainMenu) {
        console.log('[HBBAgentDashboard] Calling onBackToMainMenu');
        onBackToMainMenu();
      } else {
        console.log('[HBBAgentDashboard] No onBackToMainMenu handler, using default behavior');
        // Default behavior: logout
        onLogout();
      }

      // Push a new state to prevent going back further
      window.history.pushState(null, '', window.location.href);
    };

    // Push initial state to enable back button interception
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('popstate', handleBrowserBack);

    return () => {
      window.removeEventListener('popstate', handleBrowserBack);
    };
  }, [onBackToMainMenu, onLogout]);

  const refreshStats = useCallback(async () => {
    if (isCustomerOnly) { setLoading(false); return; }
    setLoading(true);
    try {
      const s = await getDashboardStats(agentPhone);
      setStats(s);
    } catch (e) {
      console.error('[HBB] Stats error:', e);
    } finally {
      setLoading(false);
    }
  }, [agentPhone, isCustomerOnly]);

  useEffect(() => { refreshStats(); }, [refreshStats]);

  // Listen for tab changes via URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab?.startsWith('hbb-')) {
      const hbbTab = tab.replace('hbb-', '');
      const allowed = isCustomerOnly
        ? ['my-order']
        : ['home', 'new-lead', 'my-leads', 'profile', 'my-order'];
      if (allowed.includes(hbbTab)) setActiveTab(hbbTab);
    }
  }, [isCustomerOnly]);

  const renderContent = () => {
    switch (activeTab) {
      case 'new-lead':
        return (
          <HBBNewLeadForm
            agentName={agentName}
            agentPhone={agentPhone}
            agentRegion={userData?.region || user?.region || 'Nairobi'}
            onSuccess={() => {
              refreshStats();
              setActiveTab('my-leads');
            }}
          />
        );
      case 'my-leads':
        return (
          <HBBMyLeads
            agentPhone={agentPhone}
            onRefresh={refreshStats}
          />
        );
      case 'analytics':
        return <HBBAnalytics agentPhone={agentPhone} />;
      case 'bulk-import':
        return (
          <HBBBulkImport
            agentName={agentName}
            agentPhone={agentPhone}
            onSuccess={() => {
              refreshStats();
              setActiveTab('my-leads');
            }}
          />
        );
      case 'my-order': {
        const srId = (() => { try { const v = localStorage.getItem('hbb_self_sr_id'); return v ? parseInt(v) : null; } catch { return null; } })();
        return (
          <div className="flex flex-col">
            <div className="px-4 pt-4 pb-2 flex items-center gap-3">
              <button onClick={() => setActiveTab('home')} className="text-gray-400 hover:text-gray-700 text-sm flex items-center gap-1">
                ← Home
              </button>
            </div>
            <HBBOrderTracker
              agentPhone={agentPhone}
              agentName={agentName}
              srId={srId}
              onNewOrder={() => setActiveTab('new-lead')}
            />
          </div>
        );
      }
      case 'profile':
        return <ProfileTab user={userData || user} onLogout={onLogout} />;
      default: {
        if (isCustomerOnly) {
          // Customer-only: jump straight to order tracker
          const srId = (() => { try { const v = localStorage.getItem('hbb_self_sr_id'); return v ? parseInt(v) : null; } catch { return null; } })();
          return (
            <HBBOrderTracker
              agentPhone={agentPhone}
              agentName={agentName}
              srId={srId}
              onNewOrder={() => {}}
            />
          );
        }
        return (
          <HomeTab
            stats={stats}
            loading={loading}
            agentName={agentName}
            agentPhone={agentPhone}
            onRefresh={refreshStats}
            onNewLead={() => setActiveTab('new-lead')}
            onViewLeads={() => setActiveTab('my-leads')}
            onAnalytics={() => setActiveTab('analytics')}
            onBulkImport={() => setActiveTab('bulk-import')}
            onMyOrder={() => setActiveTab('my-order')}
          />
        );
      }
    }
  };

  const tabs = isCustomerOnly
    ? [
        { id: 'my-order', label: 'My Order', icon: Package },
        { id: 'logout-action', label: 'Sign Out', icon: LogOut },
      ]
    : [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'new-lead', label: 'New Lead', icon: PlusCircle },
        { id: 'my-leads', label: 'Leads', icon: List },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'profile', label: 'Profile', icon: User },
      ];

  return (
    <>
      <div data-testid="hbb-agent-dashboard" className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Wifi className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">{isCustomerOnly ? 'My HBB Order' : 'HBB CRM'}</h1>
            <p className="text-white/70 text-[10px]">{isCustomerOnly ? 'Track your installation' : 'Home Broadband'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-xs">{agentName.split(' ')[0]}</span>
          <NotificationBell userPhone={agentPhone} role="agent" />
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold active:bg-white/30 transition-colors"
            >
              {agentName.charAt(0)}
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden"
                  style={{ animation: 'hbb-dropdown-in 0.2s ease-out' }}>
                  {/* User Header */}
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }} />
                    <div className="relative px-5 py-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white text-lg font-bold border border-white/30">
                        {agentName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm truncate">{agentName}</p>
                        <p className="text-white/70 text-xs">{agentPhone}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 text-white">
                          {isCustomerOnly ? 'HBB Customer' : 'HBB Agent'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {!isCustomerOnly && (
                      <>
                        <button
                          onClick={() => { setShowProfileMenu(false); setActiveTab('profile'); }}
                          className="w-full px-4 py-3 text-left active:bg-gray-50 transition-colors flex items-center group"
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
                      </>
                    )}

                    <button
                      onClick={() => { setShowProfileMenu(false); onLogout(); }}
                      className="w-full px-4 py-3 text-left active:bg-red-50 transition-colors flex items-center group"
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
      <div className="flex-1 min-h-0 overflow-y-auto pb-[70px]">
        {renderContent()}
      </div>

      {/* Dropdown animation */}
      <style>{`
        @keyframes hbb-dropdown-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>

    {/* Bottom Tab Bar - FIXED AT VIEWPORT BOTTOM (OUTSIDE flex container) */}
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex z-50" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const isLogout = tab.id === 'logout-action';
        return (
          <button
            key={tab.id}
            onClick={() => isLogout ? onLogout() : setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors"
            style={{ color: isLogout ? '#EF4444' : isActive ? ACCENT : '#9CA3AF' }}
          >
            <tab.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
            <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-normal'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
    </>
  );
}
  );
}

// ─── HOME TAB ────────────────────────────────────────────────────────────────
function HomeTab({ stats, loading, agentName, agentPhone, onRefresh, onNewLead, onViewLeads, onAnalytics, onBulkImport, onMyOrder }: {
  stats: any; loading: boolean; agentName: string; agentPhone: string;
  onRefresh: () => void; onNewLead: () => void; onViewLeads: () => void;
  onAnalytics: () => void; onBulkImport: () => void; onMyOrder: () => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const hasSelfOrder = !!localStorage.getItem('hbb_self_sr_id');

  const statCards = [
    { label: 'Open Leads', value: stats.open, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Assigned', value: stats.assigned, color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Completed', value: stats.completed, color: '#10B981', bg: '#ECFDF5' },
    { label: 'Failed', value: stats.failed, color: '#EF4444', bg: '#FEF2F2' },
  ];

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{greeting},</h2>
          <p className="text-gray-600 text-sm">{agentName} 👋</p>
        </div>
        <button onClick={onRefresh} className="p-2 rounded-xl bg-gray-100 active:bg-gray-200">
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="rounded-2xl p-4 transition-all"
            style={{ backgroundColor: card.bg }}>
            <p className="text-2xl font-bold" style={{ color: card.color }}>
              {loading ? '—' : card.value}
            </p>
            <p className="text-xs text-gray-600 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* My Order banner — shown when a self-order exists */}
      {hasSelfOrder && (
        <button onClick={onMyOrder}
          className="w-full rounded-2xl overflow-hidden shadow-md active:scale-[0.98] transition-transform text-left"
          style={{ background: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)' }}>
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(230,0,0,0.25)' }}>
              <Package className="w-5 h-5" style={{ color: '#FF6666' }} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">My 5G Home Broadband</p>
              <p className="text-sm font-bold text-white">Track My Order</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Tap to see live installation status</p>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white/10">
              <ChevronRight className="w-4 h-4 text-white/60" />
            </div>
          </div>
          <div className="px-4 py-2 flex items-center gap-1.5" style={{ background: 'rgba(230,0,0,0.12)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <p className="text-[10px] text-red-300 font-medium">Awaiting Verification — tap to see full status</p>
          </div>
        </button>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Quick Actions</h3>
        <button onClick={onNewLead}
          className="w-full py-4 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)` }}>
          <PlusCircle className="w-5 h-5" />
          Submit New Lead
        </button>
        <button onClick={onViewLeads}
          className="w-full py-3 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ borderColor: ACCENT, color: ACCENT }}>
          <List className="w-5 h-5" />
          View My Leads ({stats.total})
        </button>
        <button onClick={onAnalytics}
          className="w-full py-3 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ borderColor: ACCENT, color: ACCENT }}>
          <BarChart3 className="w-5 h-5" />
          View Analytics
        </button>
        <button onClick={onBulkImport}
          className="w-full py-3 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ borderColor: ACCENT, color: ACCENT }}>
          <Upload className="w-5 h-5" />
          Bulk Import Leads
        </button>
        <button onClick={onMyOrder}
          className="w-full py-3 rounded-2xl border-2 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ borderColor: ACCENT, color: ACCENT }}>
          <Package className="w-5 h-5" />
          My Order
        </button>
      </div>

      {/* Today's Summary */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Today's Summary</h3>
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xl font-bold text-gray-900">{stats.todayInstallations}</p>
            <p className="text-[10px] text-gray-500">Installations</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-xl font-bold text-gray-900">{stats.open}</p>
            <p className="text-[10px] text-gray-500">Pending</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center flex-1">
            <p className="text-xl font-bold text-gray-900">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
            </p>
            <p className="text-[10px] text-gray-500">Success Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PROFILE TAB ──────────────────────────────────────────────────────────────
function ProfileTab({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');

  const handlePinChange = async () => {
    setPinError('');
    if (!currentPin || !newPin || !confirmPin) {
      setPinError('All fields are required');
      return;
    }
    if (!/^\d{4,6}$/.test(newPin)) {
      setPinError('New PIN must be 4-6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('New PINs do not match');
      return;
    }
    if (currentPin === newPin) {
      setPinError('New PIN must be different');
      return;
    }

    setPinLoading(true);
    try {
      await changePin(user?.phone_number || '', currentPin, newPin, 'hbb_agent');
      toast.success('PIN changed successfully!');
      setShowPinChange(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      setPinError(err.message || 'Failed to change PIN');
    } finally {
      setPinLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold mb-3"
          style={{ backgroundColor: ACCENT }}>
          {(user?.full_name || 'A').charAt(0)}
        </div>
        <h2 className="text-lg font-bold text-gray-900">{user?.full_name || 'Agent'}</h2>
        <p className="text-sm text-gray-500">{user?.phone_number || ''}</p>
        <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: ACCENT }}>
          HBB Agent
        </span>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <InfoRow label="Employee ID" value={user?.employee_id || '—'} />
        <InfoRow label="Zone" value={user?.zone || '—'} />
        <InfoRow label="Region" value={user?.region || '—'} />
        <InfoRow label="Role" value="HBB Agent" />
      </div>

      {/* Security — PIN Change */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-500" />
            Security
          </h3>
        </div>

        {showPinChange ? (
          <div className="space-y-3">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Current PIN"
              value={currentPin}
              onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="New PIN (4-6 digits)"
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2"
            />
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Confirm New PIN"
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2"
            />
            {pinError && <p className="text-xs text-red-500">{pinError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handlePinChange}
                disabled={pinLoading}
                className="flex-1 py-2.5 rounded-xl text-white font-semibold text-xs disabled:opacity-50"
                style={{ backgroundColor: ACCENT }}
              >
                {pinLoading ? 'Saving...' : 'Save PIN'}
              </button>
              <button
                onClick={() => { setShowPinChange(false); setPinError(''); setCurrentPin(''); setNewPin(''); setConfirmPin(''); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowPinChange(true)}
            className="w-full py-2.5 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ borderColor: ACCENT, color: ACCENT }}
          >
            <Lock className="w-4 h-4" />
            Change PIN
          </button>
        )}
      </div>

      {/* Logout */}
      <button onClick={onLogout}
        className="w-full py-3 rounded-2xl bg-red-50 text-red-600 font-semibold text-sm flex items-center justify-center gap-2 active:bg-red-100 transition-colors">
        <LogOut className="w-4 h-4" />
        Log Out
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}