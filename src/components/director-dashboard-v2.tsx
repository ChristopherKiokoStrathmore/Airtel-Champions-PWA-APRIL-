import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { SocialFeed } from './social-feed';
import { LeaderboardWidget, LeaderboardEnhancedUnified } from './leaderboard-enhanced-unified';
import { ProfileDropdown } from './profile-dropdown';
import { ProfileScreenEnhanced } from './profile-screen-enhanced';
import { SettingsScreen } from './settings-screen';
import { ProgramsDashboard } from './programs/programs-dashboard';
import { ProgramsWidgetHome } from './programs/programs-widget-home';
import { ExploreFeed } from './explore-feed';
import { CreateAnnouncementModal } from './create-announcement-modal';
import { UrgentAnnouncementCard } from './urgent-announcement-card';
import { getAnnouncements } from '../lib/supabase';

// Time-sensitive greeting helper
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good morning', emoji: '🌤️' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
  if (hour >= 17 && hour < 21) return { text: 'Good evening', emoji: '🌆' };
  return { text: 'Good night', emoji: '🌙' };
};

export function DirectorDashboardV2({ user, userData, onLogout }: any) {
  const [activeTab, setActiveTab] = useState('home');
  const [showDirectorLine, setShowDirectorLine] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [directorMessages, setDirectorMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
    loadDirectorMessages();
    loadAnnouncements();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      loadDirectorMessages();
      loadAnnouncements();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadAnnouncements = async () => {
    try {
      if (!userData) return;
      
      const { data, error } = await getAnnouncements();
      if (error) {
        console.error('[Director Dashboard] Error loading announcements:', error);
        return;
      }

      const filteredAnnouncements = data?.filter((ann: any) => 
        ann.target_roles?.includes(userData.role) || 
        ann.target_roles?.includes('all')
      ) || [];

      const announcementsWithReadStatus = filteredAnnouncements.map((announcement: any) => ({
        ...announcement,
        is_read: announcement.read_by?.includes(userData.id) || false
      }));

      setAnnouncements(announcementsWithReadStatus);
      setUnreadAnnouncementsCount(announcementsWithReadStatus.filter((a: any) => !a.is_read).length);
    } catch (error) {
      console.error('[Director Dashboard] Error loading announcements:', error);
    }
  };

  const markAnnouncementAsRead = async (announcementId: string) => {
    try {
      if (!userData) return;

      const allAnnouncements = JSON.parse(localStorage.getItem('tai_announcements') || '[]');
      
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

      localStorage.setItem('tai_announcements', JSON.stringify(updatedAnnouncements));

      setAnnouncements(announcements.map((a: any) => 
        a.id === announcementId ? { ...a, is_read: true } : a
      ));
      setUnreadAnnouncementsCount((prev: number) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[Director Dashboard] Error marking announcement as read:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('[DirectorDashboard] Loading dashboard data...');
      
      let users: any[] = [];
      let submissions: any[] = [];
      
      try {
        // Try to load from Supabase first
        const { data: usersData, error: usersError } = await supabase
          .from('app_users')
          .select('*');

        if (usersError) {
          console.warn('[DirectorDashboard] Supabase fetch failed, using mock data:', usersError.message);
          // Use mock data as fallback
          users = getMockUsers();
        } else {
          users = usersData || [];
          console.log('[DirectorDashboard] ✅ Loaded users from Supabase:', users.length);
        }
      } catch (fetchError: any) {
        console.warn('[DirectorDashboard] Network error, using mock data:', fetchError.message);
        users = getMockUsers();
      }

      // Load submissions with fallback
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select('*')
          .gte('created_at', thirtyDaysAgo.toISOString());

        if (submissionsError) {
          console.warn('[DirectorDashboard] Submissions fetch failed:', submissionsError.message);
          console.warn('[DirectorDashboard] Using real data from database instead of mock data');
          // Don't use mock data - just use empty array if there's an error
          submissions = [];
        } else {
          submissions = submissionsData || [];
          console.log('[DirectorDashboard] ✅ Loaded submissions from Supabase:', submissions.length);
        }
      } catch (fetchError: any) {
        console.warn('[DirectorDashboard] Network error loading submissions:', fetchError.message);
        submissions = [];
      }

      // Calculate stats
      const totalSEs = users.filter(u => u.role === 'sales_executive').length || 0;
      const totalZSMs = users.filter(u => u.role === 'zonal_sales_manager').length || 0;
      const totalZBMs = users.filter(u => u.role === 'zonal_business_manager').length || 0;
      const totalSubmissions = submissions.length || 0;
      const activeToday = submissions.filter(s => {
        const today = new Date().toDateString();
        return new Date(s.created_at).toDateString() === today;
      }).length || 0;

      setStats({
        totalSEs,
        totalZSMs,
        totalZBMs,
        totalSubmissions,
        activeToday,
        avgSubmissionsPerSE: totalSEs > 0 ? (totalSubmissions / totalSEs).toFixed(1) : '0'
      });

      // Get top performers (by points)
      const sorted = [...users].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      setTopPerformers(sorted.slice(0, 10));

      // Get recent submissions
      setRecentSubmissions(submissions.slice(0, 10) || []);

    } catch (error: any) {
      console.error('[DirectorDashboard] ❌ Fatal error loading dashboard data:', error);
      
      // Use mock data as absolute fallback
      const mockUsers = getMockUsers();
      const mockSubmissions = getMockSubmissions();
      
      const totalSEs = mockUsers.filter(u => u.role === 'sales_executive').length;
      const totalZSMs = mockUsers.filter(u => u.role === 'zonal_sales_manager').length;
      const totalZBMs = mockUsers.filter(u => u.role === 'zonal_business_manager').length;
      
      setStats({
        totalSEs,
        totalZSMs,
        totalZBMs,
        totalSubmissions: mockSubmissions.length,
        activeToday: 5,
        avgSubmissionsPerSE: totalSEs > 0 ? (mockSubmissions.length / totalSEs).toFixed(1) : '0'
      });
      setTopPerformers(mockUsers.slice(0, 10));
      setRecentSubmissions(mockSubmissions.slice(0, 10));
    }
  };

  const loadDirectorMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('director_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Silently handle missing table - it's optional feature
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('[DirectorDashboard] Director messages table not yet created (optional feature)');
          setDirectorMessages([]);
          setUnreadCount(0);
          return;
        }
        
        console.warn('[DirectorDashboard] Director messages fetch failed:', error.message);
        setDirectorMessages([]);
        setUnreadCount(0);
        return;
      }

      if (data) {
        setDirectorMessages(data);
        const unread = data.filter(m => m.status === 'unread').length;
        setUnreadCount(unread);
      }
    } catch (error: any) {
      // Handle network errors gracefully
      console.log('[DirectorDashboard] Director messages unavailable:', error.message || 'Network error');
      setDirectorMessages([]);
      setUnreadCount(0);
    }
  };

  // Home Tab
  if (activeTab === 'home') {
    return (
      <>
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl text-white mb-1">
                  {getTimeBasedGreeting().text} - {userData?.full_name?.split(' ')[0]} {getTimeBasedGreeting().emoji}
                </h2>
                <div className="inline-flex items-center px-3 py-1 bg-white rounded-full">
                  <span className="text-sm text-black font-semibold">{userData?.job_title || '👑 Director'}</span>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Announcement Button */}
                <button
                  onClick={() => setShowCreateAnnouncementModal(true)}
                  className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-opacity-30 transition-all hover:scale-110"
                  title="Create Announcement"
                >
                  📢
                </button>
                
                {/* Profile Icon with Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-opacity-30 transition-all"
                  >
                    {userData?.full_name?.substring(0, 1) || 'D'}
                  </button>

                  {/* Standard ProfileDropdown Component */}
                  {showProfileMenu && (
                    <ProfileDropdown
                      userName={userData?.full_name || 'Director'}
                      userInitial={userData?.full_name?.substring(0, 1) || 'D'}
                      userZone="HQ - Executive Leadership"
                      userData={userData}
                      onProfileClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('profile');
                      }}
                      onSettingsClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('settings');
                      }}
                      onLogout={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      onClose={() => setShowProfileMenu(false)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20 p-4">
            {/* Top 3 Performers Widget - FIRST THING */}
            <LeaderboardWidget 
              currentUserId={userData?.id} 
              onViewAll={() => setActiveTab('leaderboard')} 
            />

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
                      onDismiss={(id) => markAnnouncementAsRead(id)}
                    />
                  ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setShowDirectorLine(true)}
                className="relative bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 shadow-lg text-white text-left hover:scale-105 transition-transform"
              >
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg animate-pulse">
                    {unreadCount}
                  </div>
                )}
                <div className="text-3xl mb-2">💬</div>
                <div className="font-semibold text-lg">Director Line</div>
                <div className="text-xs text-orange-100">Messages from field</div>
              </button>

              <button
                onClick={() => setActiveTab('explore')}
                className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 shadow-lg text-white text-left hover:scale-105 transition-transform"
              >
                <div className="text-3xl mb-2">🌍</div>
                <div className="font-semibold text-lg">Explore</div>
                <div className="text-xs text-purple-100">Social feed</div>
              </button>

              <button
                onClick={() => setActiveTab('insights')}
                className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 shadow-lg text-white text-left hover:scale-105 transition-transform"
              >
                <div className="text-3xl mb-2">📋</div>
                <div className="font-semibold text-lg">Programs</div>
                <div className="text-xs text-blue-100">Market intelligence</div>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-4 shadow-lg text-white text-left hover:scale-105 transition-transform"
              >
                <div className="text-3xl mb-2">📊</div>
                <div className="font-semibold text-lg">Full Rankings</div>
                <div className="text-xs text-green-100">Top performers</div>
              </button>
            </div>

            {/* Executive KPIs */}
            <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>📊</span>
                <span>Executive Dashboard</span>
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{stats.totalSEs}</div>
                  <div className="text-xs text-gray-600 mt-1">Sales Executives</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{stats.totalZSMs}</div>
                  <div className="text-xs text-gray-600 mt-1">ZSMs</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{stats.totalZBMs}</div>
                  <div className="text-xs text-gray-600 mt-1">ZBMs</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.activeToday}</div>
                  <div className="text-xs text-gray-600 mt-1">Active Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.avgSubmissionsPerSE}</div>
                  <div className="text-xs text-gray-600 mt-1">Avg/SE (30d)</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <ProgramsWidgetHome onViewAll={() => setActiveTab('insights')} />
          </div>

          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
        </div>

        {/* Director Line Modal - WhatsApp Style Admin View */}
        {showDirectorLine && (
          <DirectorLineWhatsAppView 
            user={user} 
            userData={userData} 
            onClose={() => {
              setShowDirectorLine(false);
              loadDirectorMessages();
            }} 
          />
        )}

        {/* Create Announcement Modal */}
        {showCreateAnnouncementModal && (
          <CreateAnnouncementModal
            isOpen={showCreateAnnouncementModal}
            onClose={() => setShowCreateAnnouncementModal(false)}
            userData={userData}
          />
        )}
      </>
    );
  }

  // Explore Tab - Champions Feed (Social Feed)
  if (activeTab === 'explore') {
    return (
      <>
        <SocialFeed user={userData} userData={userData} onBack={() => setActiveTab('home')} />

        {/* Create Announcement Modal */}
        {showCreateAnnouncementModal && (
          <CreateAnnouncementModal
            isOpen={showCreateAnnouncementModal}
            onClose={() => setShowCreateAnnouncementModal(false)}
            userData={userData}
          />
        )}
      </>
    );
  }

  // Insights Tab
  if (activeTab === 'insights') {
    return (
      <>
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          <ProgramsDashboard onBack={() => setActiveTab('home')} />
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
        </div>

        {/* Create Announcement Modal */}
        {showCreateAnnouncementModal && (
          <CreateAnnouncementModal
            isOpen={showCreateAnnouncementModal}
            onClose={() => setShowCreateAnnouncementModal(false)}
            userData={userData}
          />
        )}
      </>
    );
  }

  // Leaderboard Tab
  if (activeTab === 'leaderboard') {
    return (
      <>
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button 
                  onClick={() => setActiveTab('home')}
                  className="text-white hover:text-green-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-2xl text-white">Full Rankings 🏆</h2>
              </div>
              
              {/* Announcement Button */}
              <button
                onClick={() => setShowCreateAnnouncementModal(true)}
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-opacity-30 transition-all hover:scale-110"
                title="Create Announcement"
              >
                📢
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20">
            <LeaderboardEnhancedUnified currentUserId={userData?.id} />
          </div>

          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
        </div>

        {/* Create Announcement Modal */}
        {showCreateAnnouncementModal && (
          <CreateAnnouncementModal
            isOpen={showCreateAnnouncementModal}
            onClose={() => setShowCreateAnnouncementModal(false)}
            userData={userData}
          />
        )}
      </>
    );
  }

  // Profile Tab
  if (activeTab === 'profile') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-5 shadow-lg">
          <h2 className="text-2xl text-white">My Profile</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-4">
          <ProfileScreenEnhanced user={userData} />
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  // Settings Tab
  if (activeTab === 'settings') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-5 shadow-lg">
          <h2 className="text-2xl text-white">Settings</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-4">
          <SettingsScreen user={userData} />
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  return null;
}

