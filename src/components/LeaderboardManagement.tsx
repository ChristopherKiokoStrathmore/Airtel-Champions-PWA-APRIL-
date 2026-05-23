import { useState, useEffect } from 'react';
import { getLeaderboard } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage, EmptyState } from './ui/ErrorMessage';

type LeaderboardView = 'global' | 'regional' | 'team' | 'alltime';

interface LeaderboardEntry {
  rank: number;
  name: string;
  id: string;
  points: number;
  submissions: number;
  region: string;
  team: string;
  change: number;
  streak: number;
  avatar?: string;
}

export function LeaderboardManagement() {
  const [currentView, setCurrentView] = useState<LeaderboardView>('global');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [timeFilter, setTimeFilter] = useState('weekly');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [currentView, selectedRegion, selectedTeam]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: any = { limit: 100 };
      
      if (currentView === 'regional') {
        filters.type = 'regional';
        filters.region = selectedRegion !== 'all' ? selectedRegion : undefined;
      } else if (currentView === 'team') {
        filters.type = 'team';
        filters.team = selectedTeam !== 'all' ? selectedTeam : undefined;
      } else {
        filters.type = 'global';
      }

      const { data, error: leaderboardError } = await getLeaderboard(filters);
      
      if (leaderboardError) throw new Error(leaderboardError);
      
      setLeaderboardData(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadLeaderboard} />;

  // Get top 3 for podium
  const topThree = leaderboardData.slice(0, 3);
  const restOfLeaderboard = leaderboardData.slice(3);

  const regionalLeaders = [
    { region: 'Nairobi', leader: 'Sarah Mwangi', points: 8540, ses: 187 },
    { region: 'Mombasa', leader: 'Eric Omondi', points: 6880, ses: 89 },
    { region: 'Kisumu', leader: 'Grace Njeri', points: 6450, ses: 76 },
    { region: 'Nakuru', leader: 'David Kipchoge', points: 5890, ses: 54 },
    { region: 'Eldoret', leader: 'Mary Wambui', points: 4560, ses: 43 }
  ];

  const teamLeaders = [
    { team: 'Team Alpha', leader: 'Sarah Mwangi', points: 8540, members: 12 },
    { team: 'Team Beta', leader: 'Eric Omondi', points: 6880, members: 15 },
    { team: 'Team Gamma', leader: 'Grace Njeri', points: 6450, members: 10 },
    { team: 'Team Delta', leader: 'David Kipchoge', points: 5890, members: 14 },
    { team: 'Team Epsilon', leader: 'Peter Otieno', points: 5120, members: 11 }
  ];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <span className="text-green-600">↑ {change}</span>;
    if (change < 0) return <span className="text-red-600">↓ {Math.abs(change)}</span>;
    return <span className="text-gray-500">→</span>;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard Management</h1>
        <p className="text-gray-600">Manage rankings and recognize top performers</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* View Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leaderboard Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCurrentView('global')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'global'
                    ? 'bg-[#E60000] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Global
              </button>
              <button
                onClick={() => setCurrentView('regional')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'regional'
                    ? 'bg-[#E60000] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Regional
              </button>
              <button
                onClick={() => setCurrentView('team')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'team'
                    ? 'bg-[#E60000] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Team
              </button>
              <button
                onClick={() => setCurrentView('alltime')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'alltime'
                    ? 'bg-[#E60000] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All-Time
              </button>
            </div>
          </div>

          {/* Time Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
            >
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="quarterly">This Quarter</option>
            </select>
          </div>

          {/* Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter By
            </label>
            {currentView === 'regional' ? (
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
              >
                <option value="all">All Regions</option>
                <option value="nairobi">Nairobi</option>
                <option value="mombasa">Mombasa</option>
                <option value="kisumu">Kisumu</option>
                <option value="nakuru">Nakuru</option>
              </select>
            ) : (
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
              >
                <option value="all">All Teams</option>
                <option value="alpha">Team Alpha</option>
                <option value="beta">Team Beta</option>
                <option value="gamma">Team Gamma</option>
                <option value="delta">Team Delta</option>
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Podium Section */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Top 3 This Week</h2>
              
              <div className="flex items-end justify-center gap-4 mb-6">
                {/* 2nd Place */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-20 h-20 rounded-full bg-gray-200 mb-2 overflow-hidden border-4 border-gray-400">
                    <img src={topThree[1]?.avatar} alt={topThree[1]?.name} className="w-full h-full" />
                  </div>
                  <div className="text-4xl mb-1">🥈</div>
                  <p className="font-bold text-gray-900 text-center">{topThree[1]?.name}</p>
                  <p className="text-sm text-gray-600">{topThree[1]?.points.toLocaleString()} pts</p>
                  <div className="mt-2 px-3 py-1 bg-gray-100 rounded-full">
                    <p className="text-xs font-medium text-gray-700">{topThree[1]?.submissions} missions</p>
                  </div>
                </div>

                {/* 1st Place - Elevated */}
                <div className="flex flex-col items-center flex-1 -mt-8">
                  <div className="w-24 h-24 rounded-full bg-yellow-100 mb-2 overflow-hidden border-4 border-yellow-400 shadow-lg">
                    <img src={topThree[0]?.avatar} alt={topThree[0]?.name} className="w-full h-full" />
                  </div>
                  <div className="text-5xl mb-1">🥇</div>
                  <p className="font-bold text-gray-900 text-center text-lg">{topThree[0]?.name}</p>
                  <p className="text-sm text-gray-600 font-bold">{topThree[0]?.points.toLocaleString()} pts</p>
                  <div className="mt-2 px-3 py-1 bg-yellow-100 rounded-full">
                    <p className="text-xs font-medium text-yellow-800">{topThree[0]?.submissions} missions</p>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-xs">🔥</span>
                    <span className="text-xs font-medium text-orange-600">{topThree[0]?.streak} day streak</span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center flex-1">
                  <div className="w-20 h-20 rounded-full bg-orange-100 mb-2 overflow-hidden border-4 border-orange-400">
                    <img src={topThree[2]?.avatar} alt={topThree[2]?.name} className="w-full h-full" />
                  </div>
                  <div className="text-4xl mb-1">🥉</div>
                  <p className="font-bold text-gray-900 text-center">{topThree[2]?.name}</p>
                  <p className="text-sm text-gray-600">{topThree[2]?.points.toLocaleString()} pts</p>
                  <div className="mt-2 px-3 py-1 bg-orange-100 rounded-full">
                    <p className="text-xs font-medium text-orange-700">{topThree[2]?.submissions} missions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full Rankings Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales Executive</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Streak</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {restOfLeaderboard.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl">{getRankBadge(entry.rank)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img 
                            src={entry.avatar} 
                            alt={entry.name}
                            className="w-10 h-10 rounded-full bg-gray-200"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{entry.name}</p>
                            <p className="text-sm text-gray-500">{entry.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {entry.region}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-bold text-[#E60000]">{entry.points.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {entry.submissions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🔥</span>
                          <span className="text-sm font-medium text-orange-600">{entry.streak}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {getChangeIcon(entry.change)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Regional/Team Leaders Sidebar */}
        <div className="space-y-6">
          {/* Regional Leaders */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">📍 Regional Leaders</h3>
            <div className="space-y-3">
              {regionalLeaders.map((region, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{region.region}</p>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {region.ses} SEs
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{region.leader}</p>
                  <p className="text-xs font-bold text-[#E60000]">{region.points.toLocaleString()} pts</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Leaders */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">👥 Team Leaders</h3>
            <div className="space-y-3">
              {teamLeaders.map((team, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900">{team.team}</p>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      {team.members} members
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{team.leader}</p>
                  <p className="text-xs font-bold text-[#E60000]">{team.points.toLocaleString()} pts</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gradient-to-br from-[#E60000] to-[#CC0000] rounded-xl p-6 text-white">
            <h3 className="font-bold mb-3">⚡ Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                📢 Announce Top 3
              </button>
              <button className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                📊 Export Rankings
              </button>
              <button className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                🏆 Reset Weekly
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}