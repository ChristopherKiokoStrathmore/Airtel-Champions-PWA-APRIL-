// AppState.ts - Centralized state management for the app
import { create } from 'zustand';

interface AppState {
  // Authentication state
  isAuthenticated: boolean;
  user: any;
  userData: any;
  loading: boolean;
  
  // UI state
  showSignup: boolean;
  showSplash: boolean;
  databaseError: string | null;
  showDatabaseSetup: boolean;
  showAppTour: boolean;
  
  // Modal states
  showProfileSetup: boolean;
  showSettings: boolean;
  showAnnouncements: boolean;
  showCamera: boolean;
  showSubmissions: boolean;
  showMissions: boolean;
  showBadges: boolean;
  showLeaderboard: boolean;
  showReportingStructure: boolean;
  showDirectorLine: boolean;
  showSocialFeed: boolean;
  showProfile: boolean;
  showCompare: boolean;
  showProgramsList: boolean;
  showProgramsFolders: boolean;
  showExploreFeed: boolean;
  showCreateAnnouncement: boolean;
  showDatabaseSetupModal: boolean;
  showResearchPlanner: boolean;
  showSubmissionsHistory: boolean;
  selectedUserProfile: any;
  
  // Actions
  setAuthenticated: (auth: boolean) => void;
  setUser: (user: any) => void;
  setUserData: (userData: any) => void;
  setLoading: (loading: boolean) => void;
  setShowSignup: (show: boolean) => void;
  setShowSplash: (show: boolean) => void;
  setDatabaseError: (error: string | null) => void;
  setShowDatabaseSetup: (show: boolean) => void;
  setShowAppTour: (show: boolean) => void;
  
  // Modal actions
  setShowProfileSetup: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowAnnouncements: (show: boolean) => void;
  setShowCamera: (show: boolean) => void;
  setShowSubmissions: (show: boolean) => void;
  setShowMissions: (show: boolean) => void;
  setShowBadges: (show: boolean) => void;
  setShowLeaderboard: (show: boolean) => void;
  setShowReportingStructure: (show: boolean) => void;
  setShowDirectorLine: (show: boolean) => void;
  setShowSocialFeed: (show: boolean) => void;
  setShowProfile: (show: boolean) => void;
  setShowCompare: (show: boolean) => void;
  setShowProgramsList: (show: boolean) => void;
  setShowProgramsFolders: (show: boolean) => void;
  setShowExploreFeed: (show: boolean) => void;
  setShowCreateAnnouncement: (show: boolean) => void;
  setShowDatabaseSetupModal: (show: boolean) => void;
  setShowResearchPlanner: (show: boolean) => void;
  setShowSubmissionsHistory: (show: boolean) => void;
  setSelectedUserProfile: (user: any) => void;
  
  // Reset function
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  isAuthenticated: false,
  user: null,
  userData: null,
  loading: true,
  showSignup: false,
  showSplash: true,
  databaseError: null,
  showDatabaseSetup: false,
  showAppTour: false,
  
  // Modal states
  showProfileSetup: false,
  showSettings: false,
  showAnnouncements: false,
  showCamera: false,
  showSubmissions: false,
  showMissions: false,
  showBadges: false,
  showLeaderboard: false,
  showReportingStructure: false,
  showDirectorLine: false,
  showSocialFeed: false,
  showProfile: false,
  showCompare: false,
  showProgramsList: false,
  showProgramsFolders: false,
  showExploreFeed: false,
  showCreateAnnouncement: false,
  showDatabaseSetupModal: false,
  showResearchPlanner: false,
  showSubmissionsHistory: false,
  selectedUserProfile: null,
  
  // Actions
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setUser: (user) => set({ user }),
  setUserData: (userData) => set({ userData }),
  setLoading: (loading) => set({ loading }),
  setShowSignup: (show) => set({ showSignup: show }),
  setShowSplash: (show) => set({ showSplash: show }),
  setDatabaseError: (error) => set({ databaseError: error }),
  setShowDatabaseSetup: (show) => set({ showDatabaseSetup: show }),
  setShowAppTour: (show) => set({ showAppTour: show }),
  
  // Modal actions
  setShowProfileSetup: (show) => set({ showProfileSetup: show }),
  setShowSettings: (show) => set({ showSettings: show }),
  setShowAnnouncements: (show) => set({ showAnnouncements: show }),
  setShowCamera: (show) => set({ showCamera: show }),
  setShowSubmissions: (show) => set({ showSubmissions: show }),
  setShowMissions: (show) => set({ showMissions: show }),
  setShowBadges: (show) => set({ showBadges: show }),
  setShowLeaderboard: (show) => set({ showLeaderboard: show }),
  setShowReportingStructure: (show) => set({ showReportingStructure: show }),
  setShowDirectorLine: (show) => set({ showDirectorLine: show }),
  setShowSocialFeed: (show) => set({ showSocialFeed: show }),
  setShowProfile: (show) => set({ showProfile: show }),
  setShowCompare: (show) => set({ showCompare: show }),
  setShowProgramsList: (show) => set({ showProgramsList: show }),
  setShowProgramsFolders: (show) => set({ showProgramsFolders: show }),
  setShowExploreFeed: (show) => set({ showExploreFeed: show }),
  setShowCreateAnnouncement: (show) => set({ showCreateAnnouncement: show }),
  setShowDatabaseSetupModal: (show) => set({ showDatabaseSetupModal: show }),
  setShowResearchPlanner: (show) => set({ showResearchPlanner: show }),
  setShowSubmissionsHistory: (show) => set({ showSubmissionsHistory: show }),
  setSelectedUserProfile: (user) => set({ selectedUserProfile: user }),
  
  // Reset function
  reset: () => set({
    isAuthenticated: false,
    user: null,
    userData: null,
    loading: true,
    showSignup: false,
    showSplash: true,
    databaseError: null,
    showDatabaseSetup: false,
    showAppTour: false,
    showProfileSetup: false,
    showSettings: false,
    showAnnouncements: false,
    showCamera: false,
    showSubmissions: false,
    showMissions: false,
    showBadges: false,
    showLeaderboard: false,
    showReportingStructure: false,
    showDirectorLine: false,
    showSocialFeed: false,
    showProfile: false,
    showCompare: false,
    showProgramsList: false,
    showProgramsFolders: false,
    showExploreFeed: false,
    showCreateAnnouncement: false,
    showDatabaseSetupModal: false,
    showResearchPlanner: false,
    showSubmissionsHistory: false,
    selectedUserProfile: null,
  }),
}));
