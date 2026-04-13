// Airtel Champions v4.0.0 - Theme System + Premium UI [Build: 2026-03-09-003]
import React, { useState, useEffect, useCallback, useRef } from 'react';
import airtelChampionsIcon from './assets/LOGO.png';
import { supabase } from './utils/supabase/client';
import { Toaster } from 'sonner@2.0.3';
import { trackUserLogin, trackUserLogout, updateUserActivity, initSessionTracker } from './lib/session-tracker';
import { trackLogin, trackLogout } from './utils/analytics'; // New analytics tracking
import { initActivityTracking, logPWAAction, clearActivityUser, ACTION_TYPES } from './lib/activity-tracker';
// Capacitor App — loaded dynamically to avoid crash on web/PWA
let CapacitorApp: any = null;
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  import('@capacitor/app').then(mod => { CapacitorApp = mod.App; }).catch(() => {});
}
import { ZoneCommanderDashboard, ZoneBusinessLeadDashboard, HQDashboard, DirectorDashboard } from './components/role-dashboards';
import { DeveloperDashboard } from './components/developer-dashboard-enhanced';
import { DirectorDashboardV2 } from './components/director-dashboard-v2';
import { SettingsScreen } from './components/settings-screen';
import { ProfileSetupScreen } from './components/profile-setup';
import { AnnouncementsModal } from './components/announcements-modal';
import { CameraCapture } from './components/camera-capture';
import { SubmissionsList } from './components/submissions-list';
import { DailyMissions } from './components/daily-missions';
import { BadgesAchievements } from './components/badges-achievements';
import { TodayLeaderboardModal } from './components/today-leaderboard-modal';
import { ReportingStructure } from './components/reporting-structure-new';
import { DirectorLine } from './components/director-line';
import { SocialFeed } from './components/social-feed';
import { ProfileDropdown } from './components/profile-dropdown';
import { ProfileScreenEnhanced } from './components/profile-screen-enhanced';
import { UserProfileModal } from './components/user-profile-modal';
import { AdvancedCompare } from './components/advanced-compare';
import { ProgramsList } from './components/programs/programs-list';
import { ProgramsListFoldersApp } from './components/programs/programs-list-folders-app';
import { ProgramsWidgetHome } from './components/programs/programs-widget-home';
import { ExploreFeed } from './components/explore-feed-local';
import { AnnouncementCard } from './components/announcement-card';
import { CreateAnnouncementModalV2 as CreateAnnouncementModal } from './components/create-announcement-modal-v2';
import { DatabaseSetupInstructions } from './components/database-setup-instructions';
import { NetworkStatus } from './components/network-status';
import { ResearchPaperPlanner } from './components/research-paper-planner';
import { SubmissionsHistoryModal } from './components/submissions-history-modal';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { getAnnouncements } from './lib/supabase';
import { OfflineManager } from './utils/offline-manager';
import { UpdateManager } from './components/update-manager';
import { useLocationTracker } from './hooks/useLocationTracker';
import { useShare } from './hooks/useShare';
import { useBadge } from './hooks/useBadge';
import { WakeLockButton } from './components/wake-lock-button';
import { PushNotificationBell } from './components/push-notification-bell';
import { VanDataViewer } from './components/van-data-viewer';
import { HBBAgentDashboard } from './components/hbb/hbb-agent-dashboard';
import { HBBInstallerDashboard } from './components/hbb/hbb-installer-dashboard';
import { DSEDashboard } from './components/hbb/hbb-dse-dashboard';
import { HBBHQDashboard } from './components/hbb/hbb-hq-dashboard';
import { hbbLogin, clearSession as clearHBBSession } from './components/hbb/hbb-api';
import { ThemeProvider } from './components/theme-provider';
import { PWAInstallPrompt } from './components/pwa-install-prompt';
import { GuidedTour, shouldShowAppTour } from './components/guided-tour';
import { SignupScreen } from './components/signup-screen';
import { ClientOrderTracker } from './components/hbb/ClientOrderTracker';
import { LoginPage } from './components/LoginPage';
import { PromoterTeamLeadDashboard } from './components/promoter-team-lead/PromoterTeamLeadDashboard';
import { getTLSession, clearTLSession } from './components/promoter-team-lead/promoter-tl-api';
import { LogOut, Package, Plus, Phone, ChevronRight } from 'lucide-react';

// Safe fields to select from app_users (never select * to avoid leaking sensitive data)
const SAFE_USER_FIELDS = 'id, employee_id, full_name, phone_number, role, zone, zsm, region, rank, total_points, avatar_url, profile_photo, pin, two_factor_enabled, gps_tracking_consent' as const;

// Strip sensitive fields before persisting user to localStorage
function sanitizeUserForStorage(user: any): any {
  if (!user) return user;
  const { pin, pin_hash, password, ...safeUser } = user;
  return safeUser;
}

// WebRTC Calling System
import { useWebRTC } from './hooks/useWebRTC';
import { IncomingCallModal } from './components/calling/incoming-call-modal';
import { ActiveCallScreen } from './components/calling/active-call-screen';
import { UserDirectory } from './components/calling/user-directory';
import { CallHistory } from './components/calling/call-history';
import { PermissionRequestModal } from './components/calling/permission-request-modal';

// Import TAI Eagle logo (now using universal LOGO.png)
import taiLogo from './assets/LOGO.png';

// Import Airtel Champions logo (now using universal LOGO.png)
import airtelChampionsLogo from './assets/LOGO.png';

// User roles
type UserRole = 'sales_executive' | 'zonal_sales_manager' | 'zonal_business_manager' | 'hq_command_center' | 'director' | 'hbb_agent' | 'hbb_installer' | 'hbb_dse' | 'hbb_hq' | 'hbb_hq_admin';

