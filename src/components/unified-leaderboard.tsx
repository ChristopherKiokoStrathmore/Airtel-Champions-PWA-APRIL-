import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

interface UnifiedLeaderboardProps {
  showTitle?: boolean;
  showTopOnly?: number; // Show only top N users
  compact?: boolean; // Compact mode for dashboard widgets
  currentUserId?: string;
}

export function UnifiedLeaderboard({ 
  showTitle = true, 
  showTopOnly, 
  compact = false,
  currentUserId 
}: UnifiedLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [filteredLeaderboard, setFilteredLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showFullList, setShowFullList] = useState(false);
  
  // Filter states
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedZSM, setSelectedZSM] = useState('');
  const [zones, setZones] = useState<string[]>([]);
  const [zsms, setZSMs] = useState<string[]>([]);

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
      // Get all SEs from app_users table, ordered by rank
      const { data, error } = await supabase
        .from('app_users')
        .select('id, employee_id, full_name, rank, zone, zsm, total_points, region')
        .eq('role', 'sales_executive')
        .order('total_points', { ascending: false });

      if (data) {
        setLeaderboard(data);
        setFilteredLeaderboard(data);
        
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
  };

  const getDisplayList = () => {
    if (showTopOnly && !showFullList) {
      return filteredLeaderboard.slice(0, showTopOnly);
    }
    return filteredLeaderboard;
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  const getBgClass = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-400';
    if (index === 1) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-400';
    if (index === 2) return 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-400';
    return 'bg-white border-gray-200';
  };

  const getBadgeClass = (index: number) => {
    if (index === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg';
    if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg';
    if (index === 2) return 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg';
    return 'bg-gradient-to-br from-blue-400 to-blue-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const displayList = getDisplayList();
  const hasMore = showTopOnly && filteredLeaderboard.length > showTopOnly && !showFullList;
  const activeFilters = selectedZone || selectedZSM;

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>🏆</span>
            <span>Leaderboard</span>
            {activeFilters && (
              <span className="text-sm font-normal text-orange-600">
                ({filteredLeaderboard.length})
              </span>
            )}
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              showFilters || activeFilters
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">🔍</span>
            Filter
            {activeFilters && <span className="ml-1">•</span>}
          </button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-4 border-2 border-orange-200">
          <div className="space-y-3">
            {/* Zone Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Zone
              </label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Zones</option>
                {zones.map((zone) => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>

            {/* ZSM Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by ZSM
              </label>
              <select
                value={selectedZSM}
                onChange={(e) => setSelectedZSM(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={!selectedZone && zsms.length > 20} // Disable if too many ZSMs and no zone selected
              >
                <option value="">All ZSMs</option>
                {zsms.map((zsm) => (
                  <option key={zsm} value={zsm}>{zsm}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {activeFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-2 bg-white text-orange-600 font-semibold rounded-xl border-2 border-orange-200 hover:bg-orange-50 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      {displayList.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-sm">No rankings available</p>
          {activeFilters && (
            <p className="text-xs mt-2">Try adjusting your filters</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map((performer, index) => {
            const isCurrentUser = currentUserId && performer.id === currentUserId;
            const actualRank = filteredLeaderboard.indexOf(performer);
            
            return (
              <div
                key={performer.id}
                className={`${compact ? 'p-3' : 'p-4'} rounded-xl border-2 ${getBgClass(actualRank)} ${
                  isCurrentUser ? 'ring-4 ring-orange-300' : ''
                } transition-all hover:shadow-md`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${compact ? 'w-12 h-12 text-lg' : 'w-14 h-14 text-xl'} rounded-full flex items-center justify-center font-bold text-white ${getBadgeClass(actualRank)}`}>
                    {getMedalEmoji(actualRank) || (actualRank + 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-800 truncate`}>
                      {performer.full_name}
                      {isCurrentUser && <span className="ml-2 text-orange-600">(You)</span>}
                    </div>
                    <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 truncate`}>
                      {performer.zone || 'N/A'}
                    </div>
                    {!compact && (
                      <div className="text-xs text-gray-500 mt-0.5 truncate">
                        ZSM: {performer.zsm || 'N/A'}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-red-600`}>
                      {performer.total_points || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      {compact ? 'pts' : 'points'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* More Button */}
      {hasMore && (
        <button
          onClick={() => setShowFullList(true)}
          className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg transition-all"
        >
          Show All {filteredLeaderboard.length} Rankings
        </button>
      )}

      {/* Show Less Button */}
      {showFullList && showTopOnly && (
        <button
          onClick={() => setShowFullList(false)}
          className="w-full py-3 bg-white text-orange-600 font-semibold rounded-xl border-2 border-orange-200 hover:bg-orange-50 transition-colors"
        >
          Show Top {showTopOnly} Only
        </button>
      )}
    </div>
  );
}

// Compact version for dashboard widgets
export function LeaderboardWidget({ showTop = 3, currentUserId }: { showTop?: number; currentUserId?: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-5">
      <UnifiedLeaderboard 
        showTitle={true}
        showTopOnly={showTop}
        compact={false}
        currentUserId={currentUserId}
      />
    </div>
  );
}

// Full page version
export function LeaderboardFullPage({ currentUserId }: { currentUserId?: string }) {
  return (
    <div className="p-4">
      <UnifiedLeaderboard 
        showTitle={true}
        showTopOnly={undefined} // Show all by default
        compact={false}
        currentUserId={currentUserId}
      />
    </div>
  );
}
