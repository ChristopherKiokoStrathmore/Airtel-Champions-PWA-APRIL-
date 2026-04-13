// HomeScreen.tsx - Extracted from App.tsx for better maintainability
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { trackUserLogin, trackUserLogout, updateUserActivity, initSessionTracker } from '../lib/session-tracker';
import { trackLogin, trackLogout } from '../utils/analytics';
import { initActivityTracking, logPWAAction, ACTION_TYPES } from '../lib/activity-tracker';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useShare } from '../hooks/useShare';
import { useBadge } from '../hooks/useBadge';
import { WakeLockButton } from '../wake-lock-button';
import { PushNotificationBell } from '../push-notification-bell';
import { ZoneCommanderDashboard, ZoneBusinessLeadDashboard, HQDashboard, DirectorDashboard } from '../role-dashboards';
import { DeveloperDashboard } from '../developer-dashboard-enhanced';
import { DirectorDashboardV2 } from '../director-dashboard-v2';
import { SettingsScreen } from '../settings-screen';
import { ProfileSetupScreen } from '../profile-setup';
import { AnnouncementsModal } from '../announcements-modal';
import { CameraCapture } from '../camera-capture';
import { SubmissionsList } from '../submissions-list';
import { DailyMissions } from '../daily-missions';
import { BadgesAchievements } from '../badges-achievements';
import { TodayLeaderboardModal } from '../today-leaderboard-modal';
import { ReportingStructure } from '../reporting-structure-new';
import { DirectorLine } from '../director-line';
import { SocialFeed } from '../social-feed';
import { ProfileDropdown } from '../profile-dropdown';
import { ProfileScreenEnhanced } from '../profile-screen-enhanced';
import { UserProfileModal } from '../user-profile-modal';
import { AdvancedCompare } from '../advanced-compare';
import { ProgramsList } from '../programs/programs-list';
import { ProgramsListFoldersApp } from '../programs/programs-list-folders-app';
import { ProgramsWidgetHome } from '../programs/programs-widget-home';
import { ExploreFeed } from '../explore-feed-local';
import { AnnouncementCard } from '../announcement-card';
import { CreateAnnouncementModalV2 as CreateAnnouncementModal } from '../create-announcement-modal-v2';
import { DatabaseSetupInstructions } from '../database-setup-instructions';
import { NetworkStatus } from '../network-status';
import { ResearchPaperPlanner } from '../research-paper-planner';
import { SubmissionsHistoryModal } from '../submissions-history-modal';
import { UpdateManager } from '../update-manager';
import { PWAInstallPrompt } from '../pwa-install-prompt';
import { GuidedTour, shouldShowAppTour } from '../guided-tour';
import { WebRTC calling system removed for brevity } from '../calling';

interface HomeScreenProps {
  user: any;
  onLogout: () => void;
  initialTab?: string | null;
}

