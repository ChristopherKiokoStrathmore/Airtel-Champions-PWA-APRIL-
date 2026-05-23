import { ReactNode } from 'react';
import { DesktopSidebar } from './desktop-sidebar';

interface DesktopLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userData: any;
  onLogout: () => void;
  children: ReactNode;
  unreadAnnouncementsCount?: number;
}

export function DesktopLayout({
  activeTab,
  onTabChange,
  userData,
  onLogout,
  children,
  unreadAnnouncementsCount = 0,
}: DesktopLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        userData={userData}
        onLogout={onLogout}
        unreadAnnouncementsCount={unreadAnnouncementsCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
