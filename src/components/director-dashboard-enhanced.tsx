import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { SocialFeed } from './social-feed';
import { LeaderboardWidget, LeaderboardEnhancedUnified } from './leaderboard-enhanced-unified';
import { ExploreFeed } from './explore-feed';
import { ReportingStructure } from './reporting-structure-new';
import { VanCalendarWidgetHQ } from './van-calendar-widget-hq';

// Time-sensitive greeting helper
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Good morning', emoji: '🌤️' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
  if (hour >= 17 && hour < 21) return { text: 'Good evening', emoji: '🌆' };
  return { text: 'Good night', emoji: '🌙' };
};

export function DirectorDashboardEnhanced({ user, userData, onLogout }: any) {
  const [activeTab, setActiveTab] = useState('home');
  const [showDirectorLine, setShowDirectorLine] = useState(false);
  const [showReportingStructure, setShowReportingStructure] = useState(false);
  const [stats, setStats] = useState<any>({});
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [directorMessages, setDirectorMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
    loadDirectorMessages();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData();
      loadDirectorMessages();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all users from app_users table
      const { data: users } = await supabase
        .from('app_users')
        .select('*');

      // Load all submissions from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: submissions } = await supabase
        .from('submissions')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Calculate stats
      const totalSEs = users?.filter(u => u.role === 'sales_executive').length || 0;
      const totalZSMs = users?.filter(u => u.role === 'zonal_sales_manager').length || 0;
      const totalZBMs = users?.filter(u => u.role === 'zonal_business_manager').length || 0;
      const totalSubmissions = submissions?.length || 0;
      const activeToday = submissions?.filter(s => {
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

      // Get top performers (by points) - real data from app_users
      const sorted = [...(users || [])].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
      setTopPerformers(sorted.slice(0, 10));

      // Get recent submissions
      setRecentSubmissions(submissions?.slice(0, 10) || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadDirectorMessages = async () => {
    try {
      // Fetch all messages and filter client-side
      const { data } = await supabase
        .from('director_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        // Filter messages where visible_to contains this director's ID
        const filteredMessages = data.filter(msg => {
          if (!msg.visible_to) return false;
          
          // Handle if visible_to is a string (needs parsing) or already an array
          let visibleToArray = msg.visible_to;
          if (typeof msg.visible_to === 'string') {
            try {
              visibleToArray = JSON.parse(msg.visible_to);
            } catch (e) {
              console.error('Error parsing visible_to:', e);
              return false;
            }
          }
          
          // Skip messages with ["all"] - these are legacy messages
          if (Array.isArray(visibleToArray) && visibleToArray.includes('all')) {
            return false;
          }
          
          // Check if director's ID is in the array
          return Array.isArray(visibleToArray) && visibleToArray.includes(userData?.id);
        });

        console.log(`[Director Dashboard] Loaded ${filteredMessages.length} messages for director ${userData?.full_name} (from ${data.length} total)`);
        setDirectorMessages(filteredMessages);
        const unread = filteredMessages.filter(m => m.status === 'unread').length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error loading director messages:', error);
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
                  {getTimeBasedGreeting().text}, {userData?.full_name?.split(' ')[0]} {getTimeBasedGreeting().emoji}
                </h2>
                <div className="inline-flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-full">
                  <span className="text-sm text-white">👑 {userData?.job_title || 'Director'}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-opacity-30 transition-all"
              >
                {userData?.full_name?.substring(0, 1)}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pb-20 p-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setShowDirectorLine(true)}
                className="relative bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-4 shadow-lg text-white text-left hover:scale-105 transition-transform"
              >
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {unreadCount}
                  </div>
                )}
                <div className="text-3xl mb-2">💬</div>
                <div className="font-semibold text-lg">Director Line</div>
                <div className="text-xs text-orange-100">Messages from field</div>
              </button>

              <button
                onClick={() => setShowReportingStructure(true)}
                className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-4 shadow-lg text-white text-left hover:scale-105 transition-transform"
              >
                <div className="text-3xl mb-2">🏢</div>
                <div className="font-semibold text-lg">Organization</div>
                <div className="text-xs text-blue-100">Team structure</div>
              </button>

              <button
                onClick={() => setActiveTab('insights')}
                className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 shadow-lg text-white text-left hover:scale-105 transition-transform"
              >
                <div className="text-3xl mb-2">💡</div>
                <div className="font-semibold text-lg">Insights</div>
                <div className="text-xs text-purple-100">Market intelligence</div>
              </button>

              <button
                onClick={() => setActiveTab('leaderboard')}
                className="bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl p-4 shadow-lg text-white text-left hover:scale-105 transition-transform"
              >
                <div className="text-3xl mb-2">🏆</div>
                <div className="font-semibold text-lg">Leaderboard</div>
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

            {/* Van Calendar Widget for Director */}
            <div className="mb-6">
              <VanCalendarWidgetHQ onViewAll={() => {
                // Navigate to programs tab
                setActiveTab('programs');
              }} />
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🌟</span>
                <span>Top Performers</span>
              </h3>
              
              {topPerformers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-sm">No performance data yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topPerformers.slice(0, 5).map((performer, index) => (
                    <div key={performer.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                        'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">{performer.full_name}</div>
                        <div className="text-xs text-gray-500">{performer.zone || 'N/A'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{performer.total_points || 0}</div>
                        <div className="text-xs text-gray-500">pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-md p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>⚡</span>
                <span>Recent Activity</span>
              </h3>
              
              {recentSubmissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm">No recent submissions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSubmissions.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-800 truncate">{sub.type || 'Submission'}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(sub.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
        </div>

        {/* Director Line Modal - WhatsApp Style Admin View */}
        {showDirectorLine && (
          <DirectorLineAdminView 
            user={user} 
            userData={userData} 
            onClose={() => {
              setShowDirectorLine(false);
              loadDirectorMessages();
            }} 
          />
        )}

        {/* Reporting Structure Modal */}
        {showReportingStructure && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[428px] max-h-[90vh] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl text-white">Organization Structure</h2>
                <button
                  onClick={() => setShowReportingStructure(false)}
                  className="text-white hover:text-blue-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ReportingStructure currentUser={userData} />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Explore Tab
  if (activeTab === 'explore') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <ExploreFeed currentUser={userData} />
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  // Insights Tab
  if (activeTab === 'insights') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl text-white">Market Insights 💡</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-4">
          <div className="bg-white rounded-2xl shadow-md p-5 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Intelligence Feed</h3>
            
            {directorMessages.filter(m => m.category?.includes('Intelligence')).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-sm">No market intelligence yet</p>
                <p className="text-xs mt-2">SEs will share competitor insights here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {directorMessages
                  .filter(m => m.category?.includes('Intelligence'))
                  .slice(0, 10)
                  .map((msg) => (
                    <div key={msg.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">📈</div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800 mb-1">{msg.sender_name}</div>
                          <p className="text-sm text-gray-700 mb-2">{msg.message}</p>
                          <div className="text-xs text-gray-500">
                            {msg.sender_zone} • {new Date(msg.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  // Leaderboard Tab
  if (activeTab === 'leaderboard') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-5 shadow-lg">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('home')}
              className="text-white hover:text-green-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl text-white">Leaderboard 🏆</h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-4">
          <div className="bg-white rounded-2xl shadow-md p-5">
            {topPerformers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-3">🏆</div>
                <p className="text-sm">No rankings yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((performer, index) => (
                  <div key={performer.id} className={`p-4 rounded-xl border-2 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-400' :
                    index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-400' :
                    index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400' :
                    'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xl ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg' :
                        index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg' :
                        'bg-gradient-to-br from-blue-400 to-blue-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{performer.full_name}</div>
                        <div className="text-sm text-gray-600">{performer.zone || 'N/A'}</div>
                        <div className="text-xs text-gray-500 mt-1">{performer.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">{performer.total_points || 0}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  // Reports Tab
  if (activeTab === 'reports') {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 shadow-lg">
          <h2 className="text-2xl text-white">Reports 📊</h2>
        </div>

        <div className="flex-1 overflow-y-auto pb-20 p-4">
          <div className="bg-white rounded-2xl shadow-md p-5 mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Summary</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Total Submissions (30 days)</div>
                <div className="text-3xl font-bold text-blue-600">{stats.totalSubmissions}</div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border border-green-200">
                <div className="text-sm text-gray-600 mb-1">Active Users Today</div>
                <div className="text-3xl font-bold text-green-600">{stats.activeToday}</div>
              </div>

              <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="text-sm text-gray-600 mb-1">Average per SE</div>
                <div className="text-3xl font-bold text-orange-600">{stats.avgSubmissionsPerSE}</div>
              </div>
            </div>
          </div>

          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">📈</div>
            <p className="text-sm">Advanced reports coming soon</p>
          </div>
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="director" />
      </div>
    );
  }

  return null;
}

// Director Line Admin View - See messages assigned to this director
function DirectorLineAdminView({ user, userData, onClose }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    loadAllMessages();
    const interval = setInterval(loadAllMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAllMessages = async () => {
    try {
      // Fetch all messages and filter client-side
      const { data } = await supabase
        .from('director_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        // Filter messages where visible_to contains this director's ID
        const filteredMessages = data.filter(msg => {
          if (!msg.visible_to) return false;
          
          // Handle if visible_to is a string (needs parsing) or already an array
          let visibleToArray = msg.visible_to;
          if (typeof msg.visible_to === 'string') {
            try {
              visibleToArray = JSON.parse(msg.visible_to);
            } catch (e) {
              console.error('Error parsing visible_to:', e);
              return false;
            }
          }
          
          // Skip messages with ["all"] - these are legacy messages
          if (Array.isArray(visibleToArray) && visibleToArray.includes('all')) {
            return false;
          }
          
          // Check if director's ID is in the array
          return Array.isArray(visibleToArray) && visibleToArray.includes(userData?.id);
        });

        console.log(`[Director Line Admin] Loaded ${filteredMessages.length} messages for ${userData?.full_name} (from ${data.length} total)`);
        setMessages(filteredMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      await supabase
        .from('director_messages')
        .update({ 
          director_reaction: emoji,  // Changed from ashish_reaction to director_reaction
          status: 'read'
        })
        .eq('id', messageId);

      await loadAllMessages();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!reply.trim()) return;

    try {
      console.log('Sending reply:', { messageId, reply: reply.trim() });
      
      const { data, error } = await supabase
        .from('director_messages')
        .update({ 
          ashish_reply: reply.trim(),
          ashish_reply_time: new Date().toISOString(),
          status: 'read'
        })
        .eq('id', messageId)
        .select();

      if (error) {
        console.error('Reply error:', error);
        alert(`❌ Error sending reply: ${error.message}\n\nPlease run the SQL migration in /ADD_DIRECTOR_REACTION_COLUMN.sql`);
        return;
      }

      console.log('Reply sent successfully:', data);
      setReply('');
      setSelectedMessage(null);
      await loadAllMessages();
    } catch (error: any) {
      console.error('Error adding reply:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('director_messages')
        .update({ status: 'read' })
        .eq('id', messageId);

      await loadAllMessages();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (selectedMessage) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-orange-50 to-red-50 z-50 flex flex-col">
        <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedMessage(null)}
              className="text-white hover:text-orange-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h2 className="text-xl text-white">{selectedMessage.sender_name}</h2>
              <p className="text-sm text-orange-100">{selectedMessage.sender_zone}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="text-2xl">{selectedMessage.category?.split(' ')[0] || '💬'}</div>
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-2">{selectedMessage.category}</div>
                <p className="text-gray-800 mb-3">{selectedMessage.message}</p>
                
                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                  <div className="space-y-2">
                    {selectedMessage.attachments.map((att: string, idx: number) => (
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

                <div className="text-xs text-gray-500 mt-3">
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Reactions */}
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
            <h3 className="font-semibold text-gray-800 mb-3">Quick React</h3>
            <div className="flex gap-3 flex-wrap">
              {['👍', '❤️', '🔥', '✅', '👀', '💪', '🎯', '⭐'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(selectedMessage.id, emoji)}
                  className="text-4xl hover:scale-125 transition-transform p-2"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Reply */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Send Reply</h3>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={4}
              style={{ fontSize: '16px' }}
            />
            <button
              onClick={() => handleReply(selectedMessage.id)}
              disabled={!reply.trim()}
              className="w-full mt-3 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Reply
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-50 to-red-50 z-50 flex flex-col">
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
            <h2 className="text-xl text-white">Director Line 💬</h2>
            <p className="text-sm text-orange-100">{messages.length} messages from field</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No messages yet</h3>
            <p className="text-gray-600">Messages from SEs will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <button
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (msg.status === 'unread') markAsRead(msg.id);
                }}
                className="w-full text-left bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{msg.category?.split(' ')[0] || '💬'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">{msg.sender_name}</span>
                      {msg.status === 'unread' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-semibold">New</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">{msg.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{msg.sender_zone}</span>
                      <span>•</span>
                      <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {msg.ashish_reaction && (
                    <div className="text-2xl">{msg.ashish_reaction}</div>
                  )}
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
    { id: 'insights', icon: '💡' },
    { id: 'leaderboard', icon: '🏆' },
    { id: 'reports', icon: '📊' }
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