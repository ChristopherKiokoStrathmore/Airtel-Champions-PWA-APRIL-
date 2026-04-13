import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardOverview } from './DashboardOverview';
import { SubmissionReview } from './SubmissionReview';
import { PointConfiguration } from './PointConfiguration';
import { AnnouncementsManager } from './AnnouncementsManager';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { LeaderboardManagement } from './LeaderboardManagement';
import { AchievementSystem } from './AchievementSystem';
import { DailyChallenges } from './DailyChallenges';
import { BattleMap } from './BattleMap';
import { SEProfileViewer } from './SEProfileViewer';

interface AdminDashboardProps {
  adminUser: {
    name: string;
    role: string;
  } | null;
  onLogout: () => void;
}

type Screen = 'overview' | 'submissions' | 'points' | 'announcements' | 'analytics' | 'leaderboard' | 'achievements' | 'challenges' | 'battlemap' | 'profiles';

export function AdminDashboard({ adminUser, onLogout }: AdminDashboardProps) {
  const [currentScreen, setCurrentScreen] = useState<Screen>('overview');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'overview':
        return <DashboardOverview />;
      case 'submissions':
        return <SubmissionReview />;
      case 'points':
        return <PointConfiguration />;
      case 'announcements':
        return <AnnouncementsManager />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'leaderboard':
        return <LeaderboardManagement />;
      case 'achievements':
        return <AchievementSystem />;
      case 'challenges':
        return <DailyChallenges />;
      case 'battlemap':
        return <BattleMap />;
      case 'profiles':
        return <SEProfileViewer />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div data-testid="admin-panel" className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        adminUser={adminUser}
        onLogout={onLogout}
      />
      
      <main className="flex-1 overflow-auto">
        {renderScreen()}
      </main>
    </div>
  );
}