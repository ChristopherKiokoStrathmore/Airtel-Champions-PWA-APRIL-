import { useState, useEffect } from 'react';
import { getAnnouncements, createAnnouncement, getCurrentUser } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'normal' | 'high' | 'urgent';
  target_audience: string;
  created_at: string;
  created_by?: {
    full_name?: string;
  };
}

export function AnnouncementsManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [audience, setAudience] = useState('all');
  const [region, setRegion] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current user (may be null for admin dashboard - that's okay)
      const { data: user } = await getCurrentUser();
      setCurrentUser(user);

      // Load announcements
      const { data, error: apiError } = await getAnnouncements();
      if (apiError) throw new Error(apiError);

      setAnnouncements(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      alert('Please fill in both title and message');
      return;
    }

    if (!currentUser) {
      alert('User not authenticated');
      return;
    }

    setSending(true);
    try {
      const targetAudience = audience === 'region' && region 
        ? `${region} Region` 
        : audience === 'all' 
        ? 'All SEs' 
        : audience;

      const { error } = await createAnnouncement({
        title,
        message,
        priority,
        target_audience: targetAudience,
        created_by: currentUser.id
      });

      if (error) throw new Error(error);

      // Clear form
      setTitle('');
      setMessage('');
      setPriority('normal');
      setAudience('all');
      setRegion('');

      // Reload announcements
      await loadData();

      alert('Announcement sent successfully!');
    } catch (err: any) {
      alert('Error sending announcement: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🚨';
      case 'high':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Announcements</h1>
        <p className="text-gray-600">Send updates and alerts to Sales Executives</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Announcement Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Announcement</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., New Competitor Promo Spotted"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your announcement message here..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.length} characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as 'normal' | 'high' | 'urgent')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                  >
                    <option value="normal">Normal - General updates</option>
                    <option value="high">High - Important news</option>
                    <option value="urgent">Urgent - Critical alerts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                  >
                    <option value="all">All Sales Executives</option>
                    <option value="region">Specific Region</option>
                    <option value="top-performers">Top Performers</option>
                    <option value="new-ses">New SEs</option>
                  </select>
                </div>
              </div>

              {audience === 'region' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                  >
                    <option value="">Choose region...</option>
                    <option value="Nairobi">Nairobi</option>
                    <option value="Mombasa">Mombasa</option>
                    <option value="Kisumu">Kisumu</option>
                    <option value="Nakuru">Nakuru</option>
                    <option value="Eldoret">Eldoret</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSend}
                  disabled={sending || !title.trim() || !message.trim()}
                  className="flex-1 px-6 py-3 bg-[#E60000] text-white rounded-lg font-medium hover:bg-[#CC0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : '📢 Send Announcement'}
                </button>
                <button
                  onClick={() => {
                    setTitle('');
                    setMessage('');
                    setPriority('normal');
                    setAudience('all');
                    setRegion('');
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Announcements</h2>
            
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No announcements yet</p>
                <p className="text-sm text-gray-400 mt-2">Create your first announcement above</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className={`p-4 rounded-lg border-2 ${getPriorityColor(announcement.priority)}`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-2xl">{getPriorityIcon(announcement.priority)}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{announcement.title}</h3>
                        <p className="text-sm text-gray-700 mb-3">{announcement.message}</p>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span className="font-medium">{announcement.target_audience}</span>
                          <div className="flex items-center gap-4">
                            <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                            <span>By {announcement.created_by?.full_name || 'Admin'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Templates Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-[#E60000] to-[#CC0000] rounded-xl p-6 text-white">
            <h3 className="font-bold mb-4">📝 Quick Templates</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setTitle('Weekend Bonus Active');
                  setMessage('All submissions this weekend will receive 2x points! Great opportunity to climb the leaderboard.');
                  setPriority('high');
                }}
                className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                🎁 Weekend Bonus
              </button>
              <button
                onClick={() => {
                  setTitle('New Competitor Activity Detected');
                  setMessage('Increased competitor activity has been detected in your region. Please document any new promotions or campaigns you observe.');
                  setPriority('urgent');
                }}
                className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                🚨 Competitor Alert
              </button>
              <button
                onClick={() => {
                  setTitle('Congratulations to Top Performers');
                  setMessage('Amazing work this week! Special recognition to our top performers. Keep up the excellent intelligence gathering!');
                  setPriority('normal');
                }}
                className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                ⭐ Recognition
              </button>
              <button
                onClick={() => {
                  setTitle('System Maintenance Notice');
                  setMessage('The app will undergo scheduled maintenance tonight from 11 PM to 1 AM. Please plan your submissions accordingly.');
                  setPriority('high');
                }}
                className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                🔧 Maintenance
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">📊 Announcement Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Sent:</span>
                <span className="font-bold text-gray-900">{announcements.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Week:</span>
                <span className="font-bold text-gray-900">
                  {announcements.filter(a => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(a.created_at) > weekAgo;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Urgent:</span>
                <span className="font-bold text-red-600">
                  {announcements.filter(a => a.priority === 'urgent').length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              <span className="font-medium">💡 Tip:</span> Use urgent priority sparingly to maintain impact. High-priority announcements are best for important updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}