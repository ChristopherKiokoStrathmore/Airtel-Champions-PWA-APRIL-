import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { AdvancedCompare } from './advanced-compare';
import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';

interface LeaderboardEnhancedUnifiedProps {
  currentUserId?: string;
  currentUserData?: any;
  onBack?: () => void;
  showBackButton?: boolean;
  standalone?: boolean; // If true, show as full page. If false, show as widget
}

export function LeaderboardEnhancedUnified({ 
  currentUserId,
  currentUserData,
  onBack,
  showBackButton = false,
  standalone = false
}: LeaderboardEnhancedUnifiedProps) {
  // Track page view automatically (only in standalone mode)
  // Hook is always called (Rules of Hooks), but internally skips tracking when not standalone
  usePageTracking(standalone ? ANALYTICS_PAGES.LEADERBOARD : '');
  
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showFullList, setShowFullList] = useState(standalone);
  
  // Filter states
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedZSM, setSelectedZSM] = useState('');
  const [zones, setZones] = useState<string[]>([]);
  const [zsms, setZSMs] = useState<string[]>([]);

  // Compare state
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    loadLeaderboard();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterLeaderboard();
  }, [selectedZone, selectedZSM, leaderboard]);

  // Cascading filter: When zone changes, update available ZSMs
  useEffect(() => {
    if (selectedZone) {
      const zsmsInZone = [...new Set(
        leaderboard
          .filter(u => u.zone === selectedZone)
          .map(u => u.zsm)
          .filter(Boolean)
      )].sort();
      setZSMs(zsmsInZone);
      
      if (selectedZSM && !zsmsInZone.includes(selectedZSM)) {
        setSelectedZSM('');
      }
    } else {
      const allZSMs = [...new Set(leaderboard.map(u => u.zsm).filter(Boolean))].sort();
      setZSMs(allZSMs);
    }
  }, [selectedZone, leaderboard]);

  const loadLeaderboard = async () => {
    try {
      // Get all SEs from app_users table, ordered by total_points
      const { data, error } = await supabase
        .from('app_users')
        .select('id, employee_id, full_name, rank, zone, zsm, total_points, region')
        .eq('role', 'sales_executive')
        .order('total_points', { ascending: false });

      if (data) {
        // Assign dynamic rank based on points order
        const dataWithRank = data.map((user, index) => ({
          ...user,
          rank: index + 1
        }));
        setLeaderboard(dataWithRank);
        setFilteredLeaderboard(dataWithRank);
        
        // Extract unique zones
        const uniqueZones = [...new Set(data.map(u => u.zone).filter(Boolean))].sort();
        setZones(uniqueZones);
        
        // Extract unique ZSMs
        const uniqueZSMs = [...new Set(data.map(u => u.zsm).filter(Boolean))].sort();
        setZSMs(uniqueZSMs);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setLoading(false);
    }
  };

  const filterLeaderboard = () => {
    let filtered = [...leaderboard];

    if (selectedZone) {
      filtered = filtered.filter(user => user.zone === selectedZone);
    }

    if (selectedZSM) {
      filtered = filtered.filter(user => user.zsm === selectedZSM);
    }

    setFilteredLeaderboard(filtered);
  };

  const clearFilters = () => {
    setSelectedZone('');
    setSelectedZSM('');
    setShowFilters(false);
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getBgClass = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-400';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-400';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400';
    return 'bg-white border-gray-200';
  };

  const getBadgeClass = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-orange-600';
    return 'bg-gray-300';
  };

  if (loading) {
    return (
      <div className="p-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 mb-3 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayList = showFullList ? filteredLeaderboard : filteredLeaderboard.slice(0, 3);
  const activeFilters = selectedZone || selectedZSM;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {showBackButton && onBack && (
              <button onClick={onBack} className="mr-3">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-2xl">🏆 Leaderboard</h2>
          </div>
          <button 
            onClick={() => setShowCompare(true)} 
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Compare
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilters && (
                <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">
                  {(selectedZone ? 1 : 0) + (selectedZSM ? 1 : 0)}
                </span>
              )}
            </button>
            {activeFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          {showFilters && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Zone</label>
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Zones</option>
                    {zones.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">ZSM</label>
                  <select
                    value={selectedZSM}
                    onChange={(e) => setSelectedZSM(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All ZSMs</option>
                    {zsms.map(zsm => (
                      <option key={zsm} value={zsm}>{zsm}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Summary Pills */}
        {activeFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedZone && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                Zone: {selectedZone}
                <button onClick={() => setSelectedZone('')} className="hover:text-blue-900">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
            {selectedZSM && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                ZSM: {selectedZSM}
                <button onClick={() => setSelectedZSM('')} className="hover:text-green-900">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredLeaderboard.length} of {leaderboard.length} SEs
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto">
        {filteredLeaderboard.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl mb-2">No SEs Found</h3>
              <p className="text-gray-600 text-sm mb-4">
                No sales executives match your filter criteria
              </p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {displayList.map((user) => {
              const isCurrentUser = currentUserId && user.id === currentUserId;
              const userRank = user.rank || 0;

              return (
                <div
                  key={user.id}
                  className={`rounded-xl p-4 shadow-sm border-2 ${getBgClass(userRank)} ${
                    isCurrentUser ? 'ring-4 ring-orange-300' : ''
                  } transition-all hover:shadow-md`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg mr-3 ${getBadgeClass(userRank)}`}
                    >
                      {getMedalEmoji(userRank) || user.full_name.substring(0, 1)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {user.full_name}
                        {isCurrentUser && <span className="ml-2 text-orange-600 text-sm">(You)</span>}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {user.zone || 'No Zone'} {user.zsm && `• ${user.zsm}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">#{userRank}</p>
                      {user.total_points > 0 && (
                        <p className="text-xs text-gray-600">{user.total_points} pts</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* View All / Show Less Button */}
            {!standalone && filteredLeaderboard.length > 3 && (
              <button
                onClick={() => setShowFullList(!showFullList)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                {showFullList ? 'Show Top 3 Only' : `View All ${filteredLeaderboard.length} Rankings`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Advanced Compare Modal */}
      {showCompare && (
        <AdvancedCompare 
          onClose={() => setShowCompare(false)}
          allSEs={leaderboard}
        />
      )}
    </div>
  );
}

// Widget version for dashboards (shows top 3 with "View All" button)
export function LeaderboardWidget({ 
  currentUserId,
  onViewAll 
}: { 
  currentUserId?: string;
  onViewAll?: () => void;
}) {
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerformer, setSelectedPerformer] = useState<any>(null);

  useEffect(() => {
    loadTopPerformers();
    
    const interval = setInterval(loadTopPerformers, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTopPerformers = async () => {
    try {
      const { data } = await supabase
        .from('app_users')
        .select('id, employee_id, full_name, rank, zone, region, zsm, zbm, total_points, phone_number')
        .eq('role', 'sales_executive')
        .order('total_points', { ascending: false })
        .limit(3);

      if (data) {
        // Assign dynamic rank based on points order
        const dataWithRank = data.map((user, index) => ({
          ...user,
          rank: index + 1
        }));
        setTopPerformers(dataWithRank);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading top performers:', error);
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const getBadgeClass = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-br from-orange-400 to-orange-600';
    return 'bg-gradient-to-br from-blue-400 to-blue-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-5">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🏆</span>
            <span>Top Performers</span>
          </h3>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {topPerformers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-sm">No performance data yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {topPerformers.map((performer) => {
              const isCurrentUser = currentUserId && performer.id === currentUserId;
              const rank = performer.rank || 0;
              const initial = performer.full_name?.substring(0, 1) || '?';

              return (
                <button
                  key={performer.id}
                  onClick={() => setSelectedPerformer(performer)}
                  className="flex flex-col items-center text-center transition-transform hover:scale-105 active:scale-95"
                >
                  {/* Profile Picture / Avatar */}
                  <div className="relative mb-2">
                    <div 
                      className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-white text-2xl shadow-lg ${getBadgeClass(rank)} ${
                        isCurrentUser ? 'ring-4 ring-orange-300' : ''
                      }`}
                    >
                      {getMedalEmoji(rank) || initial}
                    </div>
                    {/* Rank badge */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {rank}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                    {performer.full_name}
                    {isCurrentUser && <span className="text-xs text-orange-600 block">(You)</span>}
                  </div>

                  {/* Region/Zone */}
                  <div className="text-xs text-gray-600 line-clamp-1">
                    {performer.region || performer.zone || 'N/A'}
                  </div>

                  {/* Points */}
                  <div className="mt-1 text-lg font-bold text-red-600">
                    {performer.total_points || 0}
                  </div>
                  <div className="text-xs text-gray-500">points</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPerformer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl text-white font-bold">SE Details</h2>
                <button
                  onClick={() => setSelectedPerformer(null)}
                  className="text-white hover:text-red-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Profile Section */}
              <div className="flex flex-col items-center mb-6">
                <div 
                  className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-3xl shadow-lg mb-3 ${getBadgeClass(selectedPerformer.rank || 0)}`}
                >
                  {getMedalEmoji(selectedPerformer.rank) || selectedPerformer.full_name?.substring(0, 1)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedPerformer.full_name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-semibold">Rank #{selectedPerformer.rank}</span>
                  <span>•</span>
                  <span>{getMedalEmoji(selectedPerformer.rank)}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 text-center border border-red-200">
                  <div className="text-3xl font-black text-red-600">{selectedPerformer.total_points || 0}</div>
                  <div className="text-xs text-gray-600 mt-1">Total Points</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-200">
                  <div className="text-3xl font-black text-blue-600">#{selectedPerformer.rank}</div>
                  <div className="text-xs text-gray-600 mt-1">National Rank</div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Employee ID</span>
                  <span className="font-semibold text-gray-900">{selectedPerformer.employee_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Region</span>
                  <span className="font-semibold text-gray-900">{selectedPerformer.region || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">Zone</span>
                  <span className="font-semibold text-gray-900">{selectedPerformer.zone || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">ZSM</span>
                  <span className="font-semibold text-gray-900">{selectedPerformer.zsm || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="text-gray-600">ZBM</span>
                  <span className="font-semibold text-gray-900">{selectedPerformer.zbm || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-600">Phone</span>
                  <span className="font-semibold text-gray-900">{selectedPerformer.phone_number || 'N/A'}</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedPerformer(null)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 font-semibold rounded-xl shadow transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}