// WhatsApp Style Director Line - Grouped by sender
function DirectorLineWhatsAppView({ user, userData, onClose }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [reply, setReply] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  useEffect(() => {
    loadAllMessages();
    const interval = setInterval(loadAllMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAllMessages = async () => {
    try {
      const { data } = await supabase
        .from('director_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Group messages by conversation (not just sender)
  const groupedConversations = messages.reduce((acc: any, msg) => {
    // For messages sent BY the director, group by the recipient (visible_to)
    // For messages sent TO the director, group by the sender
    let conversationKey: string;
    let conversationName: string;
    let conversationZone: string;
    let conversationRole: string;
    
    if (msg.sender_role === 'director') {
      // This is a director's reply - group by recipient
      const recipientId = Array.isArray(msg.visible_to) ? msg.visible_to[0] : 
                         (typeof msg.visible_to === 'string' ? JSON.parse(msg.visible_to)[0] : null);
      
      if (!recipientId) return acc; // Skip if no recipient
      
      conversationKey = recipientId;
      // Find the recipient's name from other messages in the same conversation
      const recipientMsg = messages.find(m => m.sender_id === recipientId);
      conversationName = recipientMsg?.sender_name || 'Unknown User';
      conversationZone = recipientMsg?.sender_zone || 'Unknown Zone';
      conversationRole = recipientMsg?.sender_role || 'sales_executive';
    } else {
      // This is an SE's message - group by sender
      conversationKey = msg.sender_id || msg.sender_name;
      conversationName = msg.sender_name;
      conversationZone = msg.sender_zone;
      conversationRole = msg.sender_role;
    }
    
    if (!acc[conversationKey]) {
      acc[conversationKey] = {
        sender_id: conversationKey,
        sender_name: conversationName,
        sender_zone: conversationZone,
        sender_role: conversationRole,
        messages: [],
        lastMessage: msg.created_at,
        unreadCount: 0
      };
    }
    
    acc[conversationKey].messages.push(msg);
    if (msg.status === 'unread' && msg.sender_role !== 'director') {
      acc[conversationKey].unreadCount++;
    }
    if (new Date(msg.created_at) > new Date(acc[conversationKey].lastMessage)) {
      acc[conversationKey].lastMessage = msg.created_at;
    }
    return acc;
  }, {});

  const conversations = Object.values(groupedConversations).sort((a: any, b: any) => 
    new Date(b.lastMessage).getTime() - new Date(a.lastMessage).getTime()
  );

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      console.log('Adding reaction:', { messageId, emoji });
      
      // WORKAROUND: Store reaction in message text or create metadata
      // First, try to update ashish_reaction column
      let { data, error } = await supabase
        .from('director_messages')
        .update({ 
          ashish_reaction: emoji,
          status: 'read'
        })
        .eq('id', messageId)
        .select();

      // If column doesn't exist, try alternative: store in metadata JSONB
      if (error && error.code === 'PGRST204') {
        console.log('Column not found, trying metadata approach...');
        
        // Get the current message
        const { data: msgData } = await supabase
          .from('director_messages')
          .select('*')
          .eq('id', messageId)
          .single();
        
        if (msgData) {
          // Try to update using metadata or any JSONB field
          const updateResult = await supabase
            .from('director_messages')
            .update({ 
              status: 'read',
              // Store reaction info in message for now
              category: `${msgData.category || ''} [Reacted: ${emoji}]`
            })
            .eq('id', messageId)
            .select();
          
          if (updateResult.error) {
            throw updateResult.error;
          }
          
          data = updateResult.data;
          console.log('⚠️ Reaction stored in category field. Please add ashish_reaction column to database!');
          alert('⚠️ Database column missing. Please add ashish_reaction column:\n\nALTER TABLE director_messages ADD COLUMN ashish_reaction TEXT;');
        }
      } else if (error) {
        console.error('Reaction error:', error);
        alert(`Error: ${error.message}`);
        return;
      }

      console.log('Reaction added successfully:', data);
      await loadAllMessages();
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const insertEmoji = (emoji: string) => {
    setReply(reply + emoji);
    setShowEmojiPicker(false);
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedConversation) return;

    try {
      // Get the SE's ID from the conversation (not from a specific message)
      const recipientId = selectedConversation.sender_id;
      const recipientName = selectedConversation.sender_name;
      
      console.log('Sending reply as NEW message:', { 
        conversationWith: recipientName,
        recipientId: recipientId,
        reply: reply.trim(),
        directorId: userData.id,
        directorName: userData.full_name
      });
      
      // Create a NEW message for the director's reply instead of updating
      const { data, error } = await supabase
        .from('director_messages')
        .insert([{
          sender_id: userData.id,
          sender_name: userData.full_name || 'Director',
          sender_role: 'director',
          sender_zone: 'HQ',
          message: reply.trim(),
          category: 'Director Reply',
          status: 'read',
          visible_to: [recipientId], // Reply visible to original sender
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('Reply error:', error);
        alert(`❌ Error sending reply: ${error.message}`);
        return;
      }

      console.log('Reply sent successfully as new message:', data);
      
      // Also mark the original message as read
      await supabase
        .from('director_messages')
        .update({ status: 'read' })
        .eq('id', selectedConversation.messages[0].id);

      setReply('');
      await loadAllMessages();
    } catch (error: any) {
      console.error('Error sending reply:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const markConversationAsRead = async (conversation: any) => {
    try {
      const messageIds = conversation.messages.map((m: any) => m.id);
      
      await supabase
        .from('director_messages')
        .update({ status: 'read' })
        .in('id', messageIds);

      await loadAllMessages();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const viewProfile = async (senderId: string, senderName: string) => {
    try {
      const { data } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', senderId)
        .single();

      if (data) {
        setSelectedProfile(data);
        setShowProfileModal(true);
      } else {
        setSelectedProfile({ full_name: senderName, role: 'Sales Executive' });
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Conversation Detail View
  if (selectedConversation) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedConversation(null)}
              className="text-white hover:text-orange-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => viewProfile(selectedConversation.sender_id, selectedConversation.sender_name)}
              className="flex items-center gap-3 flex-1"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-600 font-bold shadow-lg">
                {getInitials(selectedConversation.sender_name)}
              </div>
              <div className="text-left">
                <h2 className="text-lg text-white font-semibold">{selectedConversation.sender_name}</h2>
                <p className="text-xs text-orange-100">{selectedConversation.sender_zone}</p>
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {selectedConversation.messages.slice().reverse().map((msg: any) => (
            <div key={msg.id} className="mb-4">
              {/* Check if this is a Director message or SE message */}
              {msg.sender_role === 'director' ? (
                /* Director's Reply - RIGHT SIDE */
                <div className="flex justify-end mb-2">
                  <div className="max-w-[80%] bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl rounded-tr-none p-4 shadow-md text-white">
                    <p>{msg.message}</p>
                    <div className="text-xs text-orange-100 mt-2">{new Date(msg.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                /* SE Message - LEFT SIDE */
                <div className="flex items-start gap-3 mb-2">
                  <button 
                    onClick={() => viewProfile(msg.sender_id, msg.sender_name)}
                    className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  >
                    {getInitials(msg.sender_name)}
                  </button>
                  <div className="flex-1">
                    <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-md max-w-[80%] relative">
                      {msg.category && (
                        <div className="text-xs text-orange-600 font-semibold mb-1">{msg.category}</div>
                      )}
                      <p className="text-gray-800">{msg.message}</p>
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((att: string, idx: number) => (
                            <div key={idx}>
                              {att.startsWith('data:image') ? (
                                <img src={att} alt="Attachment" className="rounded-lg max-w-full border-2 border-gray-200" />
                              ) : (
                                <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
                                  <span>📄</span>
                                  <span className="text-sm">File attachment</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2">{new Date(msg.created_at).toLocaleString()}</div>
                      
                      {/* Director Reaction - Positioned ABOVE the message bubble */}
                      {msg.ashish_reaction && (
                        <div className="absolute -top-3 -right-3 bg-white rounded-full shadow-lg p-1 border-2 border-orange-500">
                          <span className="text-2xl">{msg.ashish_reaction}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick React Buttons - Only show if no reaction yet */}
                    {!msg.ashish_reaction && (
                      <div className="mt-2 ml-2 flex gap-2">
                        {['👍', '❤️', '🔥', '✅'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(msg.id, emoji)}
                            className="text-2xl hover:scale-125 transition-transform p-1 bg-white rounded-full shadow-sm hover:shadow-md"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end gap-2">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-orange-600 transition-colors"
            >
              <span className="text-2xl">😊</span>
            </button>

            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none max-h-32"
              style={{ fontSize: '16px' }}
              rows={1}
            />

            <button
              onClick={handleReply}
              disabled={!reply.trim()}
              className="p-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mt-2 bg-gray-50 rounded-xl p-3 grid grid-cols-8 gap-2">
              {['😊', '👍', '❤️', '🔥', '', '👀', '💪', '', '⭐', '🚀', '💯', '😂', '🙏', '👏', '🎉', '💼'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => insertEmoji(emoji)}
                  className="text-3xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Modal */}
        {showProfileModal && selectedProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[428px] p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                  {getInitials(selectedProfile.full_name)}
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedProfile.full_name}</h2>
                <p className="text-sm text-gray-600">{selectedProfile.role}</p>
                <p className="text-sm text-gray-500">{selectedProfile.zone}</p>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500">Points</div>
                  <div className="text-2xl font-bold text-red-600">{selectedProfile.total_points || 0}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="text-sm text-gray-800">{selectedProfile.phone_number || 'N/A'}</div>
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-semibold shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Conversations List View
  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-white hover:text-orange-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="text-xl text-white font-semibold">Director Line 💬</h2>
            <p className="text-sm text-orange-100">{conversations.length} conversations</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No messages yet</h3>
            <p className="text-gray-600">Messages from SEs will appear here</p>
          </div>
        ) : (
          <div>
            {conversations.map((conv: any) => (
              <button
                key={conv.sender_id}
                onClick={() => {
                  setSelectedConversation(conv);
                  markConversationAsRead(conv);
                }}
                className="w-full text-left border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                    {getInitials(conv.sender_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">{conv.sender_name}</span>
                      {conv.unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-semibold">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conv.messages[0].message}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {conv.sender_zone} • {new Date(conv.lastMessage).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Bottom Navigation Component
function BottomNav({ activeTab, setActiveTab, role }: { activeTab: string; setActiveTab: (tab: string) => void; role: string }) {
  const navItems = [
    { id: 'home', icon: '🏠' },
    { id: 'explore', icon: '🔍' },
    { id: 'insights', icon: '📊' },
    { id: 'leaderboard', icon: '🏆' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex-shrink-0 max-w-[428px] mx-auto">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-2 transition-colors ${
              activeTab === item.id ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Mock Data Functions
function getMockUsers() {
  return [
    { id: '1', full_name: 'Alice Johnson', role: 'sales_executive', total_points: 150, zone: 'North' },
    { id: '2', full_name: 'Bob Smith', role: 'sales_executive', total_points: 120, zone: 'South' },
    { id: '3', full_name: 'Charlie Brown', role: 'sales_executive', total_points: 100, zone: 'East' },
    { id: '4', full_name: 'David Wilson', role: 'sales_executive', total_points: 90, zone: 'West' },
    { id: '5', full_name: 'Eve Davis', role: 'sales_executive', total_points: 80, zone: 'Central' },
    { id: '6', full_name: 'Frank Lee', role: 'zonal_sales_manager', total_points: 200, zone: 'North' },
    { id: '7', full_name: 'Grace Chen', role: 'zonal_sales_manager', total_points: 180, zone: 'South' },
    { id: '8', full_name: 'Hank Kim', role: 'zonal_sales_manager', total_points: 160, zone: 'East' },
    { id: '9', full_name: 'Ivy Patel', role: 'zonal_sales_manager', total_points: 140, zone: 'West' },
    { id: '10', full_name: 'Jack Lee', role: 'zonal_sales_manager', total_points: 120, zone: 'Central' },
    { id: '11', full_name: 'Karen Wong', role: 'zonal_business_manager', total_points: 250, zone: 'North' },
    { id: '12', full_name: 'Leo Tan', role: 'zonal_business_manager', total_points: 230, zone: 'South' },
    { id: '13', full_name: 'Mia Lee', role: 'zonal_business_manager', total_points: 210, zone: 'East' },
    { id: '14', full_name: 'Nina Patel', role: 'zonal_business_manager', total_points: 190, zone: 'West' },
    { id: '15', full_name: 'Oscar Kim', role: 'zonal_business_manager', total_points: 170, zone: 'Central' }
  ];
}

function getMockSubmissions() {
  return [
    { id: '1', created_at: '2023-10-01T10:00:00Z', user_id: '1' },
    { id: '2', created_at: '2023-10-01T11:00:00Z', user_id: '2' },
    { id: '3', created_at: '2023-10-01T12:00:00Z', user_id: '3' },
    { id: '4', created_at: '2023-10-01T13:00:00Z', user_id: '4' },
    { id: '5', created_at: '2023-10-01T14:00:00Z', user_id: '5' },
    { id: '6', created_at: '2023-10-01T15:00:00Z', user_id: '6' },
    { id: '7', created_at: '2023-10-01T16:00:00Z', user_id: '7' },
    { id: '8', created_at: '2023-10-01T17:00:00Z', user_id: '8' },
    { id: '9', created_at: '2023-10-01T18:00:00Z', user_id: '9' },
    { id: '10', created_at: '2023-10-01T19:00:00Z', user_id: '10' },
    { id: '11', created_at: '2023-10-01T20:00:00Z', user_id: '11' },
    { id: '12', created_at: '2023-10-01T21:00:00Z', user_id: '12' },
    { id: '13', created_at: '2023-10-01T22:00:00Z', user_id: '13' },
    { id: '14', created_at: '2023-10-01T23:00:00Z', user_id: '14' },
    { id: '15', created_at: '2023-10-02T00:00:00Z', user_id: '15' }
  ];
}