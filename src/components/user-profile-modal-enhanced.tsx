import { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Award, TrendingUp, Users, MessageCircle, Heart, Image as ImageIcon, Edit2, Camera } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface UserProfileModalProps {
  userId: string;
  currentUser: any;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  zone: string;
  region: string;
  employee_id: string;
  profile_picture: string | null;
  bio: string | null;
  profile_banner: string | null;
  banner_color: string | null;
  created_at: string;
  total_points: number;
  rank: number;
}

interface ActivityItem {
  id: string;
  type: 'post' | 'comment' | 'achievement' | 'submission';
  content: string;
  timestamp: string;
  icon: string;
}

export function UserProfileModalEnhanced({ userId, currentUser, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'activity' | 'stats'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [activityTimeline, setActivityTimeline] = useState<ActivityItem[]>([]);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const isOwnProfile = userId === currentUser?.id;

  useEffect(() => {
    loadUserProfile();
    loadUserPosts();
    loadAchievements();
    loadActivityTimeline();
    loadPointsHistory();
    loadFollowStatus();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      setNewBio(data?.bio || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts?filter=recent&limit=12`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const userPosts = data.posts.filter((post: any) => post.user_id === userId);
        setPosts(userPosts);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadAchievements = async () => {
    // Mock achievements for now - replace with actual API call
    const mockAchievements = [
      { id: '1', title: 'Top Performer', icon: '🏆', description: 'Ranked #1 in zone', earned_at: '2025-01-05', color: 'yellow' },
      { id: '2', title: 'Consistent Star', icon: '⭐', description: '7-day streak', earned_at: '2025-01-03', color: 'blue' },
      { id: '3', title: 'Social Butterfly', icon: '🦋', description: '50+ posts created', earned_at: '2025-01-01', color: 'purple' },
    ];
    setAchievements(mockAchievements);
  };

  const loadActivityTimeline = async () => {
    try {
      // Fetch recent posts
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/posts?filter=recent&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const activities: ActivityItem[] = [];

        // Add posts
        data.posts
          .filter((post: any) => post.user_id === userId)
          .slice(0, 5)
          .forEach((post: any) => {
            activities.push({
              id: `post-${post.id}`,
              type: 'post',
              content: post.content,
              timestamp: post.created_at,
              icon: '📝'
            });
          });

        // Add comments (from posts where user commented)
        data.posts.forEach((post: any) => {
          const userComments = post.comments?.filter((c: any) => c.user_id === userId) || [];
          userComments.slice(0, 3).forEach((comment: any) => {
            activities.push({
              id: `comment-${comment.id}`,
              type: 'comment',
              content: comment.comment_text,
              timestamp: comment.created_at,
              icon: '💬'
            });
          });
        });

        // Sort by timestamp
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivityTimeline(activities.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  };

  const loadPointsHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Aggregate by day
      const dailyPoints: { [key: string]: number } = {};
      data?.forEach((entry: any) => {
        const day = new Date(entry.created_at).toLocaleDateString();
        dailyPoints[day] = (dailyPoints[day] || 0) + entry.points;
      });

      const history = Object.entries(dailyPoints).map(([date, points]) => ({
        date,
        points
      }));

      setPointsHistory(history);
    } catch (error) {
      console.error('Error loading points history:', error);
    }
  };

  const loadFollowStatus = async () => {
    try {
      // Check if current user follows this profile
      const { data: followData } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', currentUser?.id)
        .eq('following_id', userId)
        .single();

      setIsFollowing(!!followData);

      // Get follower count
      const { data: followers } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      setFollowerCount((followers as any)?.count || 0);

      // Get following count
      const { data: following } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      setFollowingCount((following as any)?.count || 0);
    } catch (error) {
      console.error('Error loading follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        // Unfollow
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser?.id)
          .eq('following_id', userId);

        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        // Follow
        await supabase
          .from('user_follows')
          .insert({
            follower_id: currentUser?.id,
            following_id: userId,
            created_at: new Date().toISOString()
          });

        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleSaveBio = async () => {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ bio: newBio })
        .eq('id', userId);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, bio: newBio } : null);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Error saving bio:', error);
      alert('Failed to save bio');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-banner-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-banners')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-banners')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('app_users')
        .update({ profile_banner: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, profile_banner: publicUrl } : null);
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert('Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const bannerColor = profile.banner_color || 'from-red-600 to-orange-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full h-full md:h-[90vh] md:max-w-4xl md:rounded-2xl overflow-hidden flex flex-col">
        {/* Banner */}
        <div className={`relative h-40 bg-gradient-to-r ${bannerColor}`}>
          {profile.profile_banner && (
            <img src={profile.profile_banner} alt="Banner" className="w-full h-full object-cover" />
          )}
          
          {/* Upload Banner Button (Own Profile Only) */}
          {isOwnProfile && (
            <label className="absolute top-3 right-3 px-3 py-2 bg-black bg-opacity-50 text-white rounded-lg text-sm cursor-pointer hover:bg-opacity-70 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              {uploadingBanner ? 'Uploading...' : 'Change Banner'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleBannerUpload}
                className="hidden"
              />
            </label>
          )}

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-3 left-3 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="px-6 -mt-16 relative z-10">
          <div className="flex items-end gap-4 mb-4">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
              {profile.profile_picture ? (
                <img src={profile.profile_picture} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-4xl font-bold">
                  {profile.full_name.charAt(0)}
                </div>
              )}
            </div>

            {/* Name & Follow Button */}
            <div className="flex-1 pb-2">
              <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
              <p className="text-sm text-gray-600">{profile.role.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
            </div>

            {/* Follow Button (if not own profile) */}
            {!isOwnProfile && (
              <button
                onClick={handleFollowToggle}
                className={`px-6 py-2 rounded-xl font-semibold transition-colors mb-2 ${
                  isFollowing 
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isFollowing ? 'Following' : '+ Follow'}
              </button>
            )}
          </div>

          {/* Bio */}
          <div className="mb-4">
            {isEditingBio ? (
              <div className="space-y-2">
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Add a bio to tell others about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  rows={3}
                  maxLength={150}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBio}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingBio(false);
                      setNewBio(profile.bio || '');
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500">{newBio.length}/150 characters</p>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="text-sm text-gray-700 flex-1">
                  {profile.bio || (isOwnProfile ? 'Add a bio to tell others about yourself...' : 'No bio yet')}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Location & Join Date */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{profile.zone}, {profile.region}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-yellow-800">#{profile.rank}</p>
              <p className="text-xs text-yellow-700">Rank</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-800">{profile.total_points}</p>
              <p className="text-xs text-green-700">Points</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-800">{posts.length}</p>
              <p className="text-xs text-blue-700">Posts</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-800">{followerCount}</p>
              <p className="text-xs text-purple-700">Followers</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-pink-800">{followingCount}</p>
              <p className="text-xs text-pink-700">Following</p>
            </div>
          </div>

          {/* Top 3 Achievements */}
          {achievements.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Top Achievements
              </h3>
              <div className="flex gap-2">
                {achievements.slice(0, 3).map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`flex-1 bg-gradient-to-br from-${achievement.color}-50 to-${achievement.color}-100 border border-${achievement.color}-200 rounded-xl p-3 text-center`}
                  >
                    <div className="text-3xl mb-1">{achievement.icon}</div>
                    <p className="text-xs font-semibold text-gray-800">{achievement.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'posts' 
                  ? 'border-red-600 text-red-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'activity' 
                  ? 'border-red-600 text-red-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'stats' 
                  ? 'border-red-600 text-red-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Stats
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div>
              {posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => (
                    <div key={post.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {post.image_url ? (
                        <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-3">
                          <p className="text-xs text-gray-700 line-clamp-4 text-center">{post.content}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No posts yet</p>
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h3>
              {activityTimeline.length > 0 ? (
                activityTimeline.map((activity) => (
                  <div key={activity.id} className="flex gap-3 pb-4 border-b border-gray-100">
                    <div className="text-2xl flex-shrink-0">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{activity.content}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Points Trend (Last 30 Days)
                </h3>
                
                {/* Simple Line Chart */}
                {pointsHistory.length > 0 ? (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="h-48 flex items-end justify-between gap-1">
                      {pointsHistory.map((day, index) => {
                        const maxPoints = Math.max(...pointsHistory.map(d => d.points));
                        const height = (day.points / maxPoints) * 100;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div 
                              className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t transition-all hover:opacity-80"
                              style={{ height: `${height}%` }}
                              title={`${day.date}: ${day.points} points`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-gray-600">
                      <span>{pointsHistory[0]?.date}</span>
                      <span>{pointsHistory[pointsHistory.length - 1]?.date}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <p className="text-gray-500 text-sm">No points data for the last 30 days</p>
                  </div>
                )}
              </div>

              {/* Additional Stats */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Performance Summary</h3>
                <div className="space-y-3">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Total Engagement</span>
                      <span className="text-lg font-bold text-gray-900">
                        {posts.reduce((sum, post) => sum + post.likes_count + post.comments_count, 0)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Avg. Likes per Post</span>
                      <span className="text-lg font-bold text-gray-900">
                        {posts.length > 0 ? Math.round(posts.reduce((sum, post) => sum + post.likes_count, 0) / posts.length) : 0}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Hall of Fame Posts</span>
                      <span className="text-lg font-bold text-yellow-600">
                        {posts.filter(p => p.is_hall_of_fame).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
