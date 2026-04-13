import { useState, useEffect, useMemo } from 'react';
import { getAchievements, supabase } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { Trophy, Users, Target, Sparkles } from 'lucide-react';

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  criteria: number;
  points_reward: number;
  is_active: boolean;
}

interface UserAchievement {
  achievement_id: string;
  user_id: string;
  unlocked_at: string;
}

export function AchievementSystem() {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load achievements
      const { data: achievementsData, error: achievementsError } = await getAchievements();
      if (achievementsError) throw new Error(achievementsError);
      setAchievements(achievementsData || []);

      // Load user achievements (count per achievement)
      const { data: userAchievementsData, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_id, user_id, unlocked_at');
      
      if (userAchievementsError) throw userAchievementsError;
      setUserAchievements(userAchievementsData || []);

      // Get total number of SEs
      const { count, error: countError } = await supabase
        .from('app_users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'se')
        .eq('is_active', true);
      
      if (countError) throw countError;
      setTotalUsers(count || 0);

    } catch (err: any) {
      console.error('Error loading achievements:', err);
      setError(err.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  // Calculate how many users have unlocked each achievement
  const achievementsWithStats = useMemo(() => {
    return achievements.map(achievement => {
      const unlockedCount = userAchievements.filter(
        ua => ua.achievement_id === achievement.id
      ).length;

      return {
        ...achievement,
        unlocked: unlockedCount,
        total: totalUsers,
        percentage: totalUsers > 0 ? Math.round((unlockedCount / totalUsers) * 100) : 0
      };
    });
  }, [achievements, userAchievements, totalUsers]);

  // Filter achievements
  const filteredAchievements = useMemo(() => {
    let filtered = [...achievementsWithStats];

    if (filterCategory !== 'all') {
      filtered = filtered.filter(a => a.category === filterCategory);
    }

    if (filterTier !== 'all') {
      filtered = filtered.filter(a => a.tier === filterTier);
    }

    // Sort by tier (rarity) and then by criteria
    const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
    filtered.sort((a, b) => {
      const tierDiff = (tierOrder[a.tier as keyof typeof tierOrder] || 0) - 
                       (tierOrder[b.tier as keyof typeof tierOrder] || 0);
      if (tierDiff !== 0) return tierDiff;
      return a.criteria - b.criteria;
    });

    return filtered;
  }, [achievementsWithStats, filterCategory, filterTier]);

  // Extract unique categories
  const categories = Array.from(new Set(achievements.map(a => a.category)));

  // Calculate stats
  const stats = useMemo(() => {
    const totalAchievements = achievements.filter(a => a.is_active).length;
    const totalUnlocks = userAchievements.length;
    const avgUnlocksPerUser = totalUsers > 0 ? Math.round(totalUnlocks / totalUsers) : 0;
    
    // Find most popular achievement
    const unlockCounts = new Map<string, number>();
    userAchievements.forEach(ua => {
      unlockCounts.set(ua.achievement_id, (unlockCounts.get(ua.achievement_id) || 0) + 1);
    });
    const mostPopularId = Array.from(unlockCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostPopular = achievements.find(a => a.id === mostPopularId);

    return {
      totalAchievements,
      totalUnlocks,
      avgUnlocksPerUser,
      mostPopular: mostPopular?.name || 'N/A',
      mostPopularUnlocks: mostPopularId ? unlockCounts.get(mostPopularId) || 0 : 0
    };
  }, [achievements, userAchievements, totalUsers]);

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'silver':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'gold':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'platinum':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'diamond':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getTierGradient = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'from-orange-50 to-orange-100';
      case 'silver':
        return 'from-gray-50 to-gray-100';
      case 'gold':
        return 'from-yellow-50 to-yellow-100';
      case 'platinum':
        return 'from-blue-50 to-blue-100';
      case 'diamond':
        return 'from-purple-50 to-purple-100';
      default:
        return 'from-gray-50 to-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorMessage message={error} onRetry={loadAchievements} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Achievement System</h1>
        <p className="text-gray-600">Manage badges and rewards for Sales Executives</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Trophy className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Total Achievements</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalAchievements}</p>
          <p className="text-sm text-gray-500 mt-1">Active badges</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Total Unlocks</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUnlocks}</p>
          <p className="text-sm text-gray-500 mt-1">All-time</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Avg per SE</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.avgUnlocksPerUser}</p>
          <p className="text-sm text-gray-500 mt-1">Achievements</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-600">Most Popular</p>
          </div>
          <p className="text-lg font-bold text-gray-900 truncate">{stats.mostPopular}</p>
          <p className="text-sm text-gray-500 mt-1">{stats.mostPopularUnlocks} unlocks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tier (Rarity)</label>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
            >
              <option key="all" value="all">All Tiers</option>
              <option key="bronze" value="bronze">Bronze (Common)</option>
              <option key="silver" value="silver">Silver (Uncommon)</option>
              <option key="gold" value="gold">Gold (Rare)</option>
              <option key="platinum" value="platinum">Platinum (Epic)</option>
              <option key="diamond" value="diamond">Diamond (Legendary)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Achievements Found</h3>
          <p className="text-gray-600">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => (
            <button
              key={achievement.id}
              onClick={() => setSelectedAchievement(achievement)}
              className={`text-left bg-gradient-to-br ${getTierGradient(achievement.tier)} rounded-xl border-2 p-6 hover:shadow-lg transition-all ${
                selectedAchievement?.id === achievement.id
                  ? 'border-[#E60000] shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-5xl">{achievement.icon}</div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border-2 capitalize ${getTierColor(achievement.tier)}`}>
                  {achievement.tier}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{achievement.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>

              {/* Criteria */}
              <div className="flex items-center gap-2 mb-4 text-sm">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Requirement: <strong>{achievement.criteria}</strong></span>
              </div>

              {/* Unlock Stats */}
              <div className="pt-4 border-t border-gray-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Unlocked by</span>
                  <span className="text-sm font-bold text-gray-900">
                    {achievement.unlocked} / {achievement.total} SEs
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-[#E60000] to-[#CC0000] h-2 rounded-full transition-all"
                    style={{ width: `${achievement.percentage}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{achievement.percentage}% completion</span>
                  <span className="font-medium text-blue-600">+{achievement.points_reward} pts</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Achievement Modal/Detail (Optional) */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`bg-gradient-to-br ${getTierGradient(selectedAchievement.tier)} rounded-2xl max-w-lg w-full p-8 relative`}>
            <button
              onClick={() => setSelectedAchievement(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>

            <div className="text-center mb-6">
              <div className="text-8xl mb-4">{selectedAchievement.icon}</div>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border-2 capitalize ${getTierColor(selectedAchievement.tier)}`}>
                {selectedAchievement.tier} Achievement
              </span>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
              {selectedAchievement.name}
            </h2>
            
            <p className="text-gray-700 text-center mb-6">
              {selectedAchievement.description}
            </p>

            <div className="bg-white/50 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Requirement</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedAchievement.criteria}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reward</p>
                  <p className="text-2xl font-bold text-blue-600">+{selectedAchievement.points_reward} pts</p>
                </div>
              </div>
            </div>

            <div className="bg-white/50 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-center">Unlock Statistics</h3>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-gray-900">{selectedAchievement.unlocked}</p>
                <p className="text-gray-600">out of {selectedAchievement.total} SEs</p>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-gradient-to-r from-[#E60000] to-[#CC0000] h-4 rounded-full transition-all"
                  style={{ width: `${selectedAchievement.percentage}%` }}
                ></div>
              </div>
              
              <p className="text-center mt-3 text-2xl font-bold text-gray-900">
                {selectedAchievement.percentage}% Completion Rate
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}