// ─── STABLE MobileContainer — defined OUTSIDE App to prevent unmount/remount ──
// When defined inside App's render, React sees a NEW component type on every
// re-render, which tears down and recreates the entire child tree (all state,
// effects, API calls restart). Moving it here keeps the reference stable.
function MobileContainer({ children }: { children: React.ReactNode }) {
  // Theme-aware container — reads CSS custom properties set by ThemeProvider
  const bgPage = 'var(--theme-bg-page, #F3F4F6)';
  const bgCard = 'var(--theme-bg-card, #FFFFFF)';
  const shadow = 'var(--theme-shadow, rgba(0,0,0,0.08))';

  return (
    <div
      className="h-screen flex items-center justify-center p-0 md:p-4 overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: bgPage }}
    >
      <div
        className="w-full h-full md:max-w-[428px] md:rounded-3xl md:h-[95vh] overflow-hidden flex flex-col transition-colors duration-300"
        style={{
          backgroundColor: bgCard,
          boxShadow: `0 25px 50px ${shadow}`,
        }}
      >
        <NetworkStatus />
        <UpdateManager />
        {children}
        <PWAInstallPrompt />
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTLAuthenticated, setIsTLAuthenticated] = useState<boolean>(() => getTLSession() !== null);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);
  const [showClientTracker, setShowClientTracker] = useState(false);
  const [clientTrackerData, setClientTrackerData] = useState<{ jobId: string; customerName: string; customerPhone: string } | null>(null);
  const [showClientHome, setShowClientHome] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false);

  // Guided App Tour — shows on login until user skips 3 times
  const [showAppTour, setShowAppTour] = useState(false);

  // Trigger app tour after successful authentication
  useEffect(() => {
    if (isAuthenticated && !showSplash) {
      const shouldShow = shouldShowAppTour();
      console.log('[App] Tour check: isAuthenticated=', isAuthenticated, 'shouldShow=', shouldShow);
      if (shouldShow) {
        // Small delay to let the home screen render first
        const t = setTimeout(() => setShowAppTour(true), 800);
        return () => clearTimeout(t);
      }
    }
  }, [isAuthenticated, showSplash]);

  // GPS tracking consent: only track if user has explicitly opted in
  const gpsConsentGranted = userData?.gps_tracking_consent === true || user?.gps_tracking_consent === true;

  // Initialize location tracker (only with consent)
  useLocationTracker({
    userId: user?.id || userData?.id,
    userDetails: {
      name: user?.full_name || userData?.full_name,
      role: user?.role || userData?.role,
      region: user?.region || userData?.region,
      zone: user?.zone || userData?.zone,
      avatar: user?.avatar_url || userData?.avatar_url
    },
    enabled: isAuthenticated && !!(user?.id || userData?.id) && gpsConsentGranted
  });

  // ── URL-param tab routing ──────────────────────────────────────────────────
  // NOTE: `setActiveTab` lives inside HomeScreen, not here in App.
  // We store the desired tab in a ref so HomeScreen can read it on mount.
  const initialTabRef = React.useRef<string | null>(null);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const validTabs = [
      'home', 'feed', 'explore', 'leaderboard', 'hall-of-fame',
      'programs', 'profile', 'submissions', 'settings', 'research'
    ];
    if (tabParam && validTabs.includes(tabParam)) {
      initialTabRef.current = tabParam;
    }
    // Protocol handler: web+airtelac:tab/leaderboard
    const actionParam = urlParams.get('action');
    if (actionParam) {
      const parts = actionParam.split('/');
      if (parts[0] === 'tab' && parts[1] && validTabs.includes(parts[1])) {
        initialTabRef.current = parts[1];
      }
    }
  }, []);

  useEffect(() => {
    // Set viewport meta tag for proper mobile rendering
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      document.head.appendChild(viewportMeta);
    }
    viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    
    // ── Favicon — real PNG for crisp rendering everywhere ─────────────────────
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.type = 'image/png';
    favicon.href = airtelChampionsIcon;

    // ── Apple Touch Icon — iOS uses this for home-screen icon ─────────────────
    // Must be a real PNG — iOS Safari silently ignores SVGs.
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.setAttribute('sizes', '180x180');
    appleTouchIcon.href = airtelChampionsIcon;
    
    // Set page title
    document.title = 'Airtel Champions - Sales Intelligence Network';
    
    // Add PWA meta tags for mobile app experience
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
      { name: 'apple-mobile-web-app-title', content: 'AC Champions' },
      { name: 'mobile-web-app-capable', content: 'yes' },
      { name: 'application-name', content: 'Airtel Champions' },
      { name: 'theme-color', content: '#E60000' }, // Airtel red — matches the brand icon
    ];
    
    metaTags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });
    
    // ── Dynamic PWA manifest using the real PNG icon URL ─────────────────────
    // Vite resolves `airtelChampionsIcon` to a hashed asset path at build time
    // (e.g. /assets/f48ed4f-abc123.png) so it is always fetchable.
    const dynamicManifest = {
      id: '/',
      name: 'Airtel Champions',
      short_name: 'AC Champions',
      description: 'Sales Intelligence Network for Airtel Kenya Sales Executives',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      display_override: ['window-controls-overlay', 'standalone'],
      orientation: 'portrait-primary',
      theme_color: '#E60000',
      background_color: '#0A0A0A',
      lang: 'en',
      categories: ['business', 'productivity'],
      icons: [
        { src: airtelChampionsIcon, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: airtelChampionsIcon, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: airtelChampionsIcon, sizes: 'any',     type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [
        {
          name: 'Leaderboard', short_name: 'Rank',
          description: 'See your current ranking',
          url: '/?tab=leaderboard',
          icons: [{ src: '/icons/shortcut-leaderboard.svg', sizes: '96x96', type: 'image/svg+xml' }],
        },
        {
          name: 'Programs', short_name: 'Programs',
          description: 'Submit a new program',
          url: '/?tab=programs',
          icons: [{ src: '/icons/shortcut-programs.svg', sizes: '96x96', type: 'image/svg+xml' }],
        },
        {
          name: 'Social Feed', short_name: 'Feed',
          description: 'View team activity feed',
          url: '/?tab=feed',
          icons: [{ src: '/icons/shortcut-feed.svg', sizes: '96x96', type: 'image/svg+xml' }],
        },
        {
          name: 'My Profile', short_name: 'Profile',
          description: 'View your profile and stats',
          url: '/?tab=profile',
          icons: [{ src: '/icons/shortcut-profile.svg', sizes: '96x96', type: 'image/svg+xml' }],
        },
      ],
      protocol_handlers: [{ protocol: 'web+airtelac', url: '/?action=%s' }],
    };
    const manifestBlob = new Blob(
      [JSON.stringify(dynamicManifest)],
      { type: 'application/manifest+json' }
    );
    const manifestBlobUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestBlobUrl;
    // NOTE: manifestBlobUrl is revoked in the single cleanup return below ↓

    // ─── SERVICE WORKER ───────────────────────────────────────────────────────
    // Only register on real deployed hosts — Figma preview iframes and localhost
    // dev servers return HTML for /sw.js (wrong MIME type), causing a
    // SecurityError. Safe to skip in those environments.
    const swHost = window.location.hostname;
    // Only skip SW in Figma iframe previews & local dev — NOT on real deployed
    // *.figma.site domains like airtelchampionsapp.figma.site
    const isPreviewEnv =
      swHost.includes('figmaiframepreview') ||
      (swHost.includes('figma.site') && window.self !== window.top) || // only iframed previews
      swHost === 'localhost' ||
      swHost === '127.0.0.1';

    if ('serviceWorker' in navigator && !isPreviewEnv) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[SW] ✅ Registered — scope:', reg.scope);
          reg.update();

          // ── #6 PERIODIC BACKGROUND SYNC ──────────────────────────────────
          // Registers hourly/30-min wake-ups so leaderboard & announcements
          // stay fresh even when the app is closed.
          if ('periodicSync' in reg) {
            (reg as any).periodicSync.register('refresh-leaderboard', {
              minInterval: 60 * 60 * 1000, // 1 hour
            }).then(() => console.log('[PeriodicSync] ✅ leaderboard registered'))
              .catch(() => console.log('[PeriodicSync] ℹ️ Permission pending'));

            (reg as any).periodicSync.register('refresh-announcements', {
              minInterval: 30 * 60 * 1000, // 30 min
            }).then(() => console.log('[PeriodicSync] ✅ announcements registered'))
              .catch(() => {});
          }
        })
        .catch((err) => console.warn('[SW] ❌ Registration failed:', err));

      // ── #5 BACKGROUND SYNC — message listener ────────────────────────────
      // The SW sends PROCESS_OFFLINE_QUEUE when connectivity is restored.
      // The SW sends PERIODIC_REFRESH when a periodic sync fires.
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, data } = event.data || {};

        if (type === 'PROCESS_OFFLINE_QUEUE') {
          console.log('[SW→App] 🔄 Processing offline queue after reconnect...');
          OfflineManager.syncQueue()
            .then(({ success, failed }) =>
              console.log(`[SW→App] ✅ Queue flushed — success:${success} failed:${failed}`)
            )
            .catch((err) => console.error('[SW→App] Queue flush error:', err));
        }

        if (type === 'PERIODIC_REFRESH') {
          console.log('[SW→App] ⏱️ Periodic refresh for:', data);
          window.dispatchEvent(
            new CustomEvent('pwa-periodic-refresh', { detail: { scope: data } })
          );
        }
      });

    } else if (isPreviewEnv) {
      console.log('[SW] ℹ️ Skipped — preview/dev environment, SW not needed here');
    }

    // ── PERIODIC SYNC CONSUMER ────────���─────────────────────────────────────
    // Listen for the CustomEvent dispatched when periodic sync fires
    const handlePeriodicRefresh = (e: any) => {
      const scope = e.detail?.scope;
      console.log('[App] Periodic refresh received for:', scope);
      if (scope === 'leaderboard') {
        // Dispatch a window event that the leaderboard component can listen for
        window.dispatchEvent(new Event('refresh-leaderboard'));
      }
      if (scope === 'announcements') {
        window.dispatchEvent(new Event('refresh-announcements'));
      }
    };
    window.addEventListener('pwa-periodic-refresh', handlePeriodicRefresh);

    // Initialize session tracker
    initSessionTracker();
    
    // Initialize offline manager
    OfflineManager.setupListeners();
    console.log('[App] ✅ Offline manager initialized');
    
    // Show splash screen for 2.5 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem('tai_user');
    if (storedUser) {
      try {
        const parsedUserData = JSON.parse(storedUser);
        
        // Session expiry check for HBB users (24 hour TTL)
        const isHBBUser = ['hbb_agent','hbb_installer','hbb_dse','hbb_hq','hbb_hq_admin'].includes(parsedUserData.role);
        const loginTimestamp = parsedUserData._loginAt || 0;
        const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours
        
        if (isHBBUser && loginTimestamp && (Date.now() - loginTimestamp > SESSION_TTL)) {
          console.log('⏰ HBB session expired, logging out');
          localStorage.removeItem('tai_user');
          clearHBBSession();
        } else {
          setIsAuthenticated(true);
          setUser(parsedUserData);
          setUserData(parsedUserData);
          
          // Update activity timestamp for existing session
          if (parsedUserData.id) {
            updateUserActivity(parsedUserData.id);
          }
          
          console.log('✅ User loaded from localStorage:', parsedUserData.full_name, parsedUserData.role);
          
          // Initialize PWA activity tracking
          initActivityTracking(parsedUserData.id, parsedUserData.full_name, parsedUserData.role);
        }
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('tai_user');
      }
    }
    setLoading(false);

    return () => {
      clearTimeout(splashTimer);
      URL.revokeObjectURL(manifestBlobUrl);
      window.removeEventListener('pwa-periodic-refresh', handlePeriodicRefresh);
    };
  }, []);

  // Auto-setup database on first load (runs once)
  // ✅ DISABLED: Database setup SQL has been run manually in Supabase
  // No need for automatic checks since kv_store_28f2f653 table is already configured
  useEffect(() => {
    console.log('[App] ✅ Database setup completed manually - skipping automatic check');
    setDatabaseError(null);
    setShowDatabaseSetup(false);
  }, []);

  // Listen for changes to localStorage (e.g., profile picture updates)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem('tai_user');
      if (storedUser) {
        try {
          const parsedUserData = JSON.parse(storedUser);
          setUserData(parsedUserData);
          console.log('✅ [App] UserData refreshed from localStorage:', parsedUserData.full_name);
        } catch (err) {
          console.error('Failed to parse stored user on change:', err);
        }
      }
    };

    // Listen to custom profilePictureUpdated event
    const handleProfilePictureUpdate = (event: any) => {
      const storedUser = localStorage.getItem('tai_user');
      if (storedUser) {
        try {
          const parsedUserData = JSON.parse(storedUser);
          setUserData(parsedUserData);
          console.log('✅ [App] Profile picture updated from custom event:', event.detail);
        } catch (err) {
          console.error('Failed to parse stored user:', err);
        }
      }
    };

    // Listen to storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Listen to custom profilePictureUpdated event (for same-tab updates)
    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate);
    };
  }, []); // ← was [userData], causing re-render cascade

  const handleLogout = useCallback(async () => {
    // Track user logout (OLD + NEW systems)
    if (userData?.id) {
      trackUserLogout(userData.id, false); // Keep session for analytics (old system)
      await trackLogout(); // Track in new analytics system
      logPWAAction(ACTION_TYPES.LOGOUT);
      clearActivityUser();
    }
    
    // Clear HBB session
    clearHBBSession();
    
    localStorage.removeItem('tai_user');
    setIsAuthenticated(false);
    setUser(null);
    setUserData(null);
  }, [userData?.id]);

  // Splash Screen - Full screen on mobile
  if (showSplash) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#ED1C24' }}>
        <div className="text-center animate-fade-in relative px-4">
          <img src={airtelChampionsLogo} alt="Airtel Champions" className="w-64 h-64 mx-auto relative object-contain" style={{ clipPath: 'inset(4px)' }} />
        </div>
      </div>
    );
  }

  // ── Promoter Team Lead session ──────────────────────────────────────────────
  if (isTLAuthenticated) {
    return (
      <MobileContainer>
        <PromoterTeamLeadDashboard
          onLogout={() => {
            clearTLSession();
            setIsTLAuthenticated(false);
          }}
        />
      </MobileContainer>
    );
  }

  // Show database setup instructions if there's a database error
  if (showDatabaseSetup && databaseError) {
    return (
      <DatabaseSetupInstructions 
        error={databaseError}
        onDismiss={() => setShowDatabaseSetup(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-0 md:p-4 overflow-hidden">
        <div className="w-full h-auto md:max-w-[428px] bg-white md:rounded-3xl md:shadow-2xl p-8">
          <div className="text-center">
            <img src={airtelChampionsLogo} alt="Airtel Champions" className="w-32 h-32 mx-auto mb-4 object-contain" />
            <div className="w-16 h-16 border-4 border-[#E60000] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Airtel Champions...</p>
          </div>
        </div>
      </div>
    );
  }

  // MobileContainer is now defined OUTSIDE App (see above) for stable identity

  if (isAuthenticated) {
    // Role-based routing
    const userRole = user?.role || userData?.role;
    
    // Debug logging moved to useEffect to avoid running on every render

    // Route to appropriate dashboard based on role
    if (userRole === 'zonal_sales_manager') {
      return (
        <MobileContainer>
          <ZoneCommanderDashboard user={user} userData={userData} onLogout={handleLogout} />
        </MobileContainer>
      );
    }

    if (userRole === 'zonal_business_manager') {
      return (
        <MobileContainer>
          <ZoneBusinessLeadDashboard user={user} userData={userData} onLogout={handleLogout} />
        </MobileContainer>
      );
    }

    if (userRole === 'hq_staff' || userRole === 'hq_command_center') {
      return (
        <MobileContainer>
          <HQDashboard user={user} userData={userData} onLogout={handleLogout} />
        </MobileContainer>
      );
    }

    // Developer Dashboard - Check for Christopher or developer role
    if (userRole === 'developer' || 
        userData?.full_name?.toLowerCase().includes('christopher') ||
        userData?.employee_id === 'DEV001' ||
        user?.full_name?.toLowerCase().includes('christopher')) {
      return (
        <MobileContainer>
          <DeveloperDashboard user={user} userData={userData} onLogout={handleLogout} />
        </MobileContainer>
      );
    }

    if (userRole === 'director') {
      return (
        <MobileContainer>
          <DirectorDashboardV2 user={user} userData={userData} onLogout={handleLogout} />
        </MobileContainer>
      );
    }

    // HBB CRM Roles
    if (userRole === 'hbb_agent') {
      // Only whitelisted agents (from agents_HBB table) get full CRM; self-signup customers get limited view
      const isWhitelistedAgent = userData?.source_table === 'agents_HBB';
      return (
        <MobileContainer>
          <HBBAgentDashboard
            user={user}
            userData={isWhitelistedAgent ? userData : { ...userData, _customerOnly: true }}
            onLogout={handleLogout}
            onBackToMainMenu={() => {
              // Clear HBB session and return to main app
              clearHBBSession();
              // Force a re-render to go back to role selection/main menu
              setUser(null);
              setUserData(null);
              localStorage.removeItem('tai_user');
              localStorage.removeItem('tai_userData');
            }}
          />
        </MobileContainer>
      );
    }

    if (userRole === 'hbb_installer') {
      return (
        <MobileContainer>
          <HBBInstallerDashboard user={user} userData={userData} onLogout={handleLogout} />
        </MobileContainer>
      );
    }

    if (userRole === 'hbb_dse') {
      return (
        <MobileContainer>
          <DSEDashboard 
            user={user} 
            userData={userData} 
            onLogout={handleLogout}
            onBackToMainMenu={() => {
              // Clear HBB session and return to main app
              clearHBBSession();
              // Force a re-render to go back to role selection/main menu
              setUser(null);
              setUserData(null);
              localStorage.removeItem('tai_user');
              localStorage.removeItem('tai_userData');
            }}
          />
        </MobileContainer>
      );
    }

    if (userRole === 'hbb_hq' || userRole === 'hbb_hq_admin') {
      // HQ dashboard is full-width (laptop-optimized), no MobileContainer
      return (
        <HBBHQDashboard
          user={user}
          userData={userData}
          onLogout={() => {
            clearHBBSession();
            setUser(null);
            setUserData(null);
            localStorage.removeItem('tai_user');
            localStorage.removeItem('tai_userData');
          }}
        />
      );
    }

    // Default: SE view
    return (
      <MobileContainer>
        <HomeScreen user={user} onLogout={handleLogout} initialTab={initialTabRef.current} />
        {showAppTour && (
          <GuidedTour
            type="app"
            onComplete={() => setShowAppTour(false)}
            onSkipAll={() => setShowAppTour(false)}
          />
        )}
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      {showClientTracker && clientTrackerData ? (
        <ClientOrderTracker
          jobId={clientTrackerData.jobId}
          customerName={clientTrackerData.customerName}
          customerPhone={clientTrackerData.customerPhone}
          onBackToHome={() => {
            setShowClientTracker(false);
            setShowClientHome(true);
          }}
          onLogout={() => {
            setShowClientTracker(false);
            setClientTrackerData(null);
            setShowClientHome(false);
            setShowSignup(false);
          }}
        />
      ) : showSignup ? (
        <SignupScreen
          onBackToLogin={() => setShowSignup(false)}
          onBackToHome={() => {
            setShowSignup(false);
          }}
          isFromClientHome={showClientHome}
          onSignupSuccess={(newUser) => {
            // Check if this is a client signup (not an agent)
            if (newUser?.role === 'hbb_client' || !newUser?.role) {
              // Client signup - show client order tracker
              setClientTrackerData({
                jobId: newUser.jobId || newUser.id,
                customerName: newUser.customer_name || newUser.full_name,
                customerPhone: newUser.customer_phone || newUser.phone_number
              });
              setShowClientTracker(true);
              setShowSignup(false);
            } else {
              // Agent signup - route to HBB agent dashboard
              setUser(newUser);
              setUserData(newUser);
              setIsAuthenticated(true);
              setShowSignup(false);
              window.history.replaceState({}, '', '/?tab=hbb-my-order');
            }
          }}
        />
      ) : showSignup ? (
        <SignupScreen
          onBackToLogin={() => setShowSignup(false)}
          onBackToHome={() => {
            setShowSignup(false);
          }}
          isFromClientHome={showClientHome}
          onSignupSuccess={(newUser) => {
            // Check if this is a client signup (not an agent)
            if (newUser?.role === 'hbb_client' || !newUser?.role) {
              // Client signup - show client order tracker
              setClientTrackerData({
                jobId: newUser.jobId || newUser.id,
                customerName: newUser.customer_name || newUser.full_name,
                customerPhone: newUser.customer_phone || newUser.phone_number
              });
              setShowClientTracker(true);
              setShowSignup(false);
            } else {
              // Agent signup - route to HBB agent dashboard
              setUser(newUser);
              setUserData(newUser);
              setIsAuthenticated(true);
              setShowSignup(false);
              window.history.replaceState({}, '', '/?tab=hbb-my-order');
            }
          }}
        />
      ) : showClientHome && clientTrackerData ? (
        <div className="w-full max-w-md mx-auto h-full bg-gray-50 flex flex-col">
          {/* Header */}
          <div className="bg-white shadow-sm px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">Home</h1>
              <button
                onClick={() => {
                  setShowClientHome(false);
                  setClientTrackerData(null);
                  setShowSignup(false);
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Welcome Section */}
          <div className="px-4 py-6">
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-1">Welcome, {clientTrackerData.customerName}</h2>
              <p className="text-red-100">Manage your Airtel Home Broadband</p>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="px-4 space-y-3">
            <button
              onClick={() => {
                setShowClientHome(false);
                setShowClientTracker(true);
              }}
              className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Track My Order</h3>
                <p className="text-sm text-gray-500">View your installation progress</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button
              onClick={() => {
                setShowSignup(true);
              }}
              className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Book New Installation</h3>
                <p className="text-sm text-gray-500">Schedule a new broadband setup</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          {/* Support Section */}
          <div className="px-4 mt-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Need Help?</h3>
              <a 
                href="tel:0733100100" 
                className="flex items-center gap-3 text-gray-600 hover:text-red-600"
              >
                <Phone className="w-5 h-5" />
                <span>Call Support: 0733 100 100</span>
              </a>
            </div>
          </div>
        </div>
      ) : showSignup ? (
        <SignupScreen
          onBackToLogin={() => setShowSignup(false)}
          onBackToHome={() => {
            setShowSignup(false);
          }}
          isFromClientHome={showClientHome}
          onSignupSuccess={(newUser) => {
            // Check if this is a client signup (not an agent)
            if (newUser?.role === 'hbb_client' || !newUser?.role) {
              // Client signup - show client order tracker
              setClientTrackerData({
                jobId: newUser.jobId || newUser.id,
                customerName: newUser.customer_name || newUser.full_name,
                customerPhone: newUser.customer_phone || newUser.phone_number
              });
              setShowClientTracker(true);
              setShowSignup(false);
            } else {
              // Agent signup - route to HBB agent dashboard
              setUser(newUser);
              setUserData(newUser);
              setIsAuthenticated(true);
              setShowSignup(false);
              window.history.replaceState({}, '', '/?tab=hbb-my-order');
            }
          }}
        />
      ) : (
        <LoginPage
          onShowSignup={() => setShowSignup(true)}
          setUser={setUser}
          setUserData={setUserData}
          setIsAuthenticated={setIsAuthenticated}
        />
      )}
    </MobileContainer>
  );
}

function LoginScreen({ onShowSignup, setUser, setUserData, setIsAuthenticated }: { onShowSignup: () => void; setUser: (user: any) => void; setUserData: (data: any) => void; setIsAuthenticated: (auth: boolean) => void }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelpContact, setShowHelpContact] = useState(false);

  // 🛡️ Error Boundary for UpdateManager to prevent crashes if DB table missing
  // This ensures the app still works even if the SQL migration hasn't been run
  useEffect(() => {
    const suppressMissingTableError = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('app_versions')) {
        console.warn('⚠️ App Update check failed: app_versions table missing. Skipping check.');
        event.preventDefault(); // Prevent crash
      }
    };
    window.addEventListener('unhandledrejection', suppressMissingTableError);
    return () => window.removeEventListener('unhandledrejection', suppressMissingTableError);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Normalize phone number to 9 digits (remove spaces, country codes, etc.)
      let normalizedPhone = phoneNumber.trim().replace(/[\s\-\(\)]/g, ''); // Remove spaces, dashes, parentheses
      
      // Remove +254 or 254 prefix
      if (normalizedPhone.startsWith('+254')) {
        normalizedPhone = normalizedPhone.substring(4);
      } else if (normalizedPhone.startsWith('254')) {
        normalizedPhone = normalizedPhone.substring(3);
      } else if (normalizedPhone.startsWith('0')) {
        normalizedPhone = normalizedPhone.substring(1);
      }
      
      console.log('📱 Normalized phone:', normalizedPhone);

      // Try RPC function first
      try {
        const { data, error } = await supabase.rpc('se_login', {
          input_phone: normalizedPhone,
          input_pin: pin || ''
        });

        if (!error && data?.success) {
          // RPC login successful
          localStorage.setItem('tai_user', JSON.stringify(sanitizeUserForStorage(data.user)));
          console.log('✅ RPC Login successful:', data.user);
          
          // Track user session (OLD system - keep for backward compatibility)
          trackUserLogin(data.user.id, data.user.full_name, data.user.role);
          
          // Track login in NEW analytics system
          await trackLogin(data.user.id);
          
          // Initialize PWA activity tracking
          initActivityTracking(data.user.id, data.user.full_name, data.user.role);
          logPWAAction(ACTION_TYPES.LOGIN, { method: 'phone_pin' });
          
          // Update last_login_at in app_users
          try {
            await supabase
              .from('app_users')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', data.user.id);
          } catch (e) { console.warn('Update last_login_at failed', e); }
          
          setUser(data.user);
          setUserData(data.user);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      } catch (rpcError) {
        console.log('⚠️ RPC login failed, trying direct query...');
      }

      // Fallback: Direct database query — exact match only (no fuzzy)
      // Try the 4 deterministic phone formats derived from user input
      const possibleFormats = [
        normalizedPhone,                    // 762555550
        '0' + normalizedPhone,              // 0762555550
        '+254' + normalizedPhone,           // +254762555550
        '254' + normalizedPhone             // 254762555550
      ];

      console.log('🔍 Searching for phone in formats:', possibleFormats);

      const { data: users, error: queryError } = await supabase
        .from('app_users')
        .select(SAFE_USER_FIELDS)
        .in('phone_number', possibleFormats)
        .limit(1);

      if (queryError) {
        console.error('Query Error:', queryError);
        throw new Error(queryError.message);
      }

      if (!users || users.length === 0) {
        console.log('⚠️ No exact match found for phone formats:', possibleFormats);
        
        // Also try employee_id as a last resort (exact match only)
        const { data: empUsers } = await supabase
          .from('app_users')
          .select(SAFE_USER_FIELDS)
          .eq('employee_id', phoneNumber.trim())
          .limit(1);
        
        if (empUsers && empUsers.length > 0) {
          const foundUser = empUsers[0];
          const enteredPin = pin || '';
          const storedPin = foundUser.pin || '1234';
          
          if (enteredPin !== storedPin) {
            throw new Error('Incorrect PIN. Please try again.');
          }
          
          // Store safe user data (no sensitive fields leaked)
          localStorage.setItem('tai_user', JSON.stringify(sanitizeUserForStorage(foundUser)));
          console.log('Login successful via employee ID:', foundUser.full_name);
          
          trackUserLogin(foundUser.id, foundUser.full_name, foundUser.role);
          await trackLogin(foundUser.id);
          
          // Initialize PWA activity tracking
          initActivityTracking(foundUser.id, foundUser.full_name, foundUser.role);
          logPWAAction(ACTION_TYPES.LOGIN, { method: 'employee_id' });
          
          try {
            await supabase
              .from('app_users')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', foundUser.id);
          } catch (e) { console.warn('Update last_login_at failed', e); }
          
          setUser(foundUser);
          setUserData(foundUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // 3. Not in app_users — try HBB tables (agents_HBB / installers_HBB)
        console.log('🔄 Not found in app_users, trying HBB login (agents_HBB / installers_HBB)...');
        try {
          const hbbUser = await hbbLogin(phoneNumber.trim(), pin || '');
          if (hbbUser && hbbUser.role) {
            console.log(`✅ HBB login successful: ${hbbUser.full_name} (${hbbUser.role}) from ${hbbUser.source_table}`);
            
            // Store HBB user in localStorage with consistent shape
            const hbbUserData = {
              id: hbbUser.id,
              full_name: hbbUser.full_name,
              phone_number: hbbUser.phone_number,
              role: hbbUser.role,
              town_id: hbbUser.town_id,
              status: hbbUser.status,
              source_table: hbbUser.source_table,
              max_jobs_per_day: hbbUser.max_jobs_per_day,
              _loginAt: Date.now(), // Session expiry tracking
            };
            
            localStorage.setItem('tai_user', JSON.stringify(hbbUserData));
            
            setUser(hbbUserData);
            setUserData(hbbUserData);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        } catch (hbbErr: any) {
          console.log('��️ HBB login also failed:', hbbErr.message);
        }
        
        throw new Error('Phone number not found. Please check and try again.');
      }

      const user = users[0];

      // PIN validation - ALWAYS REQUIRED
      const enteredPin = pin || '';
      const storedPin = user.pin || '1234';
      
      if (enteredPin !== storedPin) {
        throw new Error('Incorrect PIN. Please try again.');
      }

      // Store user data in localStorage (PIN stripped for security)
      localStorage.setItem('tai_user', JSON.stringify(sanitizeUserForStorage(user)));
      
      console.log('✅ Direct login successful:', user.full_name);
      console.log('📝 User name:', user.full_name);
      
      // Update app state immediately
      setUser(user);
      setUserData(user);
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-4">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-44 h-44 bg-gradient-to-br from-red-900 via-red-800 to-red-950 rounded-3xl flex items-center justify-center mx-auto shadow-lg overflow-hidden">
            <img src={airtelChampionsLogo} alt="Airtel Champions" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Form - SIMPLIFIED per board feedback */}
        <form onSubmit={handleLogin} className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number"
              className="w-full pl-12 pr-4 py-3.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-gray-400"
              style={{ color: '#111827' }}
              required
              autoFocus
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your PIN"
              maxLength={4}
              className="w-full pl-12 pr-4 py-3.5 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-gray-400"
              style={{ color: '#111827' }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 text-sm bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold tracking-wide"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              'SIGN IN'
            )}
          </button>
        </form>

        {/* Sign Up — immediately after Sign In */}
        <div className="mt-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px]">
              <span className="px-3 text-gray-400 uppercase tracking-widest font-medium" style={{ background: 'var(--theme-bg-page, #F3F4F6)' }}>Want to submit HBB leads?</span>
            </div>
          </div>
          <button
            onClick={onShowSignup}
            className="mt-3 w-full py-3.5 text-sm border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 active:scale-[0.98] transition-all font-semibold tracking-wide"
          >
            SIGN UP
          </button>
        </div>

        {/* Help link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowHelpContact(true)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors tracking-wide"
          >
            Need help signing in?
          </button>
        </div>

        {/* Help Contact Modal — Steve Jobs inspired */}
        {showHelpContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md" onClick={() => setShowHelpContact(false)}>
            <div 
              className="relative bg-white/95 w-[calc(100%-3rem)] max-w-sm rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
              style={{ boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25)' }}
            >
              {/* Minimal close */}
              <button 
                onClick={() => setShowHelpContact(false)} 
                className="absolute top-5 right-5 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ boxShadow: '0 8px 24px -4px rgba(220,38,38,0.4)' }}>
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-center text-lg font-semibold text-gray-900 tracking-tight">We're here to help</h3>
              <p className="text-center text-xs text-gray-400 mt-1.5 mb-6 leading-relaxed">Get assistance with signing in or<br/>creating your account</p>

              {/* Action buttons */}
              <div className="space-y-2.5">
                <a
                  href="tel:0785638462"
                  className="flex items-center gap-3 w-full py-3.5 px-5 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 active:scale-[0.98] transition-all font-medium text-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Call Support</div>
                    <div className="text-[11px] text-white/60">0785 638 462</div>
                  </div>
                </a>
                <a
                  href="https://wa.me/254785638462?text=Hello%2C%20I%20am%20reaching%20out%20for%20assistance%20with%20signing%20in%20or%20registering%20on%20the%20Airtel%20Champions%20platform.%20Kindly%20assist.%20Thank%20you."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full py-3.5 px-5 bg-green-600 text-white rounded-2xl hover:bg-green-700 active:scale-[0.98] transition-all font-medium text-sm"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">WhatsApp</div>
                    <div className="text-[11px] text-white/60">Send a message</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debug panels removed for production */}
    </div>
  );
}

// SignupScreen is now imported from './components/signup-screen'

function HomeScreen({ user, onLogout, initialTab }: { user: any; onLogout: () => void; initialTab?: string | null }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'home');
  const [programToOpen, setProgramToOpen] = useState<string | undefined>(undefined);
  const [userData, setUserData] = useState<any>(null);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [announcement, setAnnouncement] = useState<any>(null);
  const [showFullAnnouncement, setShowFullAnnouncement] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const [showDailyMissions, setShowDailyMissions] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showSubmissionsHistory, setShowSubmissionsHistory] = useState(false);
  const [showTodayLeaderboard, setShowTodayLeaderboard] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);
  const [showDirectorLine, setShowDirectorLine] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  
  // Van Debugger state
  const [showVanDebugger, setShowVanDebugger] = useState(false);

  // PWA Badging API — show unread count on app icon
  const { setBadge, clearBadge } = useBadge();

  // WebRTC Calling states
  const [showUserDirectory, setShowUserDirectory] = useState(false);
  const [showCallHistory, setShowCallHistory] = useState(false);
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  // Track what action to perform after mic permission is granted
  const pendingCallActionRef = React.useRef<'directory' | 'history' | null>(null);
  const [programs, setPrograms] = useState([
    { 
      id: 1, 
      name: 'Network Experience', 
      icon: '📶',
      submissions: 0,
      description: 'Capture network quality and customer experience data',
      color: 'bg-blue-50 border-blue-200 text-blue-600'
    },
    { 
      id: 2, 
      name: 'Competition Conversion', 
      icon: '🎯',
      submissions: 0,
      description: 'Document competitor customer conversions to Airtel',
      color: 'bg-green-50 border-green-200 text-green-600'
    },
    { 
      id: 3, 
      name: 'New Site Launch', 
      icon: '🚀',
      submissions: 0,
      description: 'Report new network site launches and coverage',
      color: 'bg-purple-50 border-purple-200 text-purple-600'
    },
    { 
      id: 4, 
      name: 'AMB Visitation', 
      icon: '🏢',
      submissions: 0,
      description: 'Track visits to Airtel Money Business locations',
      color: 'bg-orange-50 border-orange-200 text-orange-600'
    },
  ]);

  // Initialize WebRTC calling system
  const webrtc = useWebRTC({
    userId: user?.id || '',
    userName: user?.full_name || '',
  });

  // Load data once when user mounts (stable reference via user.id)
  const userIdRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    userIdRef.current = user.id;
    loadUserData();
    loadTopPerformers();
    loadUserPointsAndRank();
  }, [user?.id]);

  // Load announcements once userData is available (use a ref to run only once)
  const announcementsLoadedRef = React.useRef(false);
  useEffect(() => {
    if (userData && !announcementsLoadedRef.current) {
      announcementsLoadedRef.current = true;
      loadAnnouncements();
    }
  }, [userData]);

  // Android Back Button Handler
  useEffect(() => {
    console.log('[AndroidBackButton] 📱 Setting up Android back button listener in HomeScreen...');
    
    let listenerHandle: any = null;
    
    // Setup the listener
    const setupListener = async () => {
      try {
        if (!CapacitorApp) {
          console.log('[AndroidBackButton] Not running in Capacitor, skipping');
          return;
        }
        listenerHandle = await CapacitorApp.addListener('backButton', ({ canGoBack }: any) => {
          console.log('[AndroidBackButton] ⬅️ Back button pressed, canGoBack:', canGoBack);
          
          // Priority 1: Close any open modals first
          if (showTodayLeaderboard) {
            console.log('[AndroidBackButton] Closing today leaderboard modal');
            setShowTodayLeaderboard(false);
            return;
          }
          
          if (selectedUserProfile) {
            console.log('[AndroidBackButton] Closing user profile modal');
            setSelectedUserProfile(null);
            return;
          }
          
          if (showAnnouncementsModal) {
            console.log('[AndroidBackButton] Closing announcements modal');
            setShowAnnouncementsModal(false);
            return;
          }
          
          if (showCreateAnnouncementModal) {
            console.log('[AndroidBackButton] Closing create announcement modal');
            setShowCreateAnnouncementModal(false);
            return;
          }
          
          if (showDailyMissions) {
            console.log('[AndroidBackButton] Closing daily missions modal');
            setShowDailyMissions(false);
            return;
          }
          
          if (showBadges) {
            console.log('[AndroidBackButton] Closing badges modal');
            setShowBadges(false);
            return;
          }
          
          if (showSubmissionsHistory) {
            console.log('[AndroidBackButton] Closing submissions history modal');
            setShowSubmissionsHistory(false);
            return;
          }
          
          if (showProfileMenu) {
            console.log('[AndroidBackButton] Closing profile menu');
            setShowProfileMenu(false);
            return;
          }
          
          if (showDirectorLine) {
            console.log('[AndroidBackButton] Closing director line');
            setShowDirectorLine(false);
            return;
          }
          
          if (showUserDirectory) {
            console.log('[AndroidBackButton] Closing user directory');
            setShowUserDirectory(false);
            return;
          }
          
          if (showCallHistory) {
            console.log('[AndroidBackButton] Closing call history');
            setShowCallHistory(false);
            return;
          }
          
          if (showPermissionRequest) {
            console.log('[AndroidBackButton] Closing permission request');
            setShowPermissionRequest(false);
            return;
          }
          
          // Priority 2: Navigate back in tabs (if not on home tab)
          if (activeTab !== 'home') {
            console.log('[AndroidBackButton] Navigating to home tab from:', activeTab);
            setActiveTab('home');
            return;
          }
          
          // Priority 3: Exit app if on home tab with no modals open
          console.log('[AndroidBackButton] On home tab, exiting app');
          CapacitorApp?.exitApp();
        });
        console.log('[AndroidBackButton] ✅ Listener setup complete');
      } catch (error) {
        console.error('[AndroidBackButton] ❌ Error setting up listener:', error);
      }
    };
    
    setupListener();
    
    return () => {
      console.log('[AndroidBackButton] 🧹 Cleaning up back button listener');
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, [
    showTodayLeaderboard,
    selectedUserProfile,
    showAnnouncementsModal,
    showCreateAnnouncementModal,
    showDailyMissions,
    showBadges,
    showSubmissionsHistory,
    showProfileMenu,
    showDirectorLine,
    showUserDirectory,
    showCallHistory,
    showPermissionRequest,
    activeTab
  ]);

  // Set user online when component mounts - but request permissions first
  // Use refs to avoid re-running cleanup (goOffline) on every permission change
  const webrtcInitializedRef = React.useRef(false);
  useEffect(() => {
    if (!user?.id) return;
    
    // Don't auto-prompt for microphone on load — only request when user initiates a call
    if (webrtc.permissionStatus === 'granted' && !webrtcInitializedRef.current) {
      webrtcInitializedRef.current = true;
      webrtc.goOnline();
      console.log('[WebRTC] User set to online:', user.full_name);
    } else if (webrtc.permissionStatus === 'denied') {
      webrtcInitializedRef.current = true; // Don't keep prompting
      console.log('[WebRTC] User denied permission request');
    }

    return () => {
      if (webrtcInitializedRef.current) {
        webrtc.goOffline();
        console.log('[WebRTC] User set to offline');
      }
    };
  }, [user?.id, webrtc.permissionStatus]);

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')  // Changed from 'users' to 'app_users'
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserData(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadTopPerformers = async () => {
    try {
      console.log('[Top Performers] 🔥 Loading top performers for TODAY...');
      
      // Get today's date range (start of day to now)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      console.log('[Top Performers] 📅 Today starts at:', todayStart);
      
      // STEP 1: Get all Sales Executives
      const { data: allSEs, error: sesError } = await supabase
        .from('app_users')
        .select('id')
        .eq('role', 'sales_executive');
      
      if (sesError) {
        console.error('[Top Performers] ❌ Error loading SEs:', sesError);
        return;
      }
      
      if (!allSEs || allSEs.length === 0) {
        console.log('[Top Performers] ⚠️ No SEs found');
        setTopPerformers([]);
        return;
      }
      
      const seIdsSet = new Set(allSEs.map(se => se.id));
      console.log('[Top Performers] 👥 Found', seIdsSet.size, 'Sales Executives');
      
      // STEP 2: Get all submissions from today
      const { data: allSubmissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('user_id, points_awarded')
        .gte('created_at', todayStart);
      
      if (submissionsError) {
        console.error('[Top Performers] ❌ Error loading submissions:', submissionsError);
        return;
      }
      
      // STEP 3: Filter to only SE submissions
      const todaySubmissions = allSubmissions?.filter(sub => seIdsSet.has(sub.user_id)) || [];
      
      console.log('[Top Performers] ✅ Loaded', todaySubmissions.length, 'SE submissions from today (filtered from', allSubmissions?.length || 0, 'total)');
      
      // Calculate points per user for today
      const userPointsMap: Record<string, number> = {};
      todaySubmissions?.forEach(sub => {
        if (!userPointsMap[sub.user_id]) {
          userPointsMap[sub.user_id] = 0;
        }
        userPointsMap[sub.user_id] += sub.points_awarded || 0;
      });
      
      // Sort users by points (descending) and get top 3
      const sortedUsers = Object.entries(userPointsMap)
        .sort(([, pointsA], [, pointsB]) => pointsB - pointsA);
      
      console.log('[Top Performers] 📊 ALL users sorted by points:', sortedUsers.slice(0, 10).map(([id, pts]) => ({ id: id.substring(0, 8), points: pts })));
      
      const topUserIds = sortedUsers
        .slice(0, 3)
        .map(([userId, points]) => ({ userId, points }));
      
      console.log('[Top Performers] 🏆 Top 3 user IDs:', topUserIds.map(u => ({ id: u.userId.substring(0, 8), points: u.points })));
      
      if (topUserIds.length === 0) {
        console.log('[Top Performers] ⚠️ No submissions today - showing empty list');
        setTopPerformers([]);
        return;
      }
      
      // Fetch user details for top performers
      const userIds = topUserIds.map(u => u.userId);
      const { data: users, error: usersError } = await supabase
        .from('app_users')
        .select('id, employee_id, full_name, zone')
        .in('id', userIds);
      
      if (usersError) {
        console.error('[Top Performers] ❌ Error loading user details:', usersError);
        return;
      }
      
      // Validate users data
      const validUsers = Array.isArray(users) ? users : [];
      
      // Combine user data with points and rank
      const performersWithRank = topUserIds.map((topUser, index) => {
        const user = validUsers.find(u => u.id === topUser.userId);
        if (!user) {
          console.warn('[Top Performers] ⚠️ User not found for ID:', topUser.userId.substring(0, 8));
          return null;
        }
        return {
          ...user,
          rank: index + 1,
          total_points: topUser.points,
          points_today: topUser.points
        };
      }).filter(p => p !== null); // Remove any null entries
      
      console.log('[Top Performers] ✅ Final top performers:', performersWithRank.map(p => ({ name: p.full_name, rank: p.rank, points: p.points_today })));
      setTopPerformers(performersWithRank);
    } catch (error) {
      console.error('[Top Performers] ❌ Error loading top performers:', error);
    }
  };

  // NEW: Load real-time user points and rank
  const loadUserPointsAndRank = async () => {
    try {
      if (!user?.id) return;

      // Get current user's actual points
      const { data: currentUserData, error: userError } = await supabase
        .from('app_users')
        .select('total_points')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user points:', userError);
        return;
      }

      const currentPoints = currentUserData?.total_points || 0;

      // Get all SEs with their points for ranking
      const { data: allSEs, error } = await supabase
        .from('app_users')
        .select('id, employee_id, total_points')
        .eq('role', 'sales_executive')
        .order('total_points', { ascending: false });

      if (error) {
        console.error('Error fetching SE rankings:', error);
        return;
      }

      // Find current user's rank based on points
      const userIndex = allSEs?.findIndex(se => se.id === user.id);
      const currentRank = userIndex !== -1 ? userIndex + 1 : '--';

      // Update userData with real-time rank and points
      setUserData(prev => ({
        ...prev,
        rank: currentRank,
        total_points: currentPoints
      }));

      // Also update localStorage so points persist
      const storedUser = localStorage.getItem('tai_user');
      if (storedUser) {
        const userObj = JSON.parse(storedUser);
        userObj.total_points = currentPoints;
        localStorage.setItem('tai_user', JSON.stringify(userObj));
      }

      console.log('✅ Updated user rank:', currentRank, 'points:', currentPoints);
    } catch (error) {
      console.error('Error loading user points and rank:', error);
    }
  };

  // Refresh both leaderboard and user stats
  const refreshAllStats = async () => {
    await Promise.all([
      loadTopPerformers(),
      loadUserPointsAndRank()
    ]);
  };

  const loadAnnouncements = async () => {
    try {
      if (!userData) return;
      
      console.log('[HomeScreen] ✅ Loading announcements from localStorage for role:', userData.role);
      
      // Use the localStorage-based getAnnouncements function
      const { data, error } = await getAnnouncements();

      if (error) {
        console.error('[HomeScreen] ❌ Error loading announcements:', error);
        return;
      }

      console.log('[HomeScreen] ✅ Raw announcements loaded:', data?.length || 0);

      // Validate and filter announcements by target role
      const validData = Array.isArray(data) ? data : [];
      const filteredAnnouncements = validData.filter((ann: any) => {
        const targetRoles = Array.isArray(ann.target_roles) ? ann.target_roles : [];
        return targetRoles.includes(userData.role) || targetRoles.includes('all');
      });

      console.log('[HomeScreen] ✅ Filtered announcements for role:', filteredAnnouncements.length);

      // Add is_read flag for each announcement
      const announcementsWithReadStatus = filteredAnnouncements.map((announcement: any) => {
        const readBy = Array.isArray(announcement.read_by) ? announcement.read_by : [];
        return {
          ...announcement,
          is_read: readBy.includes(userData.id),
          read_by: readBy
        };
      });

      setAnnouncements(announcementsWithReadStatus);
      
      // Count unread and update PWA badge
      const unread = announcementsWithReadStatus.filter((a: any) => !a.is_read).length;
      setUnreadAnnouncementsCount(unread);
      if (unread > 0) { setBadge(unread); } else { clearBadge(); }
      
      console.log('[HomeScreen] ✅ Total announcements:', announcementsWithReadStatus.length, '| Unread:', unread);
    } catch (error) {
      console.error('[HomeScreen] ❌ Error loading announcements:', error);
    }
  };

  const markAnnouncementAsRead = async (announcementId: string) => {
    try {
      if (!userData) return;

      console.log('[HomeScreen] ✅ Marking announcement as read (localStorage):', announcementId);

      // Load all announcements from localStorage
      const storedData = localStorage.getItem('tai_announcements') || '[]';
      const allAnnouncements = JSON.parse(storedData);
      
      // Validate and find/update the announcement
      const validAnnouncements = Array.isArray(allAnnouncements) ? allAnnouncements : [];
      const updatedAnnouncements = validAnnouncements.map((ann: any) => {
        if (ann.id === announcementId) {
          const readBy = Array.isArray(ann.read_by) ? ann.read_by : [];
          if (!readBy.includes(userData.id)) {
            readBy.push(userData.id);
          }
          return { ...ann, read_by: readBy };
        }
        return ann;
      });

      // Save back to localStorage
      localStorage.setItem('tai_announcements', JSON.stringify(updatedAnnouncements));

      // Update local state
      setAnnouncements(announcements.map(a => 
        a.id === announcementId ? { ...a, is_read: true } : a
      ));
      setUnreadAnnouncementsCount(prev => Math.max(0, prev - 1));

      console.log('[HomeScreen] ✅ Announcement marked as read successfully');
    } catch (error) {
      console.error('[HomeScreen] ❌ Error marking announcement as read:', error);
    }
  };

  // Use the onLogout prop passed from parent App component

  const handleProgramClick = (program: any) => {
    setActiveTab('programs');
  };

  const handleViewAllLeaderboard = () => {
    setActiveTab('leaderboard');
  };

  const handleTopPerformerClick = (performer: any) => {
    // Only set the profile if performer has valid data
    if (performer && (performer.id || performer.employee_id)) {
      setSelectedUserProfile(performer);
    } else {
      console.error('[handleTopPerformerClick] Invalid performer data:', performer);
    }
  };

  const userName = user?.full_name || userData?.full_name || user?.user_metadata?.full_name || 'Sales Executive';
  const firstName = userName.split(' ')[0];
  const userRank = userData?.rank || user?.rank || '--'; // Use userData first for real-time rank
  const userZone = user?.zone || userData?.zone || 'N/A';
  const userInitial = userName.substring(0, 1).toUpperCase();

  // Helper function for time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getTimeEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '';
    return '🌙';
  };

  // Render different tabs
  if (activeTab === 'feed' || activeTab === 'explore') {
    return <SocialFeed user={user} userData={userData} onBack={() => setActiveTab('home')} />;
  }

  if (activeTab === 'leaderboard') {
    return <LeaderboardScreen key={activeTab} onBack={() => setActiveTab('home')} onLogout={onLogout} userData={userData} onUserClick={handleTopPerformerClick} />;
  }

  if (activeTab === 'hall-of-fame') {
    return <HallOfFameScreen key={activeTab} onBack={() => setActiveTab('home')} userData={userData} />;
  }

  if (activeTab === 'research') {
    return <ResearchPaperPlanner />;
  }

  if (activeTab === 'profile') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-page, #F9FAFB)' }}>
        <UserProfileModal
          userId={userData?.id}
          currentUser={userData}
          isOwnProfile={true}
          onClose={() => setActiveTab('home')}
        />
      </div>
    );
  }

  if (activeTab === 'submissions') {
    return <SubmissionsScreen onBack={() => setActiveTab('home')} />;
  }

  if (activeTab === 'programs') {
    console.log('[App] 🎬 Rendering Programs tab with initialProgramId:', programToOpen);
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-page, #F9FAFB)' }}>
        <ProgramsListFoldersApp 
          onBack={() => {
            console.log('[App] ⬅️ Going back, clearing programToOpen');
            setProgramToOpen(undefined);
            setActiveTab('home');
          }}
          onPointsUpdated={refreshAllStats}
          initialProgramId={programToOpen}
        />
        
        {/* Bottom Navigation - 5 Tabs */}
        <div className="px-2 py-3 flex-shrink-0 transition-colors duration-300" style={{ backgroundColor: 'var(--theme-nav-bg, #FFFFFF)', borderTop: '1px solid var(--theme-border, #E5E7EB)' }}>
          <div className="flex items-center justify-around">
            <NavButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
              active={false}
              onClick={() => setActiveTab('home')}
            />
            <NavButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              active={false}
              onClick={() => setActiveTab('leaderboard')}
            />
            <NavButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              }
              active={false}
              onClick={() => setActiveTab('hall-of-fame')}
            />
            <NavButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              active={false}
              onClick={() => setActiveTab('explore')}
            />
            <NavButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              active={false}
              onClick={() => setActiveTab('profile')}
            />
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <>
        <SettingsScreen 
          onBack={() => setActiveTab('home')} 
          user={user} 
          userData={userData} 
          onOpenDebugger={() => setShowVanDebugger(true)}
        />
        {showVanDebugger && (
          <VanDataViewer onClose={() => setShowVanDebugger(false)} />
        )}
      </>
    );
  }

  if (activeTab === 'explore') {
    return (
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--theme-bg-page, #F9FAFB)' }}>
        <ExploreFeed currentUser={userData} onUserClick={handleTopPerformerClick} />
        {/* Bottom Navigation */}
        <div className="px-6 py-3 flex-shrink-0 transition-colors duration-300" style={{ backgroundColor: 'var(--theme-nav-bg, #FFFFFF)', borderTop: '1px solid var(--theme-border, #E5E7EB)' }}>
          <div className="flex items-center justify-around">
            <NavButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
              active={false}
              onClick={() => setActiveTab('home')}
            />
            <NavButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              active={true}
              onClick={() => setActiveTab('explore')}
            />
            <NavButton
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
              active={false}
              onClick={() => setActiveTab('profile')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--theme-bg-page, #F9FAFB)' }}>
      {/* Header - Hello John */}
      <div className="px-6 py-5 transition-colors duration-300" style={{ backgroundColor: 'var(--theme-bg-card, #FFFFFF)', borderBottom: '1px solid var(--theme-border, #E5E7EB)' }}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Animated greeting */}
            <h2 className="text-3xl mb-2 animate-slide-in-left" style={{ color: 'var(--theme-text-primary, #111827)' }}>
              {getGreeting()}, {firstName} {getTimeEmoji()}
            </h2>
            {/* Animated rank and points badge */}
            <div className="animate-slide-in-right animation-delay-100 flex items-center gap-3">
              {/* Rank Badge - Click to view leaderboard */}
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="inline-flex items-center px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
                style={{ backgroundColor: 'var(--theme-primary-light, #FEF2F2)', border: '1px solid var(--theme-border, #E5E7EB)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--theme-primary, #E60000)' }}>🦅 SE #{userRank}</span>
              </button>
              {/* Points Badge - Click to view submissions history */}
              <button
                onClick={() => setShowSubmissionsHistory(true)}
                className="inline-flex items-center px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
                style={{ backgroundColor: 'var(--theme-accent-light, #FEF3C7)', border: '1px solid var(--theme-border, #E5E7EB)' }}
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--theme-accent, #F59E0B)' }}>⭐ {userData?.total_points || 0} pts</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2" data-tour="comms-bar">
            {/* Director Messages Icon - ONLY for SEs */}
            {userData?.role === 'sales_executive' && (
              <button
                onClick={() => setShowDirectorLine(true)}
                className="relative w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 hover:bg-orange-200 transition-colors"
                title="Message Director"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>
            )}

            {/* Call Icon - Open User Directory */}
            <button
              onClick={() => {
                if (webrtc.permissionStatus === 'unknown') {
                  pendingCallActionRef.current = 'directory';
                  setShowPermissionRequest(true);
                } else {
                  setShowUserDirectory(true);
                }
              }}
              className="relative w-11 h-11 bg-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
              title="Make a Call"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {/* Online Status Indicator */}
              {webrtc.isOnline && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
              {/* Connection Mode Indicator - Yellow dot for polling */}
              {webrtc.connectionMode === 'polling' && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white" title="Polling Mode"></div>
              )}
            </button>

            {/* Call History Icon */}
            <button
              onClick={() => {
                if (webrtc.permissionStatus === 'unknown') {
                  pendingCallActionRef.current = 'history';
                  setShowPermissionRequest(true);
                } else {
                  setShowCallHistory(true);
                }
              }}
              className="relative w-11 h-11 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-200 transition-colors"
              title="Call History"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Announcements Icon */}
            <button
              onClick={() => setShowAnnouncementsModal(true)}
              className="relative w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              {unreadAnnouncementsCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center">
                  {unreadAnnouncementsCount}
                </div>
              )}
            </button>

            {/* Profile Icon with Dropdown */}
            <div className="relative">
              <button
                ref={profileButtonRef}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-colors"
                style={{ backgroundColor: 'var(--theme-primary, #E60000)', color: 'var(--theme-text-on-primary, #FFFFFF)' }}
              >
                {userInitial}
              </button>

              {/* Beautiful Dropdown Menu - Steve Jobs Style! */}
              {showProfileMenu && (
                <ProfileDropdown
                  userName={userName}
                  userInitial={userInitial}
                  userZone={userZone}
                  userData={userData}
                  anchorRef={profileButtonRef as React.RefObject<HTMLElement>}
                  onProfileClick={() => {
                    setShowProfileMenu(false);
                    setActiveTab('profile');
                  }}
                  onSettingsClick={() => {
                    setShowProfileMenu(false);
                    setActiveTab('settings');
                  }}
                  onLogout={onLogout}
                  onClose={() => setShowProfileMenu(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Top 3 SEs Section */}
        <div data-tour="top-performers" className="px-6 py-6 transition-colors duration-300" style={{ backgroundColor: 'var(--theme-bg-card, #FFFFFF)', borderBottom: '1px solid var(--theme-border, #E5E7EB)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg" style={{ color: 'var(--theme-text-primary, #111827)' }}>🏆 Top Performers Today</h3>
            <button
              onClick={handleViewAllLeaderboard}
              className="text-sm transition-colors flex items-center"
              style={{ color: 'var(--theme-primary, #E60000)' }}
            >
              View All
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex gap-4 justify-between">
            {topPerformers.length > 0 ? (
              topPerformers.map((performer, index) => (
                <button
                  key={`performer-${performer.employee_id || index}`}
                  onClick={() => handleTopPerformerClick(performer)}
                  className="flex-1 text-center transition-transform hover:scale-105 active:scale-95"
                >
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 text-white text-2xl shadow-lg ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                  }`}>
                    {performer?.full_name?.substring(0, 1) || 'U'}
                  </div>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--theme-text-primary, #111827)' }}>{performer?.full_name?.split(' ')[0] || 'User'}</p>
                  <p className="text-xs" style={{ color: 'var(--theme-text-secondary, #4B5563)' }}>Rank #{performer?.rank || '--'}</p>
                  <p className="text-xs font-bold" style={{ color: 'var(--theme-success, #059669)' }}>{performer?.points_today || 0} pts today</p>
                  {index === 0 && <p className="text-xs text-yellow-600">👑 #1</p>}
                </button>
              ))
            ) : (
              // Placeholder while loading
              [1, 2, 3].map((i) => (
                <div key={`loader-${i}`} className="flex-1 text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded mx-auto w-16 animate-pulse"></div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="px-6 py-4 space-y-3">
            {announcements.slice(0, 2).map((ann) => (
              <AnnouncementCard
                key={ann.id}
                announcement={ann}
                onMarkAsRead={markAnnouncementAsRead}
              />
            ))}
            {announcements.length > 2 && (
              <button
                onClick={() => setShowAnnouncementsModal(true)}
                className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                View {announcements.length - 2} more announcement{announcements.length - 2 > 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        {/* Programs Section */}
        <div data-tour="programs-activity" className="px-6 py-6">
          <ProgramsWidgetHome 
            onViewAll={() => {
              setProgramToOpen(undefined);
              setActiveTab('programs');
            }}
            onPointsUpdated={refreshAllStats}
            onProgramClick={(programId) => {
              console.log('[App] 🎯 Opening program from home widget:', programId);
              console.log('[App] 📋 Setting programToOpen state to:', programId);
              setProgramToOpen(programId);
              console.log('[App] 🔄 Switching to programs tab');
              setActiveTab('programs');
            }}
          />
        </div>
      </div>

      {/* Director Line Modal */}
      {showDirectorLine && (
        <DirectorLine
          user={user}
          userData={userData}
          onClose={() => setShowDirectorLine(false)}
        />
      )}

      {/* Announcements Modal */}
      {showAnnouncementsModal && (
        <AnnouncementsModal 
          onClose={() => setShowAnnouncementsModal(false)} 
          announcements={announcements}
          onMarkAsRead={markAnnouncementAsRead}
        />
      )}

      {/* Submissions History Modal */}
      {showSubmissionsHistory && (
        <SubmissionsHistoryModal
          userId={user.id}
          userName={user.full_name}
          totalPoints={userData?.total_points || 0}
          onClose={() => setShowSubmissionsHistory(false)}
        />
      )}

      {/* Daily Missions Modal */}
      {showDailyMissions && (
        <DailyMissions onClose={() => setShowDailyMissions(false)} />
      )}

      {/* Badges & Achievements Modal */}
      {showBadges && (
        <BadgesAchievements onClose={() => setShowBadges(false)} />
      )}

      {/* Today's Leaderboard Modal */}
      {showTodayLeaderboard && (
        <TodayLeaderboardModal onClose={() => setShowTodayLeaderboard(false)} />
      )}

      {/* Top Performer Profile Modal */}
      {selectedUserProfile && (
        <TopPerformerProfileModal 
          performer={selectedUserProfile} 
          onClose={() => setSelectedUserProfile(null)} 
        />
      )}

      {/* Floating Action Button (HQ/Director Only) */}
      {(userData?.role === 'director' || userData?.role === 'hq_staff' || userData?.role === 'hq_command_center') && (
        <button
          onClick={() => setShowCreateAnnouncementModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-red-600 to-orange-600 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:shadow-xl transition-all hover:scale-110 active:scale-95 z-30"
          title="Create Announcement"
        >
          📢
        </button>
      )}

      {/* Create Announcement Modal */}
      {showCreateAnnouncementModal && (
        <CreateAnnouncementModal
          isOpen={showCreateAnnouncementModal}
          onClose={() => {
            setShowCreateAnnouncementModal(false);
            loadAnnouncements(); // Reload announcements after creating
          }}
          userData={userData}
        />
      )}

      {/* ========== WebRTC Calling Modals ========== */}
      
      {/* Permission Request Modal */}
      {showPermissionRequest && (
        <PermissionRequestModal
          onGrant={async () => {
            const granted = await webrtc.requestPermissions();
            setShowPermissionRequest(false);
            if (granted) {
              await webrtc.goOnline();
              console.log('[WebRTC] ✅ Permissions granted, user is now online');
              // Proceed with the action that triggered the permission request
              if (pendingCallActionRef.current === 'directory') {
                setShowUserDirectory(true);
              } else if (pendingCallActionRef.current === 'history') {
                setShowCallHistory(true);
              }
            } else {
              console.log('[WebRTC] ❌ Permissions denied');
            }
            pendingCallActionRef.current = null;
          }}
          onDeny={() => {
            setShowPermissionRequest(false);
            pendingCallActionRef.current = null;
            console.log('[WebRTC] User denied permission request');
          }}
        />
      )}
      
      {/* Incoming Call Modal */}
      {webrtc.incomingCall && (
        <IncomingCallModal
          callerName={webrtc.incomingCall.caller.name}
          callerRole={webrtc.incomingCall.caller.role}
          callType={webrtc.incomingCall.session.call_type}
          onAccept={webrtc.answerCall}
          onReject={webrtc.rejectCall}
        />
      )}

      {/* Active Call Screen */}
      {webrtc.activeCall && (
        <ActiveCallScreen
          remoteName={webrtc.activeCall.remoteUser.name}
          remoteRole={webrtc.activeCall.remoteUser.role}
          localStream={webrtc.activeCall.localStream}
          remoteStream={webrtc.activeCall.remoteStream}
          callType={webrtc.activeCall.session.call_type}
          isMuted={webrtc.isMuted}
          isVideoEnabled={webrtc.isVideoEnabled}
          callStatus={webrtc.callStatus}
          onEndCall={() => webrtc.endCall('completed')}
          onToggleMute={webrtc.toggleMute}
          onToggleVideo={webrtc.toggleVideo}
        />
      )}

      {/* User Directory Modal */}
      {showUserDirectory && (
        <UserDirectory
          currentUserId={user.id}
          onClose={() => setShowUserDirectory(false)}
          onCallUser={async (userId, userName, callType) => {
            setShowUserDirectory(false);
            try {
              await webrtc.initiateCall(userId, userName, callType);
            } catch (err: any) {
              alert(err.message || 'Failed to initiate call');
            }
          }}
        />
      )}

      {/* Call History Modal */}
      {showCallHistory && (
        <CallHistory
          userId={user.id}
          onClose={() => setShowCallHistory(false)}
          onCallBack={async (userId, userName) => {
            setShowCallHistory(false);
            try {
              await webrtc.initiateCall(userId, userName, 'audio');
            } catch (err: any) {
              alert(err.message || 'Failed to call back');
            }
          }}
        />
      )}

      {/* Bottom Navigation - 5 Tabs */}
      <div data-tour="bottom-nav" className="px-2 py-3 flex-shrink-0 transition-colors duration-300" style={{ backgroundColor: 'var(--theme-nav-bg, #FFFFFF)', borderTop: '1px solid var(--theme-border, #E5E7EB)' }}>
        <div className="flex items-center justify-around">
          <NavButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            active={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
          <NavButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            active={activeTab === 'leaderboard'}
            onClick={() => setActiveTab('leaderboard')}
          />
          <NavButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            }
            active={activeTab === 'hall-of-fame'}
            onClick={() => setActiveTab('hall-of-fame')}
          />
          <NavButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            active={activeTab === 'explore'}
            onClick={() => setActiveTab('explore')}
          />
          <NavButton
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
        </div>
      </div>

      {/* Debug panel removed for production */}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className={`${color} border rounded-xl p-4 text-center`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-xl mb-1">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center py-2 transition-colors"
      style={{
        color: active
          ? 'var(--theme-nav-active, #E60000)'
          : 'var(--theme-nav-text, #9CA3AF)',
      }}
    >
      {icon}
    </button>
  );
}

function LeaderboardScreen({ onBack, onLogout, userData, onUserClick }: { onBack: () => void; onLogout: () => void; userData: any; onUserClick?: (user: any) => void }) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const { share, canShare } = useShare();
  const userRank = userData?.rank || 0;

  const handleShareRank = async () => {
    const name = userData?.full_name || 'I';
    const rank = leaderboard.findIndex(u => u.id === userData?.id || u.employee_id === userData?.employee_id) + 1;
    const points = userData?.total_points || 0;
    const rankText = rank > 0 ? `#${rank}` : 'the top';
    const text = `🏆 ${name} is ranked ${rankText} on the Airtel Champions leaderboard with ${points} points! Can you beat it?`;
    const appUrl = window.location.origin + '/?tab=leaderboard';
    const copied = await share({ title: 'Airtel Champions Leaderboard', text, url: appUrl });
    if (copied && !canShare) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  };
  
  // Filter states
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedZSM, setSelectedZSM] = useState('');
  const [zones, setZones] = useState<string[]>([]);
  const [zsms, setZSMs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Search by name
  
  // Compare states
  const [showCompare, setShowCompare] = useState(false);
  const [compareUser1, setCompareUser1] = useState<any>(null);
  const [compareUser2, setCompareUser2] = useState<any>(null);
  const [searchQuery1, setSearchQuery1] = useState('');
  const [searchQuery2, setSearchQuery2] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    filterLeaderboard();
  }, [selectedZone, selectedZSM, searchQuery, leaderboard]);

  // Cascading filter: When zone changes, update available ZSMs
  useEffect(() => {
    if (selectedZone) {
      // Filter ZSMs to only show those in the selected zone
      const zsmsInZone = [...new Set(
        leaderboard
          .filter(u => u.zone === selectedZone)
          .map(u => u.zsm)
          .filter(Boolean)
      )].sort();
      setZSMs(zsmsInZone);
      
      // Clear ZSM selection if it's not in the new zone
      if (selectedZSM && !zsmsInZone.includes(selectedZSM)) {
        setSelectedZSM('');
      }
    } else {
      // No zone selected, show all ZSMs
      const allZSMs = [...new Set(leaderboard.map(u => u.zsm).filter(Boolean))].sort();
      setZSMs(allZSMs);
    }
  }, [selectedZone, leaderboard]);

  const loadLeaderboard = async () => {
    try {
      // Get all SEs from app_users table with all needed columns
      const { data, error } = await supabase
        .from('app_users')
        .select('id, employee_id, full_name, zone, region, zsm, total_points')
        .eq('role', 'sales_executive')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('[LeaderboardScreen] Error loading SEs:', error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setLeaderboard([]);
        setFilteredLeaderboard([]);
        setLoading(false);
        return;
      }

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();

      // Get all submissions from today
      const { data: todaySubmissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('user_id, points_awarded')
        .gte('created_at', todayStart);

      if (submissionsError) {
        console.error('[LeaderboardScreen] Error loading submissions:', submissionsError);
      }

      // Calculate today's points per user
      const userPointsMap: Record<string, { points: number; count: number }> = {};
      if (todaySubmissions && todaySubmissions.length > 0) {
        todaySubmissions.forEach((sub: any) => {
          if (!userPointsMap[sub.user_id]) {
            userPointsMap[sub.user_id] = { points: 0, count: 0 };
          }
          userPointsMap[sub.user_id].points += sub.points_awarded || 0;
          userPointsMap[sub.user_id].count += 1;
        });
      }

      // Combine SE data with today's points
      const dataWithPoints = data.map((user: any) => ({
        ...user,
        points_today: userPointsMap[user.id]?.points || 0,
        submissions_today: userPointsMap[user.id]?.count || 0,
        total_points: user.total_points || 0,
        rank: 0
      }));

      // Sort by today's points (descending), then by name for ties
      dataWithPoints.sort((a: any, b: any) => {
        if (b.points_today !== a.points_today) {
          return b.points_today - a.points_today;
        }
        return a.full_name.localeCompare(b.full_name);
      });

      // Assign ranks
      dataWithPoints.forEach((user: any, index: number) => {
        user.rank = index + 1;
      });

      setLeaderboard(dataWithPoints);
      setFilteredLeaderboard(dataWithPoints);
        
      // Extract unique zones
      const uniqueZones = [...new Set(data.map((u: any) => u.zone).filter(Boolean))].sort();
      setZones(uniqueZones as string[]);
        
      // Extract all unique ZSMs
      const uniqueZSMs = [...new Set(data.map((u: any) => u.zsm).filter(Boolean))].sort();
      setZSMs(uniqueZSMs as string[]);

      setLoading(false);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLoading(false);
    }
  };

  const filterLeaderboard = () => {
    let filtered = [...leaderboard];

    // Filter by name search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedZone) {
      filtered = filtered.filter(user => user.zone === selectedZone);
    }

    if (selectedZSM) {
      filtered = filtered.filter(user => user.zsm === selectedZSM);
    }

    // Re-assign ranks based on filtered list position
    const filteredWithRank = filtered.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    setFilteredLeaderboard(filteredWithRank);
  };

  const clearFilters = () => {
    setSelectedZone('');
    setSelectedZSM('');
    setSearchQuery('');
    setShowFilters(false);
  };

  const getFilteredSearchResults = (query: string) => {
    if (!query) return [];
    return leaderboard.filter(user => 
      user.full_name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl">{"🏆"} Top Performers Today</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Keep screen on during presentations */}
            <WakeLockButton />
            {/* Push notifications toggle */}
            <PushNotificationBell userId={userData?.id} />
            {/* Share my rank button */}
            <button
              onClick={handleShareRank}
              title={canShare ? 'Share my rank' : 'Copy rank link'}
              className="px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all shadow-md flex items-center gap-2"
            >
              {shareCopied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
              <span className="hidden sm:inline">{shareCopied ? 'Copied!' : 'Share'}</span>
            </button>
            <button 
              onClick={() => setShowCompare(true)} 
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-4">
          {/* Search Bar */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {(selectedZone || selectedZSM) && (
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                  {(selectedZone ? 1 : 0) + (selectedZSM ? 1 : 0)}
                </span>
              )}
            </button>
            {(selectedZone || selectedZSM || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Zone</label>
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Zones</option>
                    {zones.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">ZSM</label>
                  <select
                    value={selectedZSM}
                    onChange={(e) => setSelectedZSM(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All ZSMs</option>
                    {zsms.map(zsm => (
                      <option key={zsm} value={zsm}>{zsm}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Summary */}
        {(selectedZone || selectedZSM) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedZone && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Zone: {selectedZone}
                <button onClick={() => setSelectedZone('')} className="hover:text-blue-900">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {selectedZSM && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                ZSM: {selectedZSM}
                <button onClick={() => setSelectedZSM('')} className="hover:text-green-900">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredLeaderboard.length} of {leaderboard.length} SEs
          {' '}({filteredLeaderboard.filter((u: any) => u.points_today > 0).length} active today)
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 mb-3 animate-pulse">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredLeaderboard.length > 0 ? (
          <div className="p-6 space-y-3">
            {filteredLeaderboard.map((user, index) => {
              const isInactive = user.points_today === 0;
              const isTopThree = !isInactive && index < 3;
              return (
              <div
                key={user.id}
                onClick={() => onUserClick && onUserClick(user)}
                className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                  isTopThree ? 'border-2 border-yellow-400' : ''
                } ${isInactive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg mr-3 ${
                      isInactive
                        ? 'bg-gray-300'
                        : index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                        ? 'bg-gray-400'
                        : index === 2
                        ? 'bg-orange-600'
                        : 'bg-blue-500'
                    }`}
                  >
                    {user.full_name.substring(0, 1)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{user.full_name}</h4>
                    <p className="text-xs text-gray-600">
                      {user.zone || 'No Zone'} {user.zsm && `• ${user.zsm}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">#{user.rank}</p>
                    <p className={`text-lg font-bold ${user.points_today > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {user.points_today || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.submissions_today || 0} today
                    </p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl mb-2">No SEs Found</h3>
              <p className="text-gray-600 text-sm mb-4">
                No sales executives match your filter criteria
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Compare Modal */}
      {showCompare && (
        <AdvancedCompare 
          onClose={() => setShowCompare(false)}
          allSEs={leaderboard}
        />
      )}

      {/* Old Compare Modal - DISABLED */}
      {false && showCompare && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl">Compare SEs</h3>
                  <p className="text-sm text-blue-100 mt-1">Select two sales executives to compare</p>
                </div>
                <button 
                  onClick={() => {
                    setShowCompare(false);
                    setCompareUser1(null);
                    setCompareUser2(null);
                    setSearchQuery1('');
                    setSearchQuery2('');
                  }} 
                  className="text-white hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!compareUser1 || !compareUser2 ? (
                <div>
                  {/* Instructions */}
                  <div className="text-center mb-6 pb-6 border-b border-gray-200">
                    <p className="text-gray-600">
                      {!compareUser1 && !compareUser2 ? 'Click on any SE below to start comparing' : 
                       !compareUser2 ? 'Click on another SE to compare with' : 
                       'Click on another SE to compare with'}
                    </p>
                  </div>

                  {/* Selected SEs Preview */}
                  {(compareUser1 || compareUser2) && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className={`p-4 rounded-lg border-2 ${compareUser1 ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-300 border-dashed'}`}>
                        {compareUser1 ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-blue-600 font-medium">First SE</span>
                              <button
                                onClick={() => setCompareUser1(null)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <h4 className="font-semibold">{compareUser1.full_name}</h4>
                            <p className="text-xs text-gray-600 mt-1">Rank #{compareUser1.rank} • {compareUser1.zone}</p>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">Select first SE</p>
                          </div>
                        )}
                      </div>
                      <div className={`p-4 rounded-lg border-2 ${compareUser2 ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300 border-dashed'}`}>
                        {compareUser2 ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-green-600 font-medium">Second SE</span>
                              <button
                                onClick={() => setCompareUser2(null)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <h4 className="font-semibold">{compareUser2.full_name}</h4>
                            <p className="text-xs text-gray-600 mt-1">Rank #{compareUser2.rank} • {compareUser2.zone}</p>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">Select second SE</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SE List - Simple Click to Select */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {leaderboard.map(user => {
                      const isSelected = compareUser1?.id === user.id || compareUser2?.id === user.id;
                      const isDisabled = isSelected;
                      
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            if (!isDisabled) {
                              if (!compareUser1) {
                                setCompareUser1(user);
                              } else if (!compareUser2) {
                                setCompareUser2(user);
                              }
                            }
                          }}
                          disabled={isDisabled}
                          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            isSelected 
                              ? compareUser1?.id === user.id 
                                ? 'bg-blue-50 border-blue-500 opacity-50 cursor-not-allowed' 
                                : 'bg-green-50 border-green-500 opacity-50 cursor-not-allowed'
                              : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm mr-3 ${
                              user.rank <= 3 
                                ? user.rank === 1 ? 'bg-yellow-500' : user.rank === 2 ? 'bg-gray-400' : 'bg-orange-600'
                                : 'bg-gray-300'
                            }`}>
                              {user.full_name.substring(0, 1)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{user.full_name}</h4>
                              <p className="text-xs text-gray-600">{user.zone} • {user.zsm}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">#{user.rank}</p>
                              <p className="text-xs text-gray-600">{user.total_points || 0} pts</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  {/* Comparison View */}
                  <div className="mb-6">
                    <button
                      onClick={() => {
                        setCompareUser1(null);
                        setCompareUser2(null);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Change selection
                    </button>
                    
                    {/* Side-by-Side Cards */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      {/* User 1 Card */}
                      <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-500">
                        <div className="text-center mb-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3 ${
                            compareUser1.rank === 1 ? 'bg-yellow-500' : 
                            compareUser1.rank === 2 ? 'bg-gray-400' : 
                            compareUser1.rank === 3 ? 'bg-orange-600' : 'bg-blue-600'
                          }`}>
                            {compareUser1.full_name.substring(0, 1)}
                          </div>
                          <h4 className="font-bold text-lg">{compareUser1.full_name}</h4>
                          <p className="text-sm text-gray-600">{compareUser1.employee_id}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Rank</p>
                            <p className="text-2xl font-bold text-blue-600">#{compareUser1.rank}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Total Points</p>
                            <p className="text-xl font-bold">{compareUser1.total_points || 0}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Zone</p>
                            <p className="font-semibold">{compareUser1.zone || 'N/A'}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">ZSM</p>
                            <p className="font-semibold">{compareUser1.zsm || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      {/* User 2 Card */}
                      <div className="bg-green-50 rounded-lg p-6 border-2 border-green-500">
                        <div className="text-center mb-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3 ${
                            compareUser2.rank === 1 ? 'bg-yellow-500' : 
                            compareUser2.rank === 2 ? 'bg-gray-400' : 
                            compareUser2.rank === 3 ? 'bg-orange-600' : 'bg-green-600'
                          }`}>
                            {compareUser2.full_name.substring(0, 1)}
                          </div>
                          <h4 className="font-bold text-lg">{compareUser2.full_name}</h4>
                          <p className="text-sm text-gray-600">{compareUser2.employee_id}</p>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Rank</p>
                            <p className="text-2xl font-bold text-green-600">#{compareUser2.rank}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Total Points</p>
                            <p className="text-xl font-bold">{compareUser2.total_points || 0}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Zone</p>
                            <p className="font-semibold">{compareUser2.zone || 'N/A'}</p>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">ZSM</p>
                            <p className="font-semibold">{compareUser2.zsm || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Stats */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                      <h4 className="text-xl font-bold mb-4 text-center">📊 Head-to-Head Analysis</h4>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {/* Rank Winner */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Better Rank</p>
                          <div className={`p-4 rounded-lg ${compareUser1.rank < compareUser2.rank ? 'bg-blue-100 border-2 border-blue-500' : 'bg-green-100 border-2 border-green-500'}`}>
                            <p className="font-bold">{compareUser1.rank < compareUser2.rank ? compareUser1.full_name.split(' ')[0] : compareUser2.full_name.split(' ')[0]}</p>
                            <p className="text-2xl">🏆</p>
                          </div>
                        </div>

                        {/* Rank Difference */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Rank Gap</p>
                          <div className="p-4 rounded-lg bg-white">
                            <p className="text-3xl font-bold text-purple-600">{Math.abs(compareUser1.rank - compareUser2.rank)}</p>
                            <p className="text-xs text-gray-500">positions</p>
                          </div>
                        </div>

                        {/* Points Winner */}
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">More Points</p>
                          <div className={`p-4 rounded-lg ${(compareUser1.total_points || 0) > (compareUser2.total_points || 0) ? 'bg-blue-100 border-2 border-blue-500' : 'bg-green-100 border-2 border-green-500'}`}>
                            <p className="font-bold">{(compareUser1.total_points || 0) > (compareUser2.total_points || 0) ? compareUser1.full_name.split(' ')[0] : compareUser2.full_name.split(' ')[0]}</p>
                            <p className="text-2xl">⭐</p>
                          </div>
                        </div>
                      </div>

                      {/* Points Difference */}
                      <div className="text-center p-4 bg-white rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Points Difference</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.abs((compareUser1.total_points || 0) - (compareUser2.total_points || 0))} points
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCompare(false);
                  setCompareUser1(null);
                  setCompareUser2(null);
                  setSearchQuery1('');
                  setSearchQuery2('');
                }}
                className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileScreen({ user, userData, onBack, onLogout }: { user: any; userData: any; onBack: () => void; onLogout: () => void }) {
  return <ProfileScreenEnhanced user={user} userData={userData} onBack={onBack} onLogout={onLogout} />;
}

function SubmissionsScreen({ onBack }: { onBack: () => void }) {
  return <SubmissionsList onBack={onBack} />;
}

// Top Performer Profile Modal Component (for leaderboard clicks)
function TopPerformerProfileModal({ performer, onClose }: { performer: any; onClose: () => void }) {
  const [programCounts, setProgramCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [actualRank, setActualRank] = useState<number>(performer?.rank || 0);
  
  // Safety check: if performer is undefined, close the modal in useEffect
  useEffect(() => {
    if (!performer) {
      console.error('[TopPerformerProfileModal] No performer data provided');
      onClose();
      return;
    }
    loadSubmissions();
    calculateActualRank();
  }, [performer]);
  
  // 🔥 Calculate real-time rank based on current points
  const calculateActualRank = async () => {
    try {
      if (!performer?.id) return;
      
      // Get all SEs sorted by points (same logic as Hall of Fame)
      const { data: allSEs, error } = await supabase
        .from('app_users')
        .select('id, total_points')
        .eq('role', 'sales_executive')
        .order('total_points', { ascending: false });
      
      if (error) {
        console.error('[TopPerformerProfileModal] Error calculating rank:', error);
        return;
      }
      
      // Find this performer's position in the sorted list
      const rankPosition = allSEs?.findIndex(se => se.id === performer.id) + 1;
      setActualRank(rankPosition || 0);
      
      console.log(`[TopPerformerProfileModal] ✅ Calculated rank: ${rankPosition} (Points: ${performer.total_points})`);
    } catch (error) {
      console.error('[TopPerformerProfileModal] Error calculating rank:', error);
    }
  };
  
  // Early return if no performer - but don't call onClose during render
  if (!performer) {
    return null;
  }
  
  const performerInitial = performer.full_name?.substring(0, 1).toUpperCase() || 'U';

  const loadSubmissions = async () => {
    console.log('[TopPerformerProfileModal] 📊 Loading ACTUAL program submissions from database');
    console.log('[TopPerformerProfileModal] Performer object:', performer);
    try {
      const userId = performer.id || performer.employee_id;
      
      if (!userId) {
        console.error('[TopPerformerProfileModal] No user ID found in performer:', performer);
        setLoading(false);
        return;
      }

      console.log('[TopPerformerProfileModal] 🔍 Searching for submissions with user_id:', userId);

      // First, check ALL submissions to see what statuses exist
      const { data: allSubmissionsData, error: allSubmissionsError } = await supabase
        .from('submissions')
        .select(`
          id,
          program_id,
          status,
          created_at,
          programs:program_id (title)
        `)
        .eq('user_id', userId);

      if (allSubmissionsError) {
        console.error('[TopPerformerProfileModal] Error loading submissions:', allSubmissionsError);
        setProgramCounts({});
        setLoading(false);
        return;
      }

      console.log(`[TopPerformerProfileModal] ✅ Found ${allSubmissionsData?.length || 0} TOTAL submissions for ${performer.full_name}`);
      console.log('[TopPerformerProfileModal] Raw submissions data:', allSubmissionsData);
      
      // Log status breakdown
      const statusBreakdown: { [key: string]: number } = {};
      allSubmissionsData?.forEach((sub: any) => {
        statusBreakdown[sub.status] = (statusBreakdown[sub.status] || 0) + 1;
      });
      console.log('[TopPerformerProfileModal] 📊 Status breakdown:', statusBreakdown);

      // Count submissions per program (ALL statuses for now to see where points come from)
      const counts: { [key: string]: number } = {};
      
      if (allSubmissionsData && allSubmissionsData.length > 0) {
        allSubmissionsData.forEach((submission: any) => {
          const programTitle = submission.programs?.title || 'Unknown Program';
          counts[programTitle] = (counts[programTitle] || 0) + 1;
        });
      }

      setProgramCounts(counts);
      console.log('[TopPerformerProfileModal] 📋 Program breakdown:', counts);
      setLoading(false);
    } catch (error) {
      console.error('[TopPerformerProfileModal] Error loading submissions:', error);
      setProgramCounts({});
      setLoading(false);
    }
  };

  const totalSubmissions = Object.values(programCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">SE Profile</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Profile Avatar & Name */}
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-3xl mx-auto mb-2 shadow-lg border-4 border-white border-opacity-30">
              {performerInitial}
            </div>
            <h4 className="text-xl mb-1">{performer.full_name}</h4>
            <p className="text-red-100 text-xs">{performer.zone || 'Coast'}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold mb-1">#{actualRank || performer.rank}</p>
            <p className="text-xs text-yellow-800">Rank</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold mb-1">{performer.total_points || 0}</p>
            <p className="text-xs text-green-800">Points</p>
          </div>
        </div>

        {/* Submissions by Program */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">📊 Submissions by Program</h4>
            {totalSubmissions > 0 && (
              <span className="text-xs text-gray-500">{totalSubmissions} total</span>
            )}
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-600 text-xs">Loading...</p>
            </div>
          ) : totalSubmissions > 0 ? (
            <div className="space-y-2">
              {Object.entries(programCounts).sort(([, a], [, b]) => b - a).map(([program, count]) => (
                <div key={program} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{program}</p>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-600 text-white text-sm font-bold">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-600 text-sm">No submissions yet</p>
              <p className="text-gray-500 text-xs mt-1">This SE hasn't made any submissions</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors font-semibold text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Hall of Fame Screen Component
function HallOfFameScreen({ onBack, userData }: { onBack: () => void; userData: any }) {
  const [hallOfFamers, setHallOfFamers] = useState<any[]>([]);
  const [filteredFamers, setFilteredFamers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'all-time' | 'monthly' | 'weekly'>('all-time');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedZSM, setSelectedZSM] = useState<string>('all');
  const [zones, setZones] = useState<string[]>([]);
  const [zsms, setZSMs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPerformer, setSelectedPerformer] = useState<any>(null);

  useEffect(() => {
    loadHallOfFame();
  }, [timeFrame]);

  useEffect(() => {
    // Filter based on search and filters
    let filtered = [...hallOfFamers];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(person => 
        person.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Zone filter
    if (selectedZone !== 'all') {
      filtered = filtered.filter(person => person.zone === selectedZone);
    }

    // ZSM filter
    if (selectedZSM !== 'all') {
      filtered = filtered.filter(person => person.zsm === selectedZSM);
    }

    setFilteredFamers(filtered);
  }, [searchQuery, selectedZone, selectedZSM, hallOfFamers]);

  const loadHallOfFame = async () => {
    try {
      setLoading(true);
      
      // Get ALL Sales Executives (not just top 10)
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'sales_executive')
        .order('total_points', { ascending: false });

      if (data) {
        setHallOfFamers(data);
        
        // Extract unique zones and ZSMs
        const uniqueZones = [...new Set(data.map(p => p.zone).filter(Boolean))].sort();
        const uniqueZSMs = [...new Set(data.map(p => p.zsm).filter(Boolean))].sort();
        
        setZones(uniqueZones as string[]);
        setZSMs(uniqueZSMs as string[]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading hall of fame:', error);
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedZone('all');
    setSelectedZSM('all');
  };

  // Get available ZSMs based on selected zone (cascading filter)
  const getAvailableZSMs = () => {
    if (selectedZone === 'all') {
      return zsms;
    }
    // Filter ZSMs to only show those in the selected zone
    const zsmInZone = [...new Set(
      hallOfFamers
        .filter(p => p.zone === selectedZone)
        .map(p => p.zsm)
        .filter(Boolean)
    )].sort();
    return zsmInZone as string[];
  };

  // Reset ZSM filter when zone changes
  useEffect(() => {
    if (selectedZone !== 'all') {
      const availableZSMs = getAvailableZSMs();
      if (selectedZSM !== 'all' && !availableZSMs.includes(selectedZSM)) {
        setSelectedZSM('all');
      }
    }
  }, [selectedZone]);

  const availableZSMs = getAvailableZSMs();

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-600 text-white px-6 py-6">
        <div className="flex items-center mb-4">
          <button 
            onClick={onBack}
            className="mr-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl mb-1">🏆 Hall of Fame</h1>
            <p className="text-sm text-yellow-100">Legends of Airtel Champions</p>
          </div>
        </div>

        {/* Time Frame Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFrame('all-time')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-colors ${
              timeFrame === 'all-time' 
                ? 'bg-white text-yellow-600' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeFrame('monthly')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-colors ${
              timeFrame === 'monthly' 
                ? 'bg-white text-yellow-600' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setTimeFrame('weekly')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold transition-colors ${
              timeFrame === 'weekly' 
                ? 'bg-white text-yellow-600' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white border-b border-gray-200 p-4 space-y-3">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              style={{ fontSize: '16px' }}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              showFilters || selectedZone !== 'all' || selectedZSM !== 'all'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
        </div>

        {/* Filter Options - Collapsible */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
            {/* Zone Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Zone</label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                style={{ fontSize: '14px' }}
              >
                <option value="all">All Zones</option>
                {zones.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            {/* ZSM Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ZSM {selectedZone !== 'all' && `(in ${selectedZone})`}
              </label>
              <select
                value={selectedZSM}
                onChange={(e) => setSelectedZSM(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                style={{ fontSize: '14px' }}
              >
                <option value="all">All ZSMs</option>
                {availableZSMs.map(zsm => (
                  <option key={zsm} value={zsm}>{zsm}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {(selectedZone !== 'all' || selectedZSM !== 'all' || searchQuery) && (
              <div className="col-span-2">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing <span className="font-semibold text-yellow-600">{filteredFamers.length}</span> of {hallOfFamers.length} Sales Executives
        </div>
      </div>

      {/* Hall of Fame List - Fixed height with scrolling */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {filteredFamers.map((performer, index) => {
              const initial = performer.full_name?.substring(0, 1).toUpperCase() || 'U';
              const actualRank = hallOfFamers.findIndex(p => p.id === performer.id) + 1;
              const medalColor = actualRank === 1 ? 'bg-yellow-500' : actualRank === 2 ? 'bg-gray-400' : actualRank === 3 ? 'bg-orange-600' : 'bg-blue-500';
              const medal = actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : actualRank === 3 ? '🥉' : '⭐';
              const isCurrentUser = performer.id === userData?.id;

              return (
                <button 
                  key={performer.id}
                  onClick={() => setSelectedPerformer({ ...performer, rank: actualRank })}
                  className={`rounded-2xl p-5 shadow-md border-2 hover:shadow-lg transition-all w-full text-left cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    isCurrentUser 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-orange-500 ring-2 ring-orange-300' 
                      : actualRank <= 3 
                        ? 'bg-white border-yellow-400' 
                        : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    {/* Rank Badge */}
                    <div className={`flex-shrink-0 w-12 h-12 ${medalColor} rounded-full flex items-center justify-center text-white text-2xl mr-4 shadow-lg`}>
                      {medal}
                    </div>

                    {/* Profile Picture / Initial */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center text-white text-2xl mr-4 shadow-md">
                      {initial}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg">{performer.full_name}</h3>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-semibold">
                            YOU
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">📍 {performer.zone}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                          ⭐ {performer.total_points || 0} pts
                        </span>
                        <span className="text-xs text-gray-500">
                          Rank #{actualRank}
                        </span>
                      </div>
                    </div>

                    {/* Trophy Icon for Top 3 */}
                    {actualRank <= 3 && (
                      <div className="flex-shrink-0 text-4xl">
                        🏆
                      </div>
                    )}
                  </div>

                  {/* Additional Stats */}
                  {(actualRank <= 3 || isCurrentUser) && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Zone</p>
                        <p className="text-sm text-gray-800 font-semibold">{performer.zone}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">ZSM</p>
                        <p className="text-sm text-gray-800 font-semibold">{performer.zsm || 'N/A'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Employee ID</p>
                        <p className="text-sm text-gray-800 font-semibold">{performer.employee_id || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}

            {filteredFamers.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl text-gray-600 mb-2">No Results Found</h3>
                <p className="text-gray-500">
                  {searchQuery || selectedZone !== 'all' || selectedZSM !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No Sales Executives found'}
                </p>
                {(searchQuery || selectedZone !== 'all' || selectedZSM !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* SE Profile Modal */}
      {selectedPerformer && (
        <TopPerformerProfileModal 
          performer={selectedPerformer} 
          onClose={() => setSelectedPerformer(null)} 
        />
      )}
    </div>
  );
}

// Wrap App with Error Boundary for production safety
import { ErrorBoundary } from './components/ErrorBoundary';

function AppWithErrorBoundary() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Error logging - in production, send to error tracking service
        // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
      }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;