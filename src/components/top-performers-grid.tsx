import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { localCache, CACHE_TTL } from '../lib/local-cache';

interface TopPerformersGridProps {
  currentUserId?: string;
  onViewAll?: () => void;
  limit?: number;
}

export function TopPerformersGrid({ 
  currentUserId,
  onViewAll,
  limit = 3 
}: TopPerformersGridProps) {
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerformer, setSelectedPerformer] = useState<any>(null);

  useEffect(() => {
    loadTopPerformers();
    
    // Poll every 5 minutes instead of 30 seconds — localStorage cache handles freshness
    const interval = setInterval(loadTopPerformers, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [limit]);

  const loadTopPerformers = async () => {
    try {
      const cacheKey = `top_performers_${limit}`;
      
      const data = await localCache.fetchWithCache(
        cacheKey,
        async () => {
          const { data } = await supabase
            .from('app_users')
            .select('id, employee_id, full_name, rank, zone, region, zsm, zbm, total_points, phone_number')
            .eq('role', 'sales_executive')
            .order('total_points', { ascending: false })
            .limit(limit);
          return data || [];
        },
        CACHE_TTL.TOP_PERFORMERS,
        {
          staleWhileRevalidate: true,
          onRevalidated: (freshData) => {
            // Silently update state when fresh data arrives
            const dataWithRank = freshData.map((user: any, index: number) => ({
              ...user,
              rank: index + 1
            }));
            setTopPerformers(dataWithRank);
          }
        }
      );

      // Assign dynamic rank based on points order
      const dataWithRank = data.map((user: any, index: number) => ({
        ...user,
        rank: index + 1
      }));
      setTopPerformers(dataWithRank);
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