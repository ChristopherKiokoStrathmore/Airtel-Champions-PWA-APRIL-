import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { RoleBadge } from './role-badge';
import { StatsCards } from './profile/stats-cards';
import { PostsGridTab } from './profile/posts-grid-tab';
import { ActivityTab } from './profile/activity-tab';
import { StatsTab } from './profile/stats-tab';
import { BioEditor } from './profile/bio-editor';
import { BannerUpload } from './profile/banner-upload';
import { ProfilePictureUpload } from './profile/profile-picture-upload';

interface UserProfileModalProps {
  userId: string;
  currentUser: any;
  isOwnProfile: boolean;
  onClose: () => void;
}

export function UserProfileModal({ userId, currentUser, isOwnProfile, onClose }: UserProfileModalProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'activity' | 'stats'>('posts');
  const [showBioEditor, setShowBioEditor] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        setLoading(false);
        return;
      }

      setUser(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setLoading(false);
    }
  };

  const handleBioSave = (newBio: string) => {
    setUser({ ...user, bio: newBio });
    setShowBioEditor(false);
  };

  const handleBannerUpload = (newUrl: string) => {
    setUser({ ...user, banner_url: newUrl });
  };

  const handleAvatarUpload = (newUrl: string) => {
    setUser({ ...user, avatar_url: newUrl, profile_picture: newUrl });
    
    // Update localStorage if this is the current user
    const storedUser = localStorage.getItem('tai_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.id === userId) {
          userData.profile_picture = newUrl;
          userData.avatar_url = newUrl;
          localStorage.setItem('tai_user', JSON.stringify(userData));
          
          // Force a re-render by dispatching a storage event
          window.dispatchEvent(new Event('storage'));
        }
      } catch (error) {
        console.error('Failed to update localStorage:', error);
      }
    }
  };

  const getJoinDate = () => {
    if (!user?.created_at) return 'Recently';
    const date = new Date(user.created_at);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl w-full max-w-2xl p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-2xl font-semibold mb-2">User not found</h3>
          <p className="text-gray-600 mb-6">This user profile could not be loaded.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col my-8">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{isOwnProfile ? 'My Profile' : `${user.full_name}'s Profile`}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Banner */}
          <div className="relative w-full h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
            {user.banner_url && (
              <img 
                src={user.banner_url} 
                alt="Profile banner" 
                className="w-full h-full object-cover"
              />
            )}
            {isOwnProfile && (
              <BannerUpload 
                userId={userId} 
                currentBannerUrl={user.banner_url}
                onUploadComplete={handleBannerUpload}
              />
            )}
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <div className="relative inline-block">
                {(user.avatar_url || user.profile_picture) ? (
                  <img 
                    src={user.avatar_url || user.profile_picture}
                    alt={user.full_name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                    {user.full_name?.substring(0, 1)}
                  </div>
                )}
                {isOwnProfile && (
                  <ProfilePictureUpload
                    userId={userId}
                    currentAvatarUrl={user.avatar_url || user.profile_picture}
                    onUploadComplete={handleAvatarUpload}
                  />
                )}
              </div>
            </div>

            {/* Name and Role */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{user.full_name}</h1>
                {isOwnProfile && (
                  <button
                    onClick={() => setShowBioEditor(true)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                    title="Edit bio"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              <RoleBadge role={user.role} size="md" />
            </div>

            {/* Location and Join Date */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
              {user.zone && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{user.zone}{user.region ? ` • ${user.region}` : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Joined {getJoinDate()}</span>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 mb-4 italic">"{user.bio}"</p>
            )}
            {!user.bio && isOwnProfile && (
              <p className="text-gray-400 text-sm mb-4 italic">
                No bio yet. Click the edit icon to add one.
              </p>
            )}

            {/* Stats Cards */}
            <div className="mb-6">
              <StatsCards userId={userId} />
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab('posts')}
                  className={`pb-3 px-2 font-medium transition-colors relative ${
                    activeTab === 'posts'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Posts
                  {activeTab === 'posts' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`pb-3 px-2 font-medium transition-colors relative ${
                    activeTab === 'activity'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Activity
                  {activeTab === 'activity' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`pb-3 px-2 font-medium transition-colors relative ${
                    activeTab === 'stats'
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Stats
                  {activeTab === 'stats' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'posts' && <PostsGridTab userId={userId} />}
              {activeTab === 'activity' && <ActivityTab userId={userId} />}
              {activeTab === 'stats' && <StatsTab userId={userId} />}
            </div>
          </div>
        </div>
      </div>

      {/* Bio Editor Modal */}
      {showBioEditor && (
        <BioEditor
          userId={userId}
          currentBio={user.bio || ''}
          onSave={handleBioSave}
          onCancel={() => setShowBioEditor(false)}
        />
      )}
    </div>
  );
}
