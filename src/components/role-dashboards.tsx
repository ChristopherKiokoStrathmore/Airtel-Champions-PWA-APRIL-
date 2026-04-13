import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';
import { ReportingStructure } from './reporting-structure-new';
import { LeaderboardWidget, LeaderboardEnhancedUnified } from './leaderboard-enhanced-unified';
import { VanCalendarWidgetHQ } from './van-calendar-widget-hq';
import { ProgramsDashboard } from './programs/programs-dashboard';
import { ProgramsWidgetHome } from './programs/programs-widget-home';
import { ProgramsList } from './programs/programs-list';
import { AllSubmissionsView } from './programs/all-submissions-view';
import { SubmissionsAnalytics } from './programs/submissions-analytics';
import { SocialFeed } from './social-feed';
import { AnnouncementCard } from './announcement-card';
import { UrgentAnnouncementCard } from './urgent-announcement-card';
import { CreateAnnouncementModalV2 as CreateAnnouncementModal } from './create-announcement-modal-v2';
import { AnnouncementsModal } from './announcements-modal';
import { ZSMProfileUAT } from './zsm-profile-uat';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAnnouncements } from '../lib/supabase';
import { UserProfileModal } from './user-profile-modal';
import { SettingsScreen } from './settings-screen';

// Helper function to get role display name
const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'sales_executive': 'Sales Executive',
    'zonal_sales_manager': 'Zone Sales Manager',
    'zonal_business_manager': 'Zonal Business Manager',
    'hq_staff': 'HQ Command Center',
    'hq_command_center': 'HQ Command Center',
    'director': 'Director',
    'developer': 'Developer'
  };
  return roleMap[role] || role;
};

// Time-sensitive greeting helper
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good morning', emoji: '🌤️' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
  if (hour >= 17 && hour < 21) return { text: 'Good evening', emoji: '🌆' };
  return { text: 'Good night', emoji: '🌙' };
};

// Announcement helper functions
const loadAnnouncementsForUser = async (userData: any, setAnnouncements: any, setUnreadCount: any) => {
  try {
    if (!userData) return;
    
    console.log('[Role Dashboard] ✅ Loading announcements from localStorage for role:', userData.role);
    
    // Use the localStorage-based getAnnouncements function
    const { data, error } = await getAnnouncements();

    if (error) {
      console.error('[Role Dashboard] ❌ Error loading announcements:', error);
      return;
    }

    console.log('[Role Dashboard] ✅ Raw announcements loaded:', data?.length || 0);

    // Filter announcements by target role
    const filteredAnnouncements = data?.filter((ann: any) => 
      ann.target_roles?.includes(userData.role) || 
      ann.target_roles?.includes('all')
    ) || [];

    console.log('[Role Dashboard] ✅ Filtered announcements for role:', filteredAnnouncements.length);

    // Add is_read flag for each announcement
    const announcementsWithReadStatus = filteredAnnouncements.map((announcement: any) => ({
      ...announcement,
      is_read: announcement.read_by?.includes(userData.id) || false
    }));

    setAnnouncements(announcementsWithReadStatus);
    
    const unread = announcementsWithReadStatus.filter((a: any) => !a.is_read).length;
    setUnreadCount(unread);
    
    console.log('[Role Dashboard] ✅ Total announcements:', announcementsWithReadStatus.length, '| Unread:', unread);
  } catch (error) {
    console.error('[Role Dashboard] ❌ Error loading announcements:', error);
  }
};

