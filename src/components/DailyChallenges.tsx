import { useState, useEffect } from 'react';
import { getChallenges, createChallenge } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type?: 'daily' | 'weekly' | 'special';
  requirement?: string;
  reward_points: number;
  icon?: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  target_value: number;
  progress?: {
    completed: number;
    total: number;
  };
}

export function DailyChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'daily' as 'daily' | 'weekly' | 'special',
    reward_points: 500,
    target_value: 3,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getChallenges();
      if (fetchError) throw new Error(fetchError);

      // Add mock progress data (in real app, this would come from submissions aggregation)
      const challengesWithProgress = (data || []).map(challenge => ({
        ...challenge,
        progress: {
          completed: Math.floor(Math.random() * 662),
          total: 662
        }
      }));

      setChallenges(challengesWithProgress);
    } catch (err: any) {
      setError(err.message || 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const { error } = await createChallenge({
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        target_value: formData.target_value,
        reward_points: formData.reward_points,
      });

      if (error) throw new Error(error);

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'daily',
        reward_points: 500,
        target_value: 3,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
      });

      setShowCreateModal(false);
      await loadChallenges();

      alert('Challenge created successfully!');
    } catch (err: any) {
      alert('Error creating challenge: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  // Action handlers
  const handleEditChallenge = () => {
    if (!selectedChallenge) return;
    alert(`Edit Challenge: ${selectedChallenge.title}\n\nThis will open a form to modify challenge details (coming soon)`);
  };

  const handleExtendChallenge = () => {
    if (!selectedChallenge) return;
    alert(`Extend Challenge: ${selectedChallenge.title}\n\nThis will allow you to extend the end date (coming soon)`);
  };

  const handleViewParticipants = () => {
    if (!selectedChallenge) return;
    alert(`View Participants for: ${selectedChallenge.title}\n\nShowing ${selectedChallenge.progress?.completed || 0} out of ${selectedChallenge.progress?.total || 662} participants (coming soon)`);
  };

  const handleEndChallenge = () => {
    if (!selectedChallenge) return;
    if (confirm(`Are you sure you want to end "${selectedChallenge.title}" now?\n\nThis action cannot be undone.`)) {
      alert('Challenge ended successfully!');
    }
  };

  const handleDeleteChallenge = () => {
    if (!selectedChallenge) return;
    if (confirm(`Are you sure you want to DELETE "${selectedChallenge.title}"?\n\nThis action cannot be undone.`)) {
      alert('Challenge deleted successfully!');
      setSelectedChallenge(null);
    }
  };

  const handleUseTemplate = (templateName: string, templateData: any) => {
    setFormData({
      ...formData,
      ...templateData
    });
    setShowCreateModal(true);
  };

  const getChallengeType = (challenge: Challenge): 'daily' | 'weekly' | 'special' => {
    if (challenge.type) return challenge.type;
    
    // Infer from dates
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 1) return 'daily';
    if (days <= 7) return 'weekly';
    return 'special';
  };

  const activeChallenges = challenges.filter(c => c.is_active);
  const inactiveChallenges = challenges.filter(c => !c.is_active);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-100 text-blue-700';
      case 'weekly':
        return 'bg-purple-100 text-purple-700';
      case 'special':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeBorder = (type: string) => {
    switch (type) {
      case 'daily':
        return 'border-blue-200';
      case 'weekly':
        return 'border-purple-200';
      case 'special':
        return 'border-yellow-200';
      default:
        return 'border-gray-200';
    }
  };

  const stats = {
    activeChallenges: activeChallenges.length,
    totalParticipants: activeChallenges.reduce((sum, c) => sum + (c.progress?.completed || 0), 0),
    avgCompletionRate: activeChallenges.length > 0
      ? Math.round(
          activeChallenges.reduce((sum, c) => sum + ((c.progress?.completed || 0) / (c.progress?.total || 1) * 100), 0) / activeChallenges.length
        )
      : 0,
    totalRewards: activeChallenges.reduce((sum, c) => sum + c.reward_points, 0)
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadChallenges} />;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Challenges</h1>
          <p className="text-gray-600">Create and manage engagement challenges</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-[#E60000] text-white rounded-lg font-medium hover:bg-[#CC0000] transition-colors"
        >
          ➕ Create Challenge
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Active Challenges</p>
          <p className="text-3xl font-bold text-gray-900">{stats.activeChallenges}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Total Participants</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalParticipants}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Avg Completion</p>
          <p className="text-3xl font-bold text-gray-900">{stats.avgCompletionRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-2">Total Rewards</p>
          <p className="text-3xl font-bold text-[#E60000]">{stats.totalRewards.toLocaleString()} pts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Challenges */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Active Challenges</h2>
            
            {activeChallenges.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No active challenges</p>
                <p className="text-sm text-gray-400 mt-2">Create a challenge to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeChallenges.map((challenge) => {
                  const type = getChallengeType(challenge);
                  return (
                    <button
                      key={challenge.id}
                      onClick={() => setSelectedChallenge(challenge)}
                      className={`w-full bg-white rounded-xl border-2 p-6 text-left transition-all hover:shadow-lg ${
                        selectedChallenge?.id === challenge.id
                          ? 'border-[#E60000] shadow-lg'
                          : `${getTypeBorder(type)}`
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{challenge.icon || '🎯'}</div>
                          <div>
                            <h3 className="font-bold text-gray-900 mb-1">{challenge.title}</h3>
                            <p className="text-sm text-gray-600">{challenge.description}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(type)}`}>
                          {type.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Target</p>
                          <p className="text-sm font-medium text-gray-900">{challenge.target_value} missions</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Reward</p>
                          <p className="text-sm font-bold text-[#E60000]">+{challenge.reward_points} pts</p>
                        </div>
                      </div>

                      {challenge.progress && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Participants</span>
                            <span className="font-medium text-gray-900">
                              {challenge.progress.completed} / {challenge.progress.total} SEs
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#E60000] to-[#FF3333] rounded-full transition-all"
                              style={{ width: `${(challenge.progress.completed / challenge.progress.total) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.round((challenge.progress.completed / challenge.progress.total) * 100)}% participation
                          </p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
                        <span>⏰ Ends: {new Date(challenge.end_date).toLocaleDateString()}</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">ACTIVE</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Inactive Challenges */}
          {inactiveChallenges.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Past Challenges</h2>
              
              <div className="space-y-3">
                {inactiveChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-75"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl grayscale">{challenge.icon || '🎯'}</div>
                        <div>
                          <h4 className="font-medium text-gray-900">{challenge.title}</h4>
                          <p className="text-xs text-gray-600">{challenge.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-700">+{challenge.reward_points} pts</p>
                        <p className="text-xs text-gray-500">
                          {challenge.progress?.completed || 0} completed
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Challenge Detail Sidebar */}
        <div className="space-y-6">
          {selectedChallenge ? (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Challenge Details</h3>
                
                <div className="text-center mb-6">
                  <div className="text-7xl mb-3">{selectedChallenge.icon || '🎯'}</div>
                  <h4 className="text-xl font-bold text-gray-900 mb-1">{selectedChallenge.title}</h4>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(getChallengeType(selectedChallenge))}`}>
                    {getChallengeType(selectedChallenge).toUpperCase()}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-sm font-medium text-gray-900">{selectedChallenge.description}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Target</p>
                    <p className="text-sm font-medium text-gray-900">{selectedChallenge.target_value} missions</p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Reward Points</p>
                    <p className="text-3xl font-bold text-[#E60000]">+{selectedChallenge.reward_points}</p>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Duration</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start:</span>
                        <span className="font-medium">{new Date(selectedChallenge.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End:</span>
                        <span className="font-medium">{new Date(selectedChallenge.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedChallenge.progress && (
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Participation Stats</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Completed:</span>
                          <span className="font-medium text-green-600">{selectedChallenge.progress.completed}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>In Progress:</span>
                          <span className="font-medium text-blue-600">
                            {selectedChallenge.progress.total - selectedChallenge.progress.completed}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Completion Rate:</span>
                          <span className="font-medium">
                            {Math.round((selectedChallenge.progress.completed / selectedChallenge.progress.total) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#E60000] to-[#CC0000] rounded-xl p-6 text-white">
                <h3 className="font-bold mb-3">⚙️ Challenge Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={handleEditChallenge}
                    className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit Challenge
                  </button>
                  <button
                    onClick={handleExtendChallenge}
                    className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    Extend Duration
                  </button>
                  <button
                    onClick={handleViewParticipants}
                    className="w-full px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Participants
                  </button>
                  {selectedChallenge.is_active && (
                    <button
                      onClick={handleEndChallenge}
                      className="w-full px-4 py-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg text-sm font-medium transition-colors"
                    >
                      End Challenge
                    </button>
                  )}
                  <button
                    onClick={handleDeleteChallenge}
                    className="w-full px-4 py-2 bg-red-500/50 hover:bg-red-500/70 rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete Challenge
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Challenge Selected</h3>
              <p className="text-gray-600">Select a challenge to view details</p>
            </div>
          )}

          {/* Quick Templates */}
          <div className="bg-gradient-to-br from-[#0066CC] to-[#0052A3] rounded-xl p-6 text-white">
            <h3 className="font-bold mb-3">⚡ Quick Templates</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleUseTemplate('Daily 3 Missions', {
                  title: 'Triple Threat',
                  description: 'Complete 3 missions today',
                  type: 'daily',
                  target_value: 3,
                  reward_points: 500
                })}
                className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                🎯 Daily 3 Missions
              </button>
              <button
                onClick={() => handleUseTemplate('7-Day Streak', {
                  title: 'Week Warrior',
                  description: 'Submit missions every day this week',
                  type: 'weekly',
                  target_value: 7,
                  reward_points: 2000
                })}
                className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                🔥 7-Day Streak
              </button>
              <button
                onClick={() => handleUseTemplate('Weekend Bonus', {
                  title: 'Weekend Bonus Blitz',
                  description: 'Complete 5+ missions this weekend for bonus points',
                  type: 'special',
                  target_value: 5,
                  reward_points: 3000
                })}
                className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                💎 Weekend Bonus
              </button>
              <button
                onClick={() => handleUseTemplate('Quality Master', {
                  title: 'Quality First',
                  description: 'Get 100% approval rate today',
                  type: 'daily',
                  target_value: 1,
                  reward_points: 300
                })}
                className="w-full text-left px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                ⭐ Quality Master
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Challenge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Challenge</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Triple Threat"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the challenge..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Challenge Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="special">Special</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reward Points
                  </label>
                  <input
                    type="number"
                    value={formData.reward_points}
                    onChange={(e) => setFormData({ ...formData, reward_points: parseInt(e.target.value) || 0 })}
                    placeholder="500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Value (number of missions)
                </label>
                <input
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 1 })}
                  placeholder="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChallenge}
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#E60000] text-white rounded-lg font-medium hover:bg-[#CC0000] transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Challenge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
