import { useState, useEffect } from 'react';
import { getSEProfile, getAllSEs } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { Search, X, User, Phone, Mail, MapPin, Users, Calendar, TrendingUp, Award, Target } from 'lucide-react';

interface SEStats {
  totalPoints: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  pendingSubmissions: number;
  approvalRate: number;
  avgPointsPerSubmission: number;
  currentStreak: number;
  longestStreak: number;
  badgesUnlocked: number;
}

interface SEProfile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  region: string;
  teamName: string;
  employee_id: string;
  created_at: string;
  stats: SEStats;
  recentSubmissions: any[];
  badges: any[];
}

export function SEProfileViewer() {
  const [selectedSE, setSelectedSE] = useState<SEProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seList, setSEList] = useState<any[]>([]);

  useEffect(() => {
    loadSEs();
  }, [filterRegion, filterTeam]);

  const loadSEs = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await getAllSEs({ region: filterRegion, team: filterTeam });
      if (apiError) throw new Error(apiError);
      setSEList(data || []);
    } catch (err: any) {
      console.error('Error loading SEs:', err);
      setError(err.message || 'Failed to load Sales Executives');
    } finally {
      setLoading(false);
    }
  };

  const loadSEProfile = async (seId: string) => {
    setProfileLoading(true);
    try {
      const { data, error: apiError } = await getSEProfile(seId);
      if (apiError) throw new Error(apiError);
      setSelectedSE(data);
    } catch (err: any) {
      console.error('Error loading SE profile:', err);
      alert('Failed to load profile: ' + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // Filter SEs based on search query
  const filteredSEs = seList.filter(se => {
    const searchLower = searchQuery.toLowerCase();
    return (
      se.name.toLowerCase().includes(searchLower) ||
      se.phone.includes(searchQuery) ||
      se.employeeId?.toLowerCase().includes(searchLower) ||
      se.region.toLowerCase().includes(searchLower)
    );
  });

  // Extract unique regions and zones
  const regions = Array.from(new Set(seList.map(se => se.region))).filter(Boolean);
  const teams = Array.from(new Set(seList.map(se => se.zone))).filter(Boolean);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SE Profile Viewer</h1>
        <p className="text-gray-600">View detailed profiles and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - SE List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Sales Executives ({filteredSEs.length})
            </h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, phone, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <select
                  value={filterRegion}
                  onChange={(e) => setFilterRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                >
                  <option value="all">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                >
                  <option value="all">All Teams</option>
                  {teams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SE List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="py-8">
                <ErrorMessage message={error} onRetry={loadSEs} />
              </div>
            ) : filteredSEs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>No Sales Executives found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredSEs.map((se) => (
                  <button
                    key={se.id}
                    onClick={() => loadSEProfile(se.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedSE?.id === se.id
                        ? 'bg-[#E60000]/5 border-[#E60000]'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{se.name}</p>
                        <p className="text-sm text-gray-500">{se.employeeId || 'No ID'}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium ml-2">
                        {se.totalPoints} pts
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {se.region}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {se.totalSubmissions}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Profile Details */}
        <div className="lg:col-span-2">
          {!selectedSE ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Select an SE to View Profile</h3>
              <p className="text-gray-600">Choose a Sales Executive from the list to see detailed information</p>
            </div>
          ) : profileLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-[#E60000] to-[#CC0000] rounded-xl p-8 text-white relative overflow-hidden">
                <button
                  onClick={() => setSelectedSE(null)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-4xl">
                    <User className="w-12 h-12" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2">{selectedSE.full_name}</h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{selectedSE.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{selectedSE.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{selectedSE.region}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{selectedSE.teamName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {formatDate(selectedSE.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Points</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedSE.stats.totalPoints}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-1">Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedSE.stats.totalSubmissions}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-1">Approval Rate</p>
                  <p className="text-2xl font-bold text-green-600">{selectedSE.stats.approvalRate}%</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-1">Avg Points</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedSE.stats.avgPointsPerSubmission}</p>
                </div>
              </div>

              {/* Submission Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Submission Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{selectedSE.stats.approvedSubmissions}</p>
                    <p className="text-sm text-gray-600 mt-1">Approved</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-3xl font-bold text-yellow-600">{selectedSE.stats.pendingSubmissions}</p>
                    <p className="text-sm text-gray-600 mt-1">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">{selectedSE.stats.rejectedSubmissions}</p>
                    <p className="text-sm text-gray-600 mt-1">Rejected</p>
                  </div>
                </div>
              </div>

              {/* Recent Submissions */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Recent Submissions</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {selectedSE.recentSubmissions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p className="text-4xl mb-2">📭</p>
                      <p>No submissions yet</p>
                    </div>
                  ) : (
                    selectedSE.recentSubmissions.map((submission: any) => (
                      <div key={submission.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {submission.mission_types?.name || 'Unknown Mission'}
                            </p>
                            <p className="text-sm text-gray-500">{submission.location_name || 'Unknown Location'}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                              {submission.status}
                            </span>
                            {submission.status === 'approved' && (
                              <p className="text-sm font-bold text-blue-600 mt-1">
                                +{submission.points_awarded} pts
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">{formatDate(submission.created_at)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Badges */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Achievements ({selectedSE.badges.length})
                </h3>
                {selectedSE.badges.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-4xl mb-2">🏆</p>
                    <p>No achievements unlocked yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedSE.badges.map((badge: any) => (
                      <div
                        key={badge.id}
                        className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200 text-center"
                      >
                        <div className="text-3xl mb-2">{badge.achievements?.icon || '🏆'}</div>
                        <p className="font-bold text-gray-900 text-sm">{badge.achievements?.name || 'Achievement'}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(badge.unlocked_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}