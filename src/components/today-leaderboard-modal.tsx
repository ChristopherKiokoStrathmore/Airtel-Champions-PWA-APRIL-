import { useState, useEffect } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { X, Trophy, TrendingUp, Award, Users, Search } from 'lucide-react';

interface TodayLeaderboardModalProps {
  onClose: () => void;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  employee_id: string;
  zone: string;
  region?: string;
  points_today: number;
  submissions_count: number;
  rank: number;
  team_count?: number; // For ZSM/ZBM views
}

type ViewType = 'SE' | 'ZSM' | 'ZBM';

export function TodayLeaderboardModal({ onClose }: TodayLeaderboardModalProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewType, setViewType] = useState<ViewType>('SE');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalPoints: 0,
    activeSEs: 0
  });

  useEffect(() => {
    loadTodayLeaderboard();
  }, [viewType]);

  const loadTodayLeaderboard = async () => {
    if (viewType === 'SE') {
      await loadSELeaderboard();
    } else if (viewType === 'ZSM') {
      await loadZSMLeaderboard();
    } else if (viewType === 'ZBM') {
      await loadZBMLeaderboard();
    }
  };

  const loadSELeaderboard = async () => {
    try {
      console.log('[TodayLeaderboard] 🔥 Loading SE leaderboard with ALL 662 SEs...');
      setLoading(true);
      setError('');
      
      const supabase = getSupabaseClient();
      
      // Get today's date range (start of day to now)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      console.log('[TodayLeaderboard] 📅 Today starts at:', todayStart);
      
      // STEP 1: Fetch ALL Sales Executives (all 662 SEs)
      const { data: allSEs, error: sesError } = await supabase
        .from('app_users')
        .select('id, employee_id, full_name, zone, region')
        .eq('role', 'sales_executive')
        .order('full_name');
      
      if (sesError) {
        throw sesError;
      }
      
      console.log('[TodayLeaderboard] 👥 Loaded', allSEs?.length || 0, 'total SEs');
      
      if (!allSEs || allSEs.length === 0) {
        console.log('[TodayLeaderboard] ⚠️ No SEs found in database');
        setLeaderboard([]);
        setLoading(false);
        return;
      }
      
      // STEP 2: Get all submissions from today
      const { data: todaySubmissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('user_id, points_awarded')
        .gte('created_at', todayStart);
      
      if (submissionsError) {
        throw submissionsError;
      }
      
      console.log('[TodayLeaderboard] ✅ Loaded', todaySubmissions?.length || 0, 'submissions from today');
      
      // STEP 3: Calculate points per user
      const userPointsMap: Record<string, { points: number; count: number }> = {};
      
      if (todaySubmissions && todaySubmissions.length > 0) {
        todaySubmissions.forEach(sub => {
          if (!userPointsMap[sub.user_id]) {
            userPointsMap[sub.user_id] = { points: 0, count: 0 };
          }
          userPointsMap[sub.user_id].points += sub.points_awarded || 0;
          userPointsMap[sub.user_id].count += 1;
        });
      }
      
      // Calculate stats
      const totalSubmissions = todaySubmissions?.length || 0;
      const totalPoints = todaySubmissions?.reduce((sum, sub) => sum + (sub.points_awarded || 0), 0) || 0;
      const activeSEs = Object.keys(userPointsMap).length;
      
      setStats({
        totalSubmissions,
        totalPoints,
        activeSEs
      });
      
      // STEP 4: Combine ALL SEs with their points (0 if no submissions today)
      const leaderboardData: LeaderboardEntry[] = allSEs.map(se => ({
        user_id: se.id,
        full_name: se.full_name,
        employee_id: se.employee_id,
        zone: se.zone,
        region: se.region,
        points_today: userPointsMap[se.id]?.points || 0,
        submissions_count: userPointsMap[se.id]?.count || 0,
        rank: 0 // Will be set after sorting
      }));
      
      // STEP 5: Sort by points (descending), then by name (ascending) for ties
      leaderboardData.sort((a, b) => {
        // First sort by points (descending)
        if (b.points_today !== a.points_today) {
          return b.points_today - a.points_today;
        }
        // If points are equal, sort by name (ascending)
        return a.full_name.localeCompare(b.full_name);
      });
      
      // STEP 6: Assign ranks
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      console.log('[TodayLeaderboard] 📊 Top 10 entries:', leaderboardData.slice(0, 10).map(e => ({ rank: e.rank, name: e.full_name, points: e.points_today, submissions: e.submissions_count })));
      console.log('[TodayLeaderboard] ✅ Final SE leaderboard with', leaderboardData.length, 'entries');
      console.log('[TodayLeaderboard] 📊 Active SEs:', activeSEs, '| Inactive SEs:', leaderboardData.length - activeSEs);
      setLeaderboard(leaderboardData);
      setLoading(false);
    } catch (err: any) {
      console.error('[TodayLeaderboard] ❌ Error loading SE leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
      setLoading(false);
    }
  };

  const loadZSMLeaderboard = async () => {
    try {
      console.log('[TodayLeaderboard] 🔥 Loading ZSM leaderboard...');
      setLoading(true);
      setError('');
      
      const supabase = getSupabaseClient();
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      // STEP 1: Fetch all ZSMs
      const { data: allZSMs, error: zsmError } = await supabase
        .from('app_users')
        .select('id, employee_id, full_name, zone, region')
        .eq('role', 'zonal_sales_manager')
        .order('full_name');
      
      if (zsmError) throw zsmError;
      
      console.log('[TodayLeaderboard] 👥 Loaded', allZSMs?.length || 0, 'ZSMs');
      
      if (!allZSMs || allZSMs.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }
      
      // STEP 2: Fetch all SEs with their zones (team relationships are zone-based)
      const { data: allSEs, error: sesError } = await supabase
        .from('app_users')
        .select('id, zone')
        .eq('role', 'sales_executive');
      
      if (sesError) throw sesError;
      
      // STEP 3: Get today's submissions
      const { data: todaySubmissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('user_id, points_awarded')
        .gte('created_at', todayStart);
      
      if (submissionsError) throw submissionsError;
      
      // STEP 4: Calculate points per SE
      const sePointsMap: Record<string, number> = {};
      todaySubmissions?.forEach(sub => {
        sePointsMap[sub.user_id] = (sePointsMap[sub.user_id] || 0) + (sub.points_awarded || 0);
      });
      
      // STEP 5: Aggregate points per ZSM (based on zone matching)
      const zsmData: Record<string, { points: number; teamCount: number; submissions: number }> = {};
      
      allZSMs.forEach(zsm => {
        zsmData[zsm.id] = { points: 0, teamCount: 0, submissions: 0 };
      });
      
      // Match SEs to ZSMs by zone
      allSEs?.forEach(se => {
        // Find the ZSM for this SE's zone
        const zsmForZone = allZSMs.find(zsm => zsm.zone === se.zone);
        if (zsmForZone && zsmData[zsmForZone.id] !== undefined) {
          zsmData[zsmForZone.id].teamCount += 1;
          if (sePointsMap[se.id]) {
            zsmData[zsmForZone.id].points += sePointsMap[se.id];
            zsmData[zsmForZone.id].submissions += 1;
          }
        }
      });
      
      // Calculate stats
      const totalPoints = Object.values(zsmData).reduce((sum, data) => sum + data.points, 0);
      const totalSubmissions = todaySubmissions?.length || 0;
      const activeZSMs = Object.values(zsmData).filter(data => data.points > 0).length;
      
      setStats({
        totalSubmissions,
        totalPoints,
        activeSEs: activeZSMs
      });
      
      // STEP 6: Create leaderboard
      const leaderboardData: LeaderboardEntry[] = allZSMs.map(zsm => ({
        user_id: zsm.id,
        full_name: zsm.full_name,
        employee_id: zsm.employee_id,
        zone: zsm.zone,
        region: zsm.region,
        points_today: zsmData[zsm.id]?.points || 0,
        submissions_count: zsmData[zsm.id]?.submissions || 0,
        team_count: zsmData[zsm.id]?.teamCount || 0,
        rank: 0
      }));
      
      // STEP 7: Sort and rank
      leaderboardData.sort((a, b) => {
        if (b.points_today !== a.points_today) {
          return b.points_today - a.points_today;
        }
        return a.full_name.localeCompare(b.full_name);
      });
      
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      console.log('[TodayLeaderboard] ✅ Final ZSM leaderboard with', leaderboardData.length, 'entries');
      setLeaderboard(leaderboardData);
      setLoading(false);
    } catch (err: any) {
      console.error('[TodayLeaderboard] ❌ Error loading ZSM leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
      setLoading(false);
    }
  };

  const loadZBMLeaderboard = async () => {
    try {
      console.log('[TodayLeaderboard] 🔥 Loading ZBM leaderboard...');
      setLoading(true);
      setError('');
      
      const supabase = getSupabaseClient();
      
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      
      // STEP 1: Fetch all ZBMs
      const { data: allZBMs, error: zbmError } = await supabase
        .from('app_users')
        .select('id, employee_id, full_name, zone, region')
        .eq('role', 'zonal_business_manager')
        .order('full_name');
      
      if (zbmError) throw zbmError;
      
      console.log('[TodayLeaderboard] 👥 Loaded', allZBMs?.length || 0, 'ZBMs');
      
      if (!allZBMs || allZBMs.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }
      
      // STEP 2: Fetch all ZSMs with their zones (team relationships are zone-based)
      const { data: allZSMs, error: zsmError } = await supabase
        .from('app_users')
        .select('id, zone')
        .eq('role', 'zonal_sales_manager');
      
      if (zsmError) throw zsmError;
      
      // STEP 3: Fetch all SEs with their zones (team relationships are zone-based)
      const { data: allSEs, error: sesError } = await supabase
        .from('app_users')
        .select('id, zone')
        .eq('role', 'sales_executive');
      
      if (sesError) throw sesError;
      
      // STEP 4: Get today's submissions
      const { data: todaySubmissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('user_id, points_awarded')
        .gte('created_at', todayStart);
      
      if (submissionsError) throw submissionsError;
      
      // STEP 5: Calculate points per SE
      const sePointsMap: Record<string, number> = {};
      todaySubmissions?.forEach(sub => {
        sePointsMap[sub.user_id] = (sePointsMap[sub.user_id] || 0) + (sub.points_awarded || 0);
      });
      
      // STEP 6: Calculate points per ZSM (sum of their SEs in the same zone)
      const zsmPointsMap: Record<string, number> = {};
      allZSMs?.forEach(zsm => {
        zsmPointsMap[zsm.id] = 0;
        // Sum points from all SEs in this ZSM's zone
        allSEs?.forEach(se => {
          if (se.zone === zsm.zone && sePointsMap[se.id]) {
            zsmPointsMap[zsm.id] += sePointsMap[se.id];
          }
        });
      });
      
      // STEP 7: Aggregate points per ZBM (sum of all SEs in the same zone)
      const zbmData: Record<string, { points: number; zsmCount: number; seCount: number }> = {};
      
      allZBMs.forEach(zbm => {
        zbmData[zbm.id] = { points: 0, zsmCount: 0, seCount: 0 };
        
        // Count ZSMs in this zone
        const zsmsInZone = allZSMs?.filter(zsm => zsm.zone === zbm.zone) || [];
        zbmData[zbm.id].zsmCount = zsmsInZone.length;
        
        // Sum points from all SEs in this ZBM's zone
        allSEs?.forEach(se => {
          if (se.zone === zbm.zone) {
            zbmData[zbm.id].seCount += 1;
            if (sePointsMap[se.id]) {
              zbmData[zbm.id].points += sePointsMap[se.id];
            }
          }
        });
      });
      
      // Calculate stats
      const totalPoints = Object.values(zbmData).reduce((sum, data) => sum + data.points, 0);
      const totalSubmissions = todaySubmissions?.length || 0;
      const activeZBMs = Object.values(zbmData).filter(data => data.points > 0).length;
      
      setStats({
        totalSubmissions,
        totalPoints,
        activeSEs: activeZBMs
      });
      
      // STEP 8: Create leaderboard
      const leaderboardData: LeaderboardEntry[] = allZBMs.map(zbm => ({
        user_id: zbm.id,
        full_name: zbm.full_name,
        employee_id: zbm.employee_id,
        zone: zbm.zone,
        region: zbm.region,
        points_today: zbmData[zbm.id]?.points || 0,
        submissions_count: zbmData[zbm.id]?.seCount || 0,
        team_count: zbmData[zbm.id]?.zsmCount || 0,
        rank: 0
      }));
      
      // STEP 9: Sort and rank
      leaderboardData.sort((a, b) => {
        if (b.points_today !== a.points_today) {
          return b.points_today - a.points_today;
        }
        return a.full_name.localeCompare(b.full_name);
      });
      
      leaderboardData.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      console.log('[TodayLeaderboard] ✅ Final ZBM leaderboard with', leaderboardData.length, 'entries');
      setLeaderboard(leaderboardData);
      setLoading(false);
    } catch (err: any) {
      console.error('[TodayLeaderboard] ❌ Error loading ZBM leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-orange-600 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">🏆 Top Performers Today</h2>
                <p className="text-sm text-red-100 mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-red-800 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* View Toggle & Search Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          {/* View Toggle Buttons */}
          <div className="flex items-center space-x-2 mb-4">
            <button
              onClick={() => setViewType('SE')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                viewType === 'SE'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👤 SEs
            </button>
            <button
              onClick={() => setViewType('ZSM')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                viewType === 'ZSM'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 ZSMs
            </button>
            <button
              onClick={() => setViewType('ZBM')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                viewType === 'ZBM'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🏢 ZBMs
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`🔍 Search ${viewType === 'SE' ? 'sales executives' : viewType === 'ZSM' ? 'zone sales managers' : 'zone business managers'}...`}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              style={{ fontSize: '16px' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {!loading && !error && leaderboard.length > 0 && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center space-x-1 text-gray-600 text-xs mb-1">
                  <Users className="w-3 h-3" />
                  <span>Active {viewType}s</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stats.activeSEs}</div>
              </div>
              <div>
                <div className="flex items-center justify-center space-x-1 text-gray-600 text-xs mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Submissions</span>
                </div>
                <div className="text-xl font-bold text-gray-900">{stats.totalSubmissions}</div>
              </div>
              <div>
                <div className="flex items-center justify-center space-x-1 text-gray-600 text-xs mb-1">
                  <Award className="w-3 h-3" />
                  <span>Total Points</span>
                </div>
                <div className="text-xl font-bold text-green-600">{stats.totalPoints}</div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading today's leaderboard...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-600 text-4xl mb-4">⚠️</div>
                <p className="text-gray-900 font-semibold mb-2">Error Loading Leaderboard</p>
                <p className="text-gray-600 text-sm">{error}</p>
                <button
                  onClick={loadTodayLeaderboard}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">🏆</div>
                <p className="text-gray-900 font-semibold mb-2">No Submissions Yet Today</p>
                <p className="text-gray-600 text-sm">Be the first to submit and top the leaderboard!</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leaderboard
                .filter(entry => 
                  entry.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  entry.zone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  entry.region?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((entry, index) => {
                const isInactive = entry.points_today === 0;
                const isTopThree = !isInactive && index < 3;
                
                return (
                  <div
                    key={entry.user_id}
                    className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                      isTopThree ? 'bg-gradient-to-r from-yellow-50 to-white' : ''
                    } ${isInactive ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                          isInactive ? 'bg-gray-100 text-gray-400' : getRankColor(entry.rank)
                        }`}>
                          #{entry.rank}
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className={`text-lg font-semibold truncate ${
                            isInactive ? 'text-gray-500' : 'text-gray-900'
                          }`}>
                            {entry.full_name}
                          </p>
                          {!isInactive && getRankEmoji(entry.rank) && (
                            <span className="text-xl">{getRankEmoji(entry.rank)}</span>
                          )}
                          {isInactive && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                          <span>📍 {entry.zone || 'N/A'}</span>
                          {entry.region && (
                            <>
                              <span>•</span>
                              <span>{entry.region}</span>
                            </>
                          )}
                          {viewType !== 'SE' && entry.team_count !== undefined && (
                            <>
                              <span>•</span>
                              <span>👥 {entry.team_count} {viewType === 'ZSM' ? 'SEs' : 'ZSMs'}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-2xl font-bold ${
                          isInactive ? 'text-gray-400' : 'text-green-600'
                        }`}>
                          {entry.points_today}
                        </div>
                        <div className="text-xs text-gray-500">
                          {viewType === 'SE' 
                            ? `${entry.submissions_count} submission${entry.submissions_count !== 1 ? 's' : ''}`
                            : `${entry.submissions_count} active ${viewType === 'ZSM' ? 'SEs' : 'ZSMs'}`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