const markAnnouncementAsRead = async (announcementId: string, userData: any, announcements: any[], setAnnouncements: any, setUnreadCount: any) => {
  try {
    if (!userData) return;

    console.log('[Role Dashboard] ✅ Marking announcement as read (localStorage):', announcementId);

    // Load all announcements from localStorage
    const allAnnouncements = JSON.parse(localStorage.getItem('tai_announcements') || '[]');
    
    // Find and update the announcement
    const updatedAnnouncements = allAnnouncements.map((ann: any) => {
      if (ann.id === announcementId) {
        const readBy = ann.read_by || [];
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
    setAnnouncements(announcements.map((a: any) => 
      a.id === announcementId ? { ...a, is_read: true } : a
    ));
    setUnreadCount((prev: number) => Math.max(0, prev - 1));

    console.log('[Role Dashboard] ✅ Announcement marked as read successfully');
  } catch (error) {
    console.error('[Role Dashboard] ❌ Error marking announcement as read:', error);
  }
};

// ============================================================================
// SE QUICK VIEW MODAL - Multi-Program Calendar
// ============================================================================
function SEQuickViewModal({ 
  isOpen, 
  onClose, 
  se,
  programs,
  currentUser
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  se: any;
  programs: any[];
  currentUser?: any;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && se) {
      loadAllSubmissions();
    }
  }, [isOpen, se, currentDate]);

  const loadAllSubmissions = async () => {
    setLoading(true);
    try {
      // Get first and last day of current month
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('submissions')
        .select('*, programs(name, icon, color)')
        .eq('user_id', se.id)
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getSubmissionsForDay = (day: number) => {
    return submissions.filter(sub => {
      const subDate = new Date(sub.created_at);
      return subDate.getDate() === day;
    });
  };

  const getMonthName = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  // Get program color mapping
  const getProgramColor = (programId: number) => {
    const colorMap: any = {
      1: '#3b82f6', // Network Experience - Blue
      2: '#10b981', // Competition Conversion - Green
      3: '#8b5cf6', // New Site Launch - Purple
      4: '#f97316', // AMB Visitation - Orange
    };
    return colorMap[programId] || '#6b7280';
  };

  const getProgramStats = () => {
    const stats: any = {};
    programs.forEach(prog => {
      stats[prog.id] = {
        ...prog,
        count: submissions.filter(s => s.program_id === prog.id).length,
        approved: submissions.filter(s => s.program_id === prog.id && s.status === 'approved').length,
      };
    });
    return stats;
  };

  if (!isOpen) return null;

  const days = getDaysInMonth();
  const totalSubmissions = submissions.length;
  const programStats = getProgramStats();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[60vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - SE Profile - Minimal */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-600 text-white px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg flex items-center justify-center text-base shadow-lg">
                {se.full_name.substring(0, 1)}
              </div>
              <div>
                <h3 className="text-sm">{se.full_name}</h3>
                <p className="text-xs text-blue-100">
                  {currentUser?.role === 'Developer' && `${se.employee_id} • `}#{se.rank} • {se.total_points || 0}pts
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Programs Quick Stats - Inline */}
        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2">
            {programs.map((prog) => {
              const stats = programStats[prog.id] || { count: 0, approved: 0 };
              
              return (
                <div key={prog.id} className="flex items-center gap-1">
                  <span className="text-sm">{prog.icon}</span>
                  <span className="text-sm">{stats.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Month Navigation - Minimal */}
        <div className="bg-white px-3 py-1 flex items-center justify-between border-b border-gray-200">
          <button
            onClick={() => changeMonth(-1)}
            className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h4 className="text-sm">{getMonthName()} ({totalSubmissions})</h4>
          <button
            onClick={() => changeMonth(1)}
            className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar - Multi-Program View - Minimal */}
        <div className="flex-1 overflow-y-auto px-3 py-1.5">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-center text-xs text-gray-500">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid - Ultra Compact */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const daySubmissions = getSubmissionsForDay(day);
              const hasSubmissions = daySubmissions.length > 0;
              const isTodayDay = isToday(day);

              // Group submissions by program
              const programGroups: any = {};
              daySubmissions.forEach(sub => {
                if (!programGroups[sub.program_id]) {
                  programGroups[sub.program_id] = [];
                }
                programGroups[sub.program_id].push(sub);
              });

              return (
                <div
                  key={day}
                  className={`
                    aspect-square rounded-md flex flex-col items-center justify-center relative p-0.5
                    ${isTodayDay ? 'ring-2 ring-blue-600 bg-blue-50' : hasSubmissions ? 'bg-gray-50' : 'bg-white'}
                    transition-all
                  `}
                >
                  <span className={`text-xs ${isTodayDay ? 'font-bold text-blue-600' : hasSubmissions ? 'text-gray-800' : 'text-gray-400'}`}>
                    {day}
                  </span>
                  
                  {/* Multi-Program Dots */}
                  {hasSubmissions && (
                    <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                      {Object.keys(programGroups).slice(0, 4).map((progId) => (
                        <div
                          key={progId}
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: getProgramColor(parseInt(progId)) }}
                          title={`${programGroups[progId].length} submission(s)`}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Total count badge for 5+ submissions */}
                  {daySubmissions.length >= 5 && (
                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center shadow-sm">
                      {daySubmissions.length}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend - Minimal */}
          <div className="mt-1.5 pt-1.5 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs">
              {programs.map((prog) => (
                <div key={prog.id} className="flex items-center gap-0.5">
                  <div 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: getProgramColor(prog.id) }}
                  />
                  <span className="text-xs text-gray-600">{prog.icon}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CALENDAR MODAL COMPONENT
// ============================================================================
function CalendarModal({ 
  isOpen, 
  onClose, 
  program, 
  seId, 
  seName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  program: any; 
  seId: string;
  seName: string;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && program) {
      loadSubmissions();
    }
  }, [isOpen, program, currentDate]);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      // Get first and last day of current month
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', seId)
        .eq('program_id', program.id)
        .gte('created_at', firstDay.toISOString())
        .lte('created_at', lastDay.toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const getSubmissionsForDay = (day: number) => {
    return submissions.filter(sub => {
      const subDate = new Date(sub.created_at);
      return subDate.getDate() === day;
    });
  };

  const getMonthName = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  if (!isOpen) return null;

  const days = getDaysInMonth();
  const totalSubmissions = submissions.length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{program.icon}</span>
              <div>
                <h3 className="text-xl">{program.name}</h3>
                <p className="text-sm text-blue-100">{seName}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white bg-opacity-20 rounded-lg p-2 text-center">
              <p className="text-2xl">{totalSubmissions}</p>
              <p className="text-xs text-blue-100">Total</p>
            </div>
            <div className="bg-green-500 bg-opacity-40 rounded-lg p-2 text-center">
              <p className="text-2xl">{approvedCount}</p>
              <p className="text-xs text-green-100">Approved</p>
            </div>
            <div className="bg-yellow-500 bg-opacity-40 rounded-lg p-2 text-center">
              <p className="text-2xl">{pendingCount}</p>
              <p className="text-xs text-yellow-100">Pending</p>
            </div>
            <div className="bg-red-500 bg-opacity-40 rounded-lg p-2 text-center">
              <p className="text-2xl">{rejectedCount}</p>
              <p className="text-xs text-red-100">Rejected</p>
            </div>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <button
            onClick={() => changeMonth(-1)}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h4 className="text-lg">{getMonthName()}</h4>
          <button
            onClick={() => changeMonth(1)}
            className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const daySubmissions = getSubmissionsForDay(day);
              const hasSubmissions = daySubmissions.length > 0;
              const isTodayDay = isToday(day);

              return (
                <div
                  key={day}
                  className={`
                    aspect-square rounded-xl flex flex-col items-center justify-center relative
                    ${isTodayDay ? 'ring-2 ring-blue-600' : ''}
                    ${hasSubmissions ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50'}
                    transition-colors cursor-pointer
                  `}
                >
                  <span className={`text-sm ${isTodayDay ? 'font-bold text-blue-600' : hasSubmissions ? 'text-blue-800' : 'text-gray-600'}`}>
                    {day}
                  </span>
                  {hasSubmissions && (
                    <div className="absolute bottom-1">
                      {daySubmissions.length === 1 ? (
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          daySubmissions[0].status === 'approved' ? 'bg-green-500' :
                          daySubmissions[0].status === 'rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                      ) : (
                        <span className="text-xs bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          {daySubmissions.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-3">Status Legend:</p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs text-gray-600">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs text-gray-600">Rejected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">3</div>
                <span className="text-xs text-gray-600">Multiple</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ZSM DASHBOARD - Zone Sales Manager View
// ============================================================================
export function ZoneCommanderDashboard({ user, userData, onLogout }: any) {
  // Track page view automatically
  usePageTracking(ANALYTICS_PAGES.DASHBOARD);
  
  const [activeTab, setActiveTab] = useState('home');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSE, setSelectedSE] = useState<any>(null);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [programs, setPrograms] = useState<any[]>([]);
  const [programSubmissions, setProgramSubmissions] = useState<{ [key: number]: number }>({});
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [showUATModal, setShowUATModal] = useState(false);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [submissionsLimit, setSubmissionsLimit] = useState(10);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Team Tab filters and search
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamFilterStatus, setTeamFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [teamSortBy, setTeamSortBy] = useState<'points' | 'name' | 'rank'>('points');

  useEffect(() => {
    loadTeamMembers();
    loadPrograms();
  }, [userData]);

  useEffect(() => {
    // Load submissions after team members are loaded
    if (teamMembers.length > 0) {
      loadRecentSubmissions();
    }
  }, [teamMembers, submissionsLimit]);

  useEffect(() => {
    if (userData) {
      loadAnnouncementsForUser(userData, setAnnouncements, setUnreadAnnouncementsCount);
    }
  }, [userData]);

  useEffect(() => {
    if (userData?.id && activeTab === 'profile') {
      loadZSMSubmissionCounts();
    }
  }, [userData, activeTab]);

  const loadPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('status', 'active')
        .order('title', { ascending: true });

      if (data) {
        setPrograms(data);
      }
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  const loadZSMSubmissionCounts = async () => {
    if (!userData?.id) return;

    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('program_id')
        .eq('user_id', userData.id);

      if (data) {
        // Count submissions per program
        const counts: { [key: number]: number } = {};
        data.forEach(sub => {
          counts[sub.program_id] = (counts[sub.program_id] || 0) + 1;
        });
        setProgramSubmissions(counts);
      }
    } catch (error) {
      console.error('Error loading submission counts:', error);
    }
  };

  const handleProgramClick = (program: any) => {
    setSelectedProgram(program);
    setCalendarOpen(true);
  };

  const loadRecentSubmissions = async () => {
    if (!userData?.zone) return;
    
    // Detect preview environment
    const isPreviewEnvironment = window.location.hostname.includes('figma.site') || 
                                  window.location.hostname.includes('figma.com');
    
    try {
      setLoadingSubmissions(true);
      
      // Skip database calls entirely in preview environment
      if (isPreviewEnvironment) {
        console.log('ℹ️ [ZSM] Preview mode - submissions disabled');
        setRecentSubmissions([]);
        setLoadingSubmissions(false);
        return;
      }
      
      console.log('🔍 [ZSM] Loading recent submissions for zone:', userData.zone);

      // Get team member IDs
      const teamIds = teamMembers.map(se => se.id);
      
      if (teamIds.length === 0) {
        console.log('⚠️ [ZSM] No team members to load submissions for');
        setRecentSubmissions([]);
        setLoadingSubmissions(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('submissions')
          .select(`
            *,
            agent:app_users!submissions_user_id_fkey(id, full_name, zone),
            program:programs!submissions_program_id_fkey(id, title)
          `)
          .in('user_id', teamIds)
          .order('created_at', { ascending: false })
          .limit(submissionsLimit);

        if (error) {
          console.warn('⚠️ [ZSM] Database error:', error.message);
          setRecentSubmissions([]);
        } else if (data) {
          console.log('✅ [ZSM] Loaded', data.length, 'recent submissions');
          setRecentSubmissions(data);
        }
      } catch (fetchError: any) {
        console.warn('⚠️ [ZSM] Network issue:', fetchError.message);
        setRecentSubmissions([]);
      }
      
      setLoadingSubmissions(false);
    } catch (error: any) {
      console.warn('⚠️ [ZSM] Unexpected error:', error?.message || 'Unknown');
      setRecentSubmissions([]);
      setLoadingSubmissions(false);
    }
  };

  const loadTeamMembers = async () => {
    const isPreviewEnvironment = window.location.hostname.includes('figma.site') || 
                                  window.location.hostname.includes('figma.com');
    
    try {
      console.log('🔍 [ZSM] Loading team members for:', userData?.full_name, 'Zone:', userData?.zone);
      
      // Get all SEs mapped to this specific ZSM (try multiple matching strategies)
      // Strategy 1: Exact match on zsm field
      let { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'sales_executive')
        .eq('zsm', userData?.full_name)
        .order('total_points', { ascending: false });

      console.log('🔍 [ZSM] Strategy 1 (exact match):', data?.length || 0, 'SEs found');

      // Strategy 2: If no results, try case-insensitive match
      if (!data || data.length === 0) {
        const result = await supabase
          .from('app_users')
          .select('*')
          .eq('role', 'sales_executive')
          .ilike('zsm', userData?.full_name)
          .order('total_points', { ascending: false });
        
        data = result.data;
        error = result.error;
        console.log('🔍 [ZSM] Strategy 2 (case-insensitive):', data?.length || 0, 'SEs found');
      }

      // Strategy 3: If still no results, try matching by zone
      if (!data || data.length === 0) {
        const result = await supabase
          .from('app_users')
          .select('*')
          .eq('role', 'sales_executive')
          .eq('zone', userData?.zone)
          .order('total_points', { ascending: false });
        
        data = result.data;
        error = result.error;
        console.log('🔍 [ZSM] Strategy 3 (by zone):', data?.length || 0, 'SEs found');
      }

      if (error) {
        if (isPreviewEnvironment) {
          console.log('ℹ️ [ZSM] Database unavailable in preview');
        } else {
          console.error('❌ [ZSM] Error loading team:', error);
        }
      }

      if (data) {
        // Assign dynamic rank based on points order
        const dataWithRank = data.map((user, index) => ({
          ...user,
          rank: index + 1
        }));
        setTeamMembers(dataWithRank);
        console.log('✅ [ZSM] Successfully loaded', data.length, 'team members');
      } else {
        setTeamMembers([]);
        console.log('⚠️ [ZSM] No team members found');
      }
      
      setLoading(false);
    } catch (error: any) {
      if (isPreviewEnvironment) {
        console.log('ℹ️ [ZSM] Team loading unavailable in preview environment');
      } else {
        console.warn('⚠️ [ZSM] Error loading team:', error?.message || 'Unknown error');
      }
      setTeamMembers([]);
      setLoading(false);
    }
  };

  const getTeamHealth = () => {
    // Calculate team health based on activity
    const total = teamMembers.length;
    const active = teamMembers.filter(se => se.total_points > 0).length;
    
    if (active / total >= 0.8) return { color: '🟢', status: 'Healthy', bgColor: 'bg-green-50', textColor: 'text-green-800' };
    if (active / total >= 0.5) return { color: '🟡', status: 'Needs Attention', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800' };
    return { color: '🔴', status: 'Critical', bgColor: 'bg-red-50', textColor: 'text-red-800' };
  };

  const health = getTeamHealth();

  // Home Tab
  if (activeTab === 'home') {
    return (
      <div data-testid="sales-dashboard" className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-3xl mb-2 text-gray-800">
                {getTimeBasedGreeting().text}, {userData?.full_name?.split(' ')[0]} {getTimeBasedGreeting().emoji}
              </h2>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-full shadow-sm">
                <span className="text-sm text-blue-800">👔 Zone Sales Manager</span>
              </div>
            </div>
            {/* Profile Icon with Dropdown */}
            <div className="relative flex items-center gap-2">
              {/* Announcements Button */}
              <button
                onClick={() => setShowAnnouncementsModal(true)}
                className="relative w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors shadow-lg"
                title="View Announcements"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadAnnouncementsCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full text-white text-xs flex items-center justify-center font-semibold shadow-lg animate-pulse">
                    {unreadAnnouncementsCount}
                  </div>
                )}
              </button>

              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-blue-700 transition-colors overflow-hidden"
              >
                {userData?.profile_picture ? (
                  <img src={userData.profile_picture} alt={userData?.full_name} className="w-full h-full object-cover" />
                ) : (
                  userData?.full_name?.substring(0, 1)
                )}
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden">
                    {/* User Info in Dropdown */}
                    <div className="bg-blue-600 text-white px-4 py-4">
                      <p className="font-semibold">{userData?.full_name}</p>
                      <div className="mt-2 pt-2 border-t border-blue-500">
                        <p className="text-xs">Role: {getRoleDisplayName(userData?.role)}</p>
                        <p className="text-xs">Zone: {userData?.zone}</p>
                        <p className="text-xs">Team: {teamMembers.length} SEs</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('profile');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center text-gray-700"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('settings');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center text-gray-700 border-t border-gray-100"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center text-red-600 border-t border-gray-200"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {/* Team Total Points - Collective Score */}
          <div className="px-6 pt-6 pb-0">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-blue-100 text-sm mb-1">🏆 Zone Total Points</p>
                  <p className="text-4xl font-bold">
                    {teamMembers.reduce((sum, se) => sum + (se.total_points || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-blue-100 text-xs mt-2">
                    From {teamMembers.length} Sales Executives
                  </p>
                </div>
                <div className="text-5xl opacity-20">⚡</div>
              </div>
            </div>
          </div>

          {/* Team Health Status */}
          <div className={`${health.bgColor} border-b border-gray-200 px-6 py-6 mt-6`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg mb-2">{health.color} Team Health: {health.status}</h3>
                <p className={`text-sm ${health.textColor}`}>
                  {teamMembers.filter(se => se.total_points > 0).length} of {teamMembers.length} SEs active
                </p>
              </div>
              <div className="text-4xl">{health.color}</div>
            </div>
          </div>

          {/* Top Performers Widget */}
          <div className="px-6 py-6 pb-0">
            <LeaderboardWidget 
              currentUserId={userData?.id} 
              onViewAll={() => setActiveTab('leaderboard')} 
            />
          </div>

          {/* Urgent Announcements Section - Only show urgent priority */}
          {announcements.filter(ann => ann.priority === 'urgent' && !ann.is_read).length > 0 && (
            <div className="px-6 py-4 space-y-3">
              {announcements
                .filter(ann => ann.priority === 'urgent' && !ann.is_read)
                .map((ann) => (
                  <UrgentAnnouncementCard
                    key={ann.id}
                    id={ann.id}
                    title={ann.title}
                    message={ann.message}
                    created_by_name={ann.created_by_name || (ann as any).author_name || 'Unknown'}
                    created_by_role={ann.created_by_role || (ann as any).author_role || 'Staff'}
                    created_at={ann.created_at}
                    onDismiss={(id) => markAnnouncementAsRead(id, userData, announcements, setAnnouncements, setUnreadAnnouncementsCount)}
                  />
                ))}
            </div>
          )}

          {/* Programs Widget */}
          <div className="px-6 pt-0 pb-6">
            <ProgramsWidgetHome onViewAll={() => setActiveTab('programs')} />
          </div>

          {/* Recent Submissions Section */}
          <div className="px-6 py-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg">📝 Recent Submissions</h3>
              <select
                value={submissionsLimit}
                onChange={(e) => setSubmissionsLimit(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>Last 5</option>
                <option value={10}>Last 10</option>
                <option value={15}>Last 15</option>
                <option value={30}>Last 30</option>
              </select>
            </div>

            {loadingSubmissions ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentSubmissions.length > 0 ? (
              <div className="space-y-3">
                {recentSubmissions.map((submission) => (
                  <div 
                    key={submission.id} 
                    className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold">
                            {submission.agent?.full_name?.substring(0, 1) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{submission.agent?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{submission.agent?.zone || 'N/A'}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <span className="font-semibold">Program:</span> {submission.program?.title || 'Unknown Program'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="ml-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Submitted
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center">
                <p className="text-gray-500 text-sm">No recent submissions from your team</p>
                <p className="text-gray-400 text-xs mt-1">Submissions will appear here when your SEs submit program data</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zsm" />

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
              loadAnnouncementsForUser(userData, setAnnouncements, setUnreadAnnouncementsCount);
            }}
            userData={userData}
          />
        )}

        {/* User Profile Modal */}
        {selectedSE && (
          <UserProfileModal
            userId={selectedSE.id}
            currentUser={userData}
            isOwnProfile={false}
            onClose={() => setSelectedSE(null)}
          />
        )}

        {/* Announcements Modal */}
        {showAnnouncementsModal && (
          <AnnouncementsModal
            onClose={() => setShowAnnouncementsModal(false)}
            announcements={announcements}
            onMarkAsRead={(id) => markAnnouncementAsRead(id, userData, announcements, setAnnouncements, setUnreadAnnouncementsCount)}
          />
        )}
      </div>
    );
  }

  // Explore Tab
  if (activeTab === 'explore') {
    return (
      <SocialFeed user={user} userData={userData} onBack={() => setActiveTab('home')} />
    );
  }

  // My Team Tab - Enhanced with filters
  if (activeTab === 'team') {
    // Filter and sort team members
    const filteredTeam = teamMembers
      .filter(se => {
        const matchesSearch = se.full_name.toLowerCase().includes(teamSearchQuery.toLowerCase());
        const matchesStatus = 
          teamFilterStatus === 'all' ? true :
          teamFilterStatus === 'active' ? se.total_points > 0 :
          se.total_points === 0;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (teamSortBy === 'points') return (b.total_points || 0) - (a.total_points || 0);
        if (teamSortBy === 'rank') return a.rank - b.rank;
        if (teamSortBy === 'name') return a.full_name.localeCompare(b.full_name);
        return 0;
      });

    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <h2 className="text-3xl mb-2">👥 My Team</h2>
          <p className="text-sm text-gray-600">Managing {teamMembers.length} Sales Executives</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-3">
          {/* Search */}
          <input
            type="text"
            placeholder="🔍 Search by name..."
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTeamFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                teamFilterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({teamMembers.length})
            </button>
            <button
              onClick={() => setTeamFilterStatus('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                teamFilterStatus === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({teamMembers.filter(se => se.total_points > 0).length})
            </button>
            <button
              onClick={() => setTeamFilterStatus('inactive')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                teamFilterStatus === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive ({teamMembers.filter(se => se.total_points === 0).length})
            </button>
          </div>

          {/* Sort */}
          <select
            value={teamSortBy}
            onChange={(e) => setTeamSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
          >
            <option value="points">Sort by Points</option>
            <option value="rank">Sort by Rank</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Team List */}
        <div className="flex-1 overflow-y-auto pb-20 px-6 py-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTeam.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl mb-2">No team members found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeam.map((se, index) => {
                const isActive = se.total_points > 0;
                const isTopPerformer = index < 3 && teamSortBy === 'points';
                
                return (
                  <button
                    key={se.id}
                    onClick={() => setSelectedSE(se)}
                    className={`w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] ${
                      isTopPerformer ? 'border-2 border-yellow-400' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      {/* Rank Badge */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg mr-3 ${
                        se.rank === 1 ? 'bg-yellow-500' :
                        se.rank === 2 ? 'bg-gray-400' :
                        se.rank === 3 ? 'bg-orange-600' :
                        'bg-blue-600'
                      }`}>
                        {isTopPerformer ? (
                          <span className="text-2xl">{se.rank === 1 ? '🥇' : se.rank === 2 ? '🥈' : '🥉'}</span>
                        ) : (
                          se.full_name.substring(0, 1)
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{se.full_name}</h4>
                          {isTopPerformer && <span className="text-xs">⭐</span>}
                        </div>
                        <p className="text-xs text-gray-600">
                          {se.zone} • Rank #{se.rank} • {se.employee_id || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isActive 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {isActive ? '🟢 Active' : '⚪ Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Points */}
                      <div className="text-right mr-3">
                        <p className="text-2xl font-bold text-blue-600">{se.total_points || 0}</p>
                        <p className="text-xs text-gray-600">points</p>
                      </div>
                      
                      {/* Arrow */}
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zsm" />
        
        {/* SE Quick View Modal */}
        {selectedSE && (
          <UserProfileModal
            userId={selectedSE.id}
            currentUser={userData}
            isOwnProfile={false}
            onClose={() => setSelectedSE(null)}
          />
        )}
      </div>
    );
  }

  // Leaderboard Tab
  if (activeTab === 'leaderboard') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <LeaderboardEnhancedUnified 
          currentUserId={userData?.id}
          currentUserData={userData}
          showBackButton={true}
          onBack={() => setActiveTab('home')}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zsm" />
      </div>
    );
  }

  // Programs Tab
  if (activeTab === 'programs') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <ProgramsDashboard onBack={() => setActiveTab('home')} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zsm" />
      </div>
    );
  }

  // Submissions Analytics Tab
  if (activeTab === 'submissions') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20">
          <SubmissionsAnalytics 
            userRole="zonal_sales_manager"
            userName={userData?.full_name}
            userZone={userData?.zone}
          />
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zsm" />
      </div>
    );
  }

  // Profile Tab - Opens own profile in enhanced modal
  if (activeTab === 'profile') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <UserProfileModal
          userId={userData?.id}
          currentUser={userData}
          isOwnProfile={true}
          onClose={() => setActiveTab('home')}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zsm" />
      </div>
    );
  }

  // Settings Tab
  if (activeTab === 'settings') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">⚙️ Settings</h2>
            <button 
              onClick={() => setActiveTab('home')} 
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-3">Account Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{userData?.full_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium">Zone Sales Manager</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Zone:</span>
                <span className="font-medium">{userData?.zone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Region:</span>
                <span className="font-medium">{userData?.region}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Employee ID:</span>
                <span className="font-medium">{userData?.employee_id}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-3">Preferences</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-700">Push Notifications</span>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-700">Email Updates</span>
                <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-3">App Info</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Version: 1.0.0</p>
              <p>Build: TAI-2025-Q1</p>
              <p>Last Updated: January 2025</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-lg"
          >
            🚪 Sign Out
          </button>
        </div>
        
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zsm" />
      </div>
    );
  }

  return null;
}

// ============================================================================
// ZSM QUICK VIEW MODAL FOR ZBM - Shows ZSM Team Summary
// ============================================================================
function ZSMQuickViewModal({ 
  isOpen, 
  onClose, 
  zsm,
  onViewAll
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  zsm: any;
  onViewAll: () => void;
}) {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && zsm) {
      loadTeamMembers();
    }
  }, [isOpen, zsm]);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'sales_executive')
        .eq('zsm', zsm.full_name)
        .order('total_points', { ascending: false });

      if (data) {
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalPoints = teamMembers.reduce((sum, se) => sum + (se.total_points || 0), 0);
  const activeCount = teamMembers.filter(se => se.total_points > 0).length;
  const totalCount = teamMembers.length;
  
  // Calculate team health
  let healthColor = '🟢';
  let healthStatus = 'Healthy';
  if (activeCount / totalCount < 0.8) {
    healthColor = '🟡';
    healthStatus = 'Needs Attention';
  }
  if (activeCount / totalCount < 0.5) {
    healthColor = '🔴';
    healthStatus = 'Critical';
  }

  // Show top 5 SEs
  const topSEs = teamMembers.slice(0, 5);

  return (
    <div 
      className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-slide-up shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 text-white px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl shadow-lg">
                {zsm.full_name.substring(0, 1)}
              </div>
              <div>
                <h3 className="text-xl">{zsm.full_name}</h3>
                <p className="text-sm text-purple-100">📍 {zsm.zone}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-xs font-medium text-gray-700">Total SEs</p>
            </div>
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              <p className="text-xs font-medium text-gray-700">Active</p>
            </div>
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 text-center shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
              <p className="text-xs font-medium text-gray-700">Total Points</p>
            </div>
          </div>
        </div>

        {/* Team Health */}
        <div className={`px-6 py-4 ${
          healthStatus === 'Healthy' ? 'bg-green-50' : 
          healthStatus === 'Needs Attention' ? 'bg-yellow-50' : 'bg-red-50'
        } border-b border-gray-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm">
                <span className="text-xl mr-2">{healthColor}</span>
                Team Health: <span className="font-semibold text-gray-900">{healthStatus}</span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {activeCount} of {totalCount} SEs have submitted
              </p>
            </div>
          </div>
        </div>

        {/* Top Performers Preview */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            🏆 Top Performers
          </h4>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : topSEs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-sm">No team members found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topSEs.map((se, index) => {
                const isActive = se.total_points > 0;
                return (
                  <div 
                    key={se.id}
                    className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-sm">
                          {se.full_name.substring(0, 1)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{se.full_name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>#{se.rank}</span>
                          <span>•</span>
                          <span className={isActive ? 'text-green-600' : 'text-gray-400'}>
                            {isActive ? '🟢 Active' : '⚪ Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-purple-600">{se.total_points || 0}</p>
                        <p className="text-xs text-gray-500">pts</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalCount > 5 && (
            <p className="text-center text-xs text-gray-500 mt-3">
              Showing top 5 of {totalCount} SEs
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-2">
          <button
            onClick={onViewAll}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            View All {totalCount} Sales Executives
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-white hover:bg-gray-100 text-gray-700 rounded-xl transition-colors border border-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ZBM DASHBOARD - Zone Business Manager View
// ============================================================================
export function ZoneBusinessLeadDashboard({ user, userData, onLogout }: any) {
  // Track page view automatically
  usePageTracking(ANALYTICS_PAGES.DASHBOARD);
  
  const [activeTab, setActiveTab] = useState('home');
  const [zones, setZones] = useState<any[]>([]);
  const [zsms, setZsms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [selectedZSM, setSelectedZSM] = useState<any>(null);
  const [showZSMModal, setShowZSMModal] = useState(false);
  const [zoneTeam, setZoneTeam] = useState<any[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  useEffect(() => {
    // Load data immediately when component mounts or when user/userData changes
    if (user || userData) {
      loadZSMs();
      loadZones();
    }
  }, [user, userData]);

  useEffect(() => {
    if (userData) {
      loadAnnouncementsForUser(userData, setAnnouncements, setUnreadAnnouncementsCount);
    }
  }, [userData]);

  const loadZSMs = async () => {
    try {
      // Use userData or user as fallback
      const currentUser = userData || user;
      const zbmName = currentUser?.full_name;
      
      console.log('🔍 ZBM Loading ZSMs for:', zbmName);
      
      if (!zbmName) {
        console.error('❌ No ZBM name found');
        setLoading(false);
        return;
      }

      // Get all ZSMs under this ZBM
      const { data: zsmData, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'zonal_sales_manager')
        .eq('zbm', zbmName);

      if (error) {
        console.error('❌ Error loading ZSMs:', error);
      }

      if (zsmData) {
        console.log('✅ Loaded ZSMs:', zsmData.length);
        setZsms(zsmData);
      } else {
        console.log('⚠️ No ZSMs found for ZBM:', zbmName);
        setZsms([]);
      }
    } catch (error) {
      console.error('Error loading ZSMs:', error);
      setLoading(false);
    }
  };

  const loadZones = async () => {
    try {
      // Use userData or user as fallback
      const currentUser = userData || user;
      const zbmName = currentUser?.full_name;
      
      if (!zbmName) {
        setLoading(false);
        return;
      }

      // Get all zones under this ZBM
      const { data: zsmData, error } = await supabase
        .from('app_users')
        .select('zone, full_name, id')
        .eq('role', 'zonal_sales_manager')
        .eq('zbm', zbmName);

      if (zsmData) {
        // Group by zone and get ZSM for each zone
        const uniqueZones = Array.from(new Set(zsmData.map(zsm => zsm.zone))).map(zone => {
          const zsm = zsmData.find(z => z.zone === zone);
          return { zone, zsm: zsm?.full_name, zsmId: zsm?.id };
        });

        // For each zone, get SE count and health
        const zonesWithData = await Promise.all(
          uniqueZones.map(async (zoneItem) => {
            const { data: seData } = await supabase
              .from('app_users')
              .select('id, total_points')
              .eq('role', 'sales_executive')
              .eq('zone', zoneItem.zone);

            const total = seData?.length || 0;
            const active = seData?.filter(se => se.total_points > 0).length || 0;

            let health = '🟢';
            let healthStatus = 'Healthy';
            if (active / total < 0.8) health = '🟡', healthStatus = 'Needs Attention';
            if (active / total < 0.5) health = '🔴', healthStatus = 'Critical';

            return {
              ...zoneItem,
              seCount: total,
              activeCount: active,
              health,
              healthStatus
            };
          })
        );

        setZones(zonesWithData);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading zones:', error);
      setLoading(false);
    }
  };

  const loadZoneTeam = async (zone: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('role', 'sales_executive')
        .eq('zone', zone)
        .order('total_points', { ascending: false });

      if (data) {
        setZoneTeam(data);
      }
    } catch (error) {
      console.error('Error loading zone team:', error);
    }
  };

  // Zone Detail View
  if (selectedZone) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => setSelectedZone(null)} className="mr-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-2xl">📍 {selectedZone.zone}</h2>
                <p className="text-sm text-gray-600">ZSM: {selectedZone.zsm}</p>
              </div>
            </div>
            <div className="text-3xl">{selectedZone.health}</div>
          </div>
        </div>

        {/* Zone Team */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <h3 className="text-lg mb-4">
            👥 Team Members ({zoneTeam.length} SEs)
          </h3>
          {zoneTeam.map((se) => (
            <div key={se.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-lg mr-3">
                  {se.full_name.substring(0, 1)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{se.full_name}</h4>
                  <p className="text-xs text-gray-600">Rank #{se.rank}</p>
                  <p className={`text-xs ${se.total_points > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {se.total_points > 0 ? '🟢 Active' : '⚪ No activity'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl text-purple-600">{se.total_points || 0}</p>
                  <p className="text-xs text-gray-600">points</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Home Tab
  if (activeTab === 'home') {
    // Use userData or user as fallback
    const currentUser = userData || user;
    const firstName = currentUser?.full_name?.split(' ')[0] || 'Manager';
    const userInitial = currentUser?.full_name?.substring(0, 1) || 'M';
    
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-3xl mb-2 text-gray-800">
                {getTimeBasedGreeting().text}, {firstName} {getTimeBasedGreeting().emoji}
              </h2>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-full shadow-sm">
                <span className="text-sm text-purple-800">👔 Zonal Business Manager</span>
              </div>
            </div>
            {/* Profile Icon with Dropdown */}
            <div className="relative flex items-center gap-2">
              {/* Announcements Button */}
              <button
                onClick={() => setShowAnnouncementsModal(true)}
                className="relative w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 hover:bg-purple-200 transition-colors shadow-lg"
                title="View Announcements"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadAnnouncementsCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full text-white text-xs flex items-center justify-center font-semibold shadow-lg animate-pulse">
                    {unreadAnnouncementsCount}
                  </div>
                )}
              </button>

              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-purple-700 transition-colors overflow-hidden"
              >
                {userData?.profile_picture ? (
                  <img src={userData.profile_picture} alt={userData?.full_name} className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden">
                    {/* User Info in Dropdown */}
                    <div className="bg-purple-600 text-white px-4 py-4">
                      <p className="font-semibold">{currentUser?.full_name}</p>
                      <div className="mt-2 pt-2 border-t border-purple-500">
                        <p className="text-xs">Role: {getRoleDisplayName(userData?.role)}</p>
                        <p className="text-xs">{zones.length} Zones • {zsms.length} ZSMs</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('profile');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center text-gray-700"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('settings');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center text-gray-700 border-t border-gray-100"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center text-red-600 border-t border-gray-200"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-20 px-6 py-6">
          {/* Top Performers Widget */}
          <div className="mb-6">
            <LeaderboardWidget 
              currentUserId={userData?.id} 
              onViewAll={() => setActiveTab('analytics')} 
            />
          </div>

          {/* Urgent Announcements Section - Only show urgent priority */}
          {announcements.filter(ann => ann.priority === 'urgent' && !ann.is_read).length > 0 && (
            <div className="mb-6 space-y-3">
              {announcements
                .filter(ann => ann.priority === 'urgent' && !ann.is_read)
                .map((ann) => (
                  <UrgentAnnouncementCard
                    key={ann.id}
                    id={ann.id}
                    title={ann.title}
                    message={ann.message}
                    created_by_name={ann.created_by_name || (ann as any).author_name || 'Unknown'}
                    created_by_role={ann.created_by_role || (ann as any).author_role || 'Staff'}
                    created_at={ann.created_at}
                    onDismiss={(id) => markAnnouncementAsRead(id, userData, announcements, setAnnouncements, setUnreadAnnouncementsCount)}
                  />
                ))}
            </div>
          )}

          {/* Programs Widget */}
          <div className="mb-6">
            <ProgramsWidgetHome onViewAll={() => setActiveTab('programs')} />
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zbm" />

        {/* ZSM Quick View Modal */}
        {selectedZSM && (
          <ZSMQuickViewModal
            isOpen={showZSMModal}
            onClose={() => {
              setShowZSMModal(false);
              setSelectedZSM(null);
            }}
            zsm={selectedZSM}
            onViewAll={() => {
              // Close modal and open full zone view
              setShowZSMModal(false);
              const zoneInfo = zones.find(z => z.zsm === selectedZSM.full_name);
              if (zoneInfo && zoneInfo.zone) {
                setSelectedZone(zoneInfo);
                loadZoneTeam(zoneInfo.zone);
              }
            }}
          />
        )}
      </div>
    );
  }

  // My Team Tab (same as home)
  if (activeTab === 'team') {
    // Use userData or user as fallback
    const currentUser = userData || user;
    const firstName = currentUser?.full_name?.split(' ')[0] || 'Manager';
    
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <h2 className="text-3xl mb-2">👥 My Team</h2>
          <p className="text-sm text-gray-600">Managing {zsms.length} Zonal Sales Managers</p>
        </div>

        {/* ZSM List */}
        <div className="flex-1 overflow-y-auto pb-20 px-6 py-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {zsms.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No ZSMs found</p>
                  <p className="text-xs text-gray-400 mt-2">Waiting for data to load...</p>
                </div>
              ) : (
                zsms.map((zsm) => {
                  // Find the zone info for this ZSM
                  const zoneInfo = zones.find(z => z.zsm === zsm.full_name) || {};
                  const isActive = zsm.total_points > 0;
                  
                  return (
                    <button
                      key={zsm.id}
                      onClick={() => {
                        setSelectedZSM(zsm);
                        setShowZSMModal(true);
                      }}
                      className="w-full bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex items-center">
                        <div className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl mr-4 shadow-lg">
                          {zsm.full_name.substring(0, 1)}
                        </div>
                        <div className="flex-1 text-left">
                          <h4 className="font-semibold text-lg">{zsm.full_name}</h4>
                          <p className="text-sm text-gray-600">📍 {zsm.zone}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs">
                              {zoneInfo.health || '🟢'} {zoneInfo.healthStatus || 'Healthy'}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className={`text-xs ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                              {isActive ? '🟢 Active' : '⚪ Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl text-purple-600 font-semibold">{zsm.total_points || 0}</p>
                          <p className="text-xs text-gray-500">Total Points</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zbm" />

        {/* ZSM Quick View Modal */}
        {selectedZSM && (
          <ZSMQuickViewModal
            isOpen={showZSMModal}
            onClose={() => {
              setShowZSMModal(false);
              setSelectedZSM(null);
            }}
            zsm={selectedZSM}
            onViewAll={() => {
              // Close modal and open full zone view
              setShowZSMModal(false);
              const zoneInfo = zones.find(z => z.zsm === selectedZSM.full_name);
              if (zoneInfo && zoneInfo.zone) {
                setSelectedZone(zoneInfo);
                loadZoneTeam(zoneInfo.zone);
              }
            }}
          />
        )}

        {/* Announcements Modal */}
        {showAnnouncementsModal && (
          <AnnouncementsModal
            onClose={() => setShowAnnouncementsModal(false)}
            announcements={announcements}
            onMarkAsRead={(id) => markAnnouncementAsRead(id, userData, announcements, setAnnouncements, setUnreadAnnouncementsCount)}
          />
        )}
      </div>
    );
  }

  // Explore Tab
  if (activeTab === 'explore') {
    return (
      <SocialFeed user={user} userData={userData} onBack={() => setActiveTab('home')} />
    );
  }

  // Leaderboard Tab
  if (activeTab === 'leaderboard') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <LeaderboardEnhancedUnified 
          currentUserId={userData?.id}
          currentUserData={userData}
          showBackButton={true}
          onBack={() => setActiveTab('home')}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zbm" />
      </div>
    );
  }

  // Analytics Tab
  if (activeTab === 'analytics') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <LeaderboardEnhancedUnified 
          currentUserId={userData?.id}
          currentUserData={userData}
          showBackButton={true}
          onBack={() => setActiveTab('home')}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zbm" />
      </div>
    );
  }

  // Programs Tab
  if (activeTab === 'programs') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <ProgramsDashboard onBack={() => setActiveTab('home')} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zbm" />
      </div>
    );
  }

  // Submissions Analytics Tab
  if (activeTab === 'submissions') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20">
          <SubmissionsAnalytics 
            userRole="zonal_business_manager"
            userZone={userData?.zone}
            userName={userData?.full_name}
          />
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zbm" />
      </div>
    );
  }

  // Profile Tab
  if (activeTab === 'profile') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <UserProfileModal
          userId={userData?.id}
          currentUser={userData}
          isOwnProfile={true}
          onClose={() => setActiveTab('home')}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zbm" />

        {/* Announcements Modal */}
        {showAnnouncementsModal && (
          <AnnouncementsModal
            onClose={() => setShowAnnouncementsModal(false)}
            announcements={announcements}
            onMarkAsRead={(id) => markAnnouncementAsRead(id, userData, announcements, setAnnouncements, setUnreadAnnouncementsCount)}
          />
        )}
      </div>
    );
  }

  // Settings Tab
  if (activeTab === 'settings') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">⚙️ Settings</h2>
            <button 
              onClick={() => setActiveTab('home')} 
              className="text-gray-600 hover:text-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-3">Account Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{userData?.full_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium">Zonal Business Manager</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Zone:</span>
                <span className="font-medium">{userData?.zone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Region:</span>
                <span className="font-medium">{userData?.region}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">ZBM:</span>
                <span className="font-medium">{userData?.zbm || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Employee ID:</span>
                <span className="font-medium">{userData?.employee_id}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-3">Team Overview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Zones Managed:</span>
                <span className="font-medium">{zones.length}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">ZSMs Supervised:</span>
                <span className="font-medium">{zsms.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-3">Preferences</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-700">Push Notifications</span>
                <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-700">Email Updates</span>
                <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-lg mb-3">App Info</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Version: 1.0.0</p>
              <p>Build: TAI-2025-Q1</p>
              <p>Last Updated: January 2025</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-lg"
          >
            🚪 Sign Out
          </button>
        </div>
        
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="zbm" />
      </div>
    );
  }

  return null;
}

// ============================================================================
// HQ DASHBOARD - Command Center View
// ============================================================================
export function HQDashboard({ user, userData, onLogout }: any) {
  // Track page view automatically
  usePageTracking(ANALYTICS_PAGES.DASHBOARD);
  
  const [activeTab, setActiveTab] = useState('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);

  // Load announcements
  useEffect(() => {
    loadAnnouncementsForUser(userData, setAnnouncements, setUnreadAnnouncementsCount);
  }, [userData]);

  if (activeTab === 'home') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-3xl mb-2 text-gray-800">
                {getTimeBasedGreeting().text}, {userData?.full_name?.split(' ')[0]} {getTimeBasedGreeting().emoji}
              </h2>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-full shadow-sm">
                <span className="text-sm text-green-800">🏢 {userData?.job_title || 'HQ Command Center'}</span>
              </div>
            </div>
            {/* Profile Icon with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-green-700 transition-colors overflow-hidden"
              >
                {userData?.profile_picture ? (
                  <img src={userData.profile_picture} alt={userData?.full_name} className="w-full h-full object-cover" />
                ) : (
                  userData?.full_name?.substring(0, 1)
                )}
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden">
                    {/* User Info in Dropdown */}
                    <div className="bg-green-600 text-white px-4 py-4">
                      <p className="font-semibold">{userData?.full_name}</p>
                      <div className="mt-2 pt-2 border-t border-green-500">
                        <p className="text-xs">Role: {userData?.job_title || getRoleDisplayName(userData?.role)}</p>
                        <p className="text-xs">Organization-wide Access</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('profile');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center text-gray-700"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('settings');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center text-gray-700 border-t border-gray-200"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center text-red-600 border-t border-gray-200"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-6">
          <LeaderboardWidget 
            currentUserId={userData?.id} 
            onViewAll={() => setActiveTab('users')} 
          />

          {/* Van Calendar Widget for HQ */}
          <div className="mt-6">
            <VanCalendarWidgetHQ onViewAll={() => {
              // Navigate to programs tab - Van Calendar is accessible there
              setActiveTab('programs');
            }} />
          </div>

          {/* Urgent Announcements Section - Only show urgent priority */}
          {announcements.filter(ann => ann.priority === 'urgent' && !ann.is_read).length > 0 && (
            <div className="mt-6 space-y-3">
              {announcements
                .filter(ann => ann.priority === 'urgent' && !ann.is_read)
                .map((ann) => (
                  <UrgentAnnouncementCard
                    key={ann.id}
                    id={ann.id}
                    title={ann.title}
                    message={ann.message}
                    created_by_name={ann.created_by_name || (ann as any).author_name || 'Unknown'}
                    created_by_role={ann.created_by_role || (ann as any).author_role || 'Staff'}
                    created_at={ann.created_at}
                    onDismiss={(id) => markAnnouncementAsRead(id, userData, announcements, setAnnouncements, setUnreadAnnouncementsCount)}
                  />
                ))}
            </div>
          )}

          {/* Programs Widget */}
          <div className="mt-6">
            <ProgramsWidgetHome onViewAll={() => setActiveTab('programs')} />
          </div>
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="hq" />
      </div>
    );
  }

  // Explore Tab
  if (activeTab === 'explore') {
    return (
      <SocialFeed user={user} userData={userData} onBack={() => setActiveTab('home')} />
    );
  }

  // Leaderboard Tab (also handles 'users' for backwards compatibility)
  if (activeTab === 'leaderboard' || activeTab === 'users') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <LeaderboardEnhancedUnified 
          currentUserId={userData?.id}
          currentUserData={userData}
          showBackButton={false}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="hq" />
      </div>
    );
  }

  // Programs Tab
  if (activeTab === 'programs') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <ProgramsDashboard onBack={() => setActiveTab('home')} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="hq" />
      </div>
    );
  }

  // Submissions Tab
  if (activeTab === 'submissions') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20">
          <SubmissionsAnalytics 
            userRole="hq_staff"
          />
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="hq" />
      </div>
    );
  }

  // Reports Tab
  if (activeTab === 'reports') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <h2 className="text-2xl text-gray-800">📊 Reports</h2>
        </div>
        <div className="flex-1 overflow-y-auto pb-20 p-6">
          <p className="text-center text-gray-600">Reports coming soon</p>
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="hq" />
      </div>
    );
  }

  // Settings Tab
  if (activeTab === 'settings') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <SettingsScreen user={userData} onBack={() => setActiveTab('home')} onLogout={onLogout} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="hq" />
      </div>
    );
  }

  // Profile Tab
  if (activeTab === 'profile') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <UserProfileModal
          userId={userData?.id}
          currentUser={userData}
          isOwnProfile={true}
          onClose={() => setActiveTab('home')}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="hq" />
      </div>
    );
  }

  return null;
}

// ============================================================================
// DIRECTOR DASHBOARD - Executive View
// ============================================================================
export function DirectorDashboard({ user, userData, onLogout }: any) {
  // Track page view automatically
  usePageTracking(ANALYTICS_PAGES.DASHBOARD);
  
  const [activeTab, setActiveTab] = useState('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);

  // Load announcements
  useEffect(() => {
    loadAnnouncementsForUser(userData, setAnnouncements, setUnreadAnnouncementsCount);
  }, [userData]);

  if (activeTab === 'home') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-3xl mb-2 text-gray-800">
                {getTimeBasedGreeting().text}, {userData?.full_name?.split(' ')[0]} {getTimeBasedGreeting().emoji}
              </h2>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-full shadow-sm">
                <span className="text-sm text-yellow-800">👑 S&D Director</span>
              </div>
            </div>
            {/* Profile Icon with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-yellow-700 transition-colors overflow-hidden"
              >
                {userData?.profile_picture ? (
                  <img src={userData.profile_picture} alt={userData?.full_name} className="w-full h-full object-cover" />
                ) : (
                  userData?.full_name?.substring(0, 1)
                )}
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-20 overflow-hidden">
                    {/* User Info in Dropdown */}
                    <div className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-4">
                      <p className="font-semibold">{userData?.full_name}</p>
                      <div className="mt-2 pt-2 border-t border-yellow-500">
                        <p className="text-xs">Role: {userData?.job_title || getRoleDisplayName(userData?.role)}</p>
                        <p className="text-xs">Executive Leadership</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('profile');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center text-gray-700"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('settings');
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center text-gray-700 border-t border-gray-200"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center text-red-600 border-t border-gray-200"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-6">
          <p className="text-center text-gray-600 mb-6">Director Dashboard - Executive KPIs</p>
          
          {/* Urgent Announcements Section - Only show urgent priority */}
          {announcements.filter(ann => ann.priority === 'urgent' && !ann.is_read).length > 0 && (
            <div className="mb-6 space-y-3">
              {announcements
                .filter(ann => ann.priority === 'urgent' && !ann.is_read)
                .map((ann) => (
                  <UrgentAnnouncementCard
                    key={ann.id}
                    id={ann.id}
                    title={ann.title}
                    message={ann.message}
                    created_by_name={ann.created_by_name || (ann as any).author_name || 'Unknown'}
                    created_by_role={ann.created_by_role || (ann as any).author_role || 'Staff'}
                    created_at={ann.created_at}
                    onDismiss={(id) => markAnnouncementAsRead(id, userData, announcements, setAnnouncements, setUnreadAnnouncementsCount)}
                  />
                ))}
            </div>
          )}
          
          {/* Developer Mode Toggle - Only for Christopher */}
          {(userData?.full_name?.toLowerCase().includes('christopher') || 
            userData?.full_name?.toLowerCase().includes('chris')) && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-2xl p-6 mb-6">
              <div className="text-center">
                <p className="text-2xl mb-3">💻</p>
                <p className="text-sm font-semibold text-gray-800 mb-2">Developer Access Available</p>
                <p className="text-xs text-gray-600 mb-4">
                  Click below to switch to Developer Dashboard with full system analytics
                </p>
                <button
                  onClick={async () => {
                    if (!confirm('Switch to Developer Dashboard?\n\nYou will need to logout and login again for changes to take effect.')) {
                      return;
                    }
                    
                    try {
                      const { error } = await supabase
                        .from('app_users')
                        .update({ role: 'developer' })
                        .eq('id', userData.id);

                      if (error) {
                        alert('Error updating role: ' + error.message);
                        return;
                      }

                      alert('✅ Role updated to Developer!\n\nLogging out now...');
                      setTimeout(() => {
                        onLogout();
                      }, 1000);
                    } catch (error: any) {
                      alert('Error: ' + error.message);
                    }
                  }}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors shadow-lg font-semibold"
                >
                  🔧 Enable Developer Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  // Explore Tab
  if (activeTab === 'explore') {
    return (
      <SocialFeed user={user} userData={userData} onBack={() => setActiveTab('home')} />
    );
  }

  // Leaderboard Tab
  if (activeTab === 'leaderboard') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <LeaderboardEnhancedUnified 
          currentUserId={userData?.id}
          currentUserData={userData}
          showBackButton={false}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  // Programs Tab
  if (activeTab === 'programs') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <ProgramsDashboard onBack={() => setActiveTab('home')} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  // Submissions Analytics Tab
  if (activeTab === 'submissions') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-20">
          <SubmissionsAnalytics 
            userRole="director"
          />
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  // Settings Tab
  if (activeTab === 'settings') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <SettingsScreen user={userData} onBack={() => setActiveTab('home')} onLogout={onLogout} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  // Profile Tab
  if (activeTab === 'profile') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <UserProfileModal
          userId={userData?.id}
          currentUser={userData}
          isOwnProfile={true}
          onClose={() => setActiveTab('home')}
        />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  return null;
}

// ============================================================================
// BOTTOM NAVIGATION COMPONENT
// ============================================================================
function BottomNav({ activeTab, setActiveTab, role }: { activeTab: string; setActiveTab: (tab: string) => void; role: string }) {
  const navItems: any = {
    zsm: [
      { id: 'home', icon: '🏠' },
      { id: 'explore', icon: '🔍' },
      { id: 'submissions', icon: '📊' },
      { id: 'leaderboard', icon: '🏆' },
      { id: 'team', icon: '👥' }
    ],
    zbm: [
      { id: 'home', icon: '🏠' },
      { id: 'explore', icon: '🔍' },
      { id: 'submissions', icon: '📊' },
      { id: 'leaderboard', icon: '🏆' },
      { id: 'team', icon: '👥' }
    ],
    hq: [
      { id: 'home', icon: '🏠' },
      { id: 'explore', icon: '🔍' },
      { id: 'submissions', icon: '📊' },
      { id: 'leaderboard', icon: '🏆' },
      { id: 'users', icon: '👥' }
    ],
    director: [
      { id: 'home', icon: '🏠' },
      { id: 'explore', icon: '🔍' },
      { id: 'submissions', icon: '📊' },
      { id: 'leaderboard', icon: '🏆' }
    ]
  };

  const items = navItems[role] || navItems.zsm;

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0">
      <div className="flex items-center justify-around">
        {items.map((item: any) => (
          <button
            key={item.id}
            data-testid={`sales-${item.id}-btn`}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-2 transition-colors ${
              activeTab === item.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}