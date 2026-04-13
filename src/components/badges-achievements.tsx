import { useState } from 'react';
import { Award, Lock, Star, Trophy, Target, Zap, Crown, Shield } from 'lucide-react';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  progress?: number;
  target?: number;
  unlockedDate?: string;
}

interface BadgesAchievementsProps {
  onClose: () => void;
}

export function BadgesAchievements({ onClose }: BadgesAchievementsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'unlocked' | 'locked'>('all');
  
  const badges: Badge[] = [
    // Unlocked Badges
    {
      id: 1,
      name: 'First Step',
      description: 'Complete your first submission',
      icon: '🎯',
      rarity: 'bronze',
      unlocked: true,
      unlockedDate: '2024-12-20',
    },
    {
      id: 2,
      name: 'Early Bird',
      description: 'Submit before 10:00 AM for 5 days',
      icon: '🌅',
      rarity: 'silver',
      unlocked: true,
      unlockedDate: '2024-12-25',
    },
    {
      id: 3,
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      rarity: 'gold',
      unlocked: true,
      unlockedDate: '2024-12-29',
    },
    {
      id: 4,
      name: 'Quality Agent',
      description: 'Get 10 submissions approved',
      icon: '⭐',
      rarity: 'gold',
      unlocked: true,
      progress: 10,
      target: 10,
      unlockedDate: '2024-12-28',
    },

    // Locked Badges
    {
      id: 5,
      name: 'Perfect Week',
      description: 'Get 100% approval rate for 7 days',
      icon: '💯',
      rarity: 'platinum',
      unlocked: false,
      progress: 4,
      target: 7,
    },
    {
      id: 6,
      name: 'Top 10',
      description: 'Reach top 10 on the leaderboard',
      icon: '🏆',
      rarity: 'gold',
      unlocked: false,
      progress: 45,
      target: 10,
    },
    {
      id: 7,
      name: 'Century Club',
      description: 'Earn 100 total points',
      icon: '💰',
      rarity: 'silver',
      unlocked: false,
      progress: 85,
      target: 100,
    },
    {
      id: 8,
      name: 'Speed Demon',
      description: 'Submit 10 reports in one day',
      icon: '⚡',
      rarity: 'gold',
      unlocked: false,
      progress: 2,
      target: 10,
    },
    {
      id: 9,
      name: 'Network Expert',
      description: 'Submit 50 Network Experience reports',
      icon: '📶',
      rarity: 'gold',
      unlocked: false,
      progress: 23,
      target: 50,
    },
    {
      id: 10,
      name: 'Conversion Master',
      description: 'Convert 25 competitor customers',
      icon: '🎯',
      rarity: 'platinum',
      unlocked: false,
      progress: 8,
      target: 25,
    },
    {
      id: 11,
      name: 'Month Streak',
      description: 'Maintain a 30-day streak',
      icon: '📅',
      rarity: 'platinum',
      unlocked: false,
      progress: 7,
      target: 30,
    },
    {
      id: 12,
      name: 'Elite Agent',
      description: 'Reach Level 20',
      icon: '👑',
      rarity: 'platinum',
      unlocked: false,
      progress: 5,
      target: 20,
    },
  ];

  const filteredBadges = badges.filter((badge) => {
    if (activeTab === 'unlocked') return badge.unlocked;
    if (activeTab === 'locked') return !badge.unlocked;
    return true;
  });

  const stats = {
    total: badges.length,
    unlocked: badges.filter((b) => b.unlocked).length,
    locked: badges.filter((b) => !b.unlocked).length,
    bronze: badges.filter((b) => b.unlocked && b.rarity === 'bronze').length,
    silver: badges.filter((b) => b.unlocked && b.rarity === 'silver').length,
    gold: badges.filter((b) => b.unlocked && b.rarity === 'gold').length,
    platinum: badges.filter((b) => b.unlocked && b.rarity === 'platinum').length,
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'bronze':
        return {
          bg: 'bg-orange-100',
          border: 'border-orange-300',
          text: 'text-orange-700',
          gradient: 'from-orange-400 to-orange-600',
        };
      case 'silver':
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-700',
          gradient: 'from-gray-400 to-gray-600',
        };
      case 'gold':
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-300',
          text: 'text-yellow-700',
          gradient: 'from-yellow-400 to-yellow-600',
        };
      case 'platinum':
        return {
          bg: 'bg-purple-100',
          border: 'border-purple-300',
          text: 'text-purple-700',
          gradient: 'from-purple-400 to-purple-600',
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-700',
          gradient: 'from-gray-400 to-gray-600',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up-bottom overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <Trophy className="w-7 h-7" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Badges & Achievements</h2>
                <p className="text-sm opacity-90">Your collection of earned badges</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{stats.unlocked}</p>
              <p className="text-xs opacity-75">Unlocked</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{stats.gold}</p>
              <p className="text-xs opacity-75">Gold</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{stats.platinum}</p>
              <p className="text-xs opacity-75">Platinum</p>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <p className="text-2xl font-bold">{Math.round((stats.unlocked / stats.total) * 100)}%</p>
              <p className="text-xs opacity-75">Complete</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('unlocked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'unlocked'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unlocked ({stats.unlocked})
          </button>
          <button
            onClick={() => setActiveTab('locked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'locked'
                ? 'bg-gray-100 text-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Locked ({stats.locked})
          </button>
        </div>

        {/* Badges Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredBadges.map((badge, index) => {
              const colors = getRarityColor(badge.rarity);
              const progressPercentage = badge.progress && badge.target 
                ? (badge.progress / badge.target) * 100 
                : 0;

              return (
                <div
                  key={badge.id}
                  className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all hover:shadow-md animate-slide-in-right ${
                    badge.unlocked ? colors.border : 'border-gray-200'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Badge Icon */}
                  <div className="flex items-start mb-4">
                    <div className={`relative w-16 h-16 rounded-xl flex items-center justify-center text-3xl flex-shrink-0 ${
                      badge.unlocked 
                        ? `bg-gradient-to-br ${colors.gradient} shadow-lg` 
                        : 'bg-gray-100'
                    }`}>
                      {badge.unlocked ? (
                        <span>{badge.icon}</span>
                      ) : (
                        <Lock className="w-8 h-8 text-gray-400" strokeWidth={2} />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-semibold ${badge.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                          {badge.name}
                        </h4>
                        {badge.unlocked && (
                          <Award className={`w-5 h-5 ${colors.text}`} strokeWidth={2} />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                      
                      {/* Rarity Badge */}
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        <Star className="w-3 h-3" strokeWidth={2} />
                        <span>{badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar (for locked badges) */}
                  {!badge.unlocked && badge.progress !== undefined && badge.target !== undefined && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">
                          {badge.progress} / {badge.target}
                        </p>
                        <p className="text-sm font-medium text-purple-600">
                          {progressPercentage.toFixed(0)}%
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Unlocked Date */}
                  {badge.unlocked && badge.unlockedDate && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        Unlocked: {new Date(badge.unlockedDate).toLocaleDateString('en-KE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredBadges.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={2} />
              <p className="text-gray-600 mb-2">No badges in this category</p>
              <p className="text-sm text-gray-500">Keep completing missions to unlock badges!</p>
            </div>
          )}

          {/* Badge Collection Summary */}
          <div className="mt-6 bg-white rounded-xl p-5 shadow-sm border-2 border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2" strokeWidth={2} />
              Collection Summary
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">{stats.bronze}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Bronze</p>
                  <p className="text-xs text-gray-500">Beginner badges</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">{stats.silver}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Silver</p>
                  <p className="text-xs text-gray-500">Intermediate</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">{stats.gold}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Gold</p>
                  <p className="text-xs text-gray-500">Advanced</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">{stats.platinum}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Platinum</p>
                  <p className="text-xs text-gray-500">Elite badges</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