export function HomeScreen({ user, onLogout, initialTab }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'home');
  const [programToOpen, setProgramToOpen] = useState<string | undefined>(undefined);
  const [userData, setUserData] = useState<any>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showMissions, setShowMissions] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showReportingStructure, setShowReportingStructure] = useState(false);
  const [showDirectorLine, setShowDirectorLine] = useState(false);
  const [showSocialFeed, setShowSocialFeed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showProgramsList, setShowProgramsList] = useState(false);
  const [showProgramsFolders, setShowProgramsFolders] = useState(false);
  const [showExploreFeed, setShowExploreFeed] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showDatabaseSetup, setShowDatabaseSetup] = useState(false);
  const [showResearchPlanner, setShowResearchPlanner] = useState(false);
  const [showSubmissionsHistory, setShowSubmissionsHistory] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [showAppTour, setShowAppTour] = useState(false);

  // PWA Badging API — show unread count on app icon
  const { setBadge, clearBadge } = useBadge();

  // Location tracking hook
  useLocationTracker({ 
    userId: user?.id, 
    userDetails: userData, 
    enabled: userData?.gps_tracking_consent 
  });

  // Share functionality hook
  const { shareContent } = useShare();

  // Initialize activity tracking
  useEffect(() => {
    if (userData) {
      initActivityTracking(userData.id);
      logPWAAction(ACTION_TYPES.LOGIN, {
        user_id: userData.id,
        role: userData.role,
        timestamp: new Date().toISOString()
      });
    }
  }, [userData]);

  // Initialize session tracking
  useEffect(() => {
    if (user && userData) {
      initSessionTracker();
      trackUserLogin(user.id);
      trackLogin(userData.role);
      updateUserActivity(user.id, 'login');
    }
  }, [user, userData]);

  // Trigger app tour after successful authentication
  useEffect(() => {
    if (!showAppTour) {
      const shouldShow = shouldShowAppTour();
      if (shouldShow) {
        setShowAppTour(true);
      }
    }
  }, [showAppTour]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (data && !error) {
            setUserData(data);
            
            // Check if profile setup is needed
            if (!data.full_name || !data.zone || !data.region) {
              setShowProfileSetup(true);
            }
          }
        } catch (err) {
          console.error('Failed to load user data:', err);
        }
      }
    };

    loadUserData();
  }, [user]);

  // Handle logout
  const handleLogout = async () => {
    try {
      if (userData) {
        trackUserLogout(user.id);
        trackLogout(userData.role);
        updateUserActivity(user.id, 'logout');
        logPWAAction(ACTION_TYPES.LOGOUT, {
          user_id: userData.id,
          role: userData.role,
          timestamp: new Date().toISOString()
        });
      }
      
      await supabase.auth.signOut();
      onLogout();
      clearBadge();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Role-based routing
  const userRole = user?.role || userData?.role;

  // Render appropriate dashboard based on role
  const renderDashboard = () => {
    if (userRole === 'zonal_sales_manager') {
      return <ZoneCommanderDashboard user={user} userData={userData} />;
    } else if (userRole === 'zonal_business_manager') {
      return <ZoneBusinessLeadDashboard user={user} userData={userData} />;
    } else if (userRole === 'hq_command_center') {
      return <HQDashboard user={user} userData={userData} />;
    } else if (userRole === 'director') {
      return <DirectorDashboard user={user} userData={userData} />;
    } else {
      // Default to sales executive dashboard
      return (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Sales Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard 
              icon="📊" 
              label="Today's Sales" 
              value="12" 
              color="bg-blue-100 text-blue-800" 
            />
            <StatCard 
              icon="🎯" 
              label="Target Progress" 
              value="75%" 
              color="bg-green-100 text-green-800" 
            />
            <StatCard 
              icon="🏆" 
              label="Ranking" 
              value="#3" 
              color="bg-purple-100 text-purple-800" 
            />
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Airtel Champions</h1>
            </div>
            <div className="flex items-center space-x-4">
              <WakeLockButton />
              <PushNotificationBell />
              <ProfileDropdown 
                user={user} 
                userData={userData}
                onLogout={handleLogout}
                onSettings={() => setShowSettings(true)}
                onProfile={() => setShowProfile(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </main>

      {/* Modals and Overlays */}
      {showProfileSetup && (
        <ProfileSetupScreen 
          user={user}
          userData={userData}
          onClose={() => setShowProfileSetup(false)}
          onComplete={() => setShowProfileSetup(false)}
        />
      )}

      {showSettings && (
        <SettingsScreen 
          user={user}
          userData={userData}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAppTour && (
        <GuidedTour 
          onComplete={() => setShowAppTour(false)}
          onSkip={() => setShowAppTour(false)}
        />
      )}

      <PWAInstallPrompt />
      <UpdateManager />
      <NetworkStatus />

      {/* Debug panel removed for production */}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className={`${color} border rounded-xl p-4 text-center`}>
      <div className="flex justify-center mb-2 text-2xl">{icon}</div>
      <p className="text-xl mb-1">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
