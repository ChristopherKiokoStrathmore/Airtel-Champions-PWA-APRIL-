import { useState, useEffect } from 'react';
import { getMissionTypes, updateMissionPoints } from '../lib/supabase';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';

interface MissionType {
  id: string;
  name: string;
  description: string;
  base_points: number;
  icon?: string;
}

export function PointConfiguration() {
  const [missionTypes, setMissionTypes] = useState<MissionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<MissionType[]>([]);

  // Bonus multipliers (these would come from a settings table in a real app)
  const [bonusMultipliers, setBonusMultipliers] = useState({
    weekend: 1.5,
    highPriority: 2.0,
    firstTime: 1.2
  });

  useEffect(() => {
    loadMissionTypes();
  }, []);

  const loadMissionTypes = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getMissionTypes();
      if (fetchError) throw new Error(fetchError);

      setMissionTypes(data || []);
      setOriginalData(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load mission types');
    } finally {
      setLoading(false);
    }
  };

  const updatePoints = (id: string, newPoints: number) => {
    setMissionTypes(prev =>
      prev.map(mission =>
        mission.id === id ? { ...mission, base_points: newPoints } : mission
      )
    );
    setHasChanges(true);
  };

  const updateMultiplier = (key: keyof typeof bonusMultipliers, value: number) => {
    setBonusMultipliers(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update all changed mission types
      for (const mission of missionTypes) {
        const original = originalData.find(m => m.id === mission.id);
        if (original && original.base_points !== mission.base_points) {
          const { error } = await updateMissionPoints(mission.id, mission.base_points);
          if (error) throw new Error(error);
        }
      }

      // Reload to confirm changes
      await loadMissionTypes();
      setHasChanges(false);
      alert('Point configuration saved successfully! Changes will apply to new submissions.');
    } catch (err: any) {
      alert('Error saving changes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all point values to original values?')) {
      setMissionTypes([...originalData]);
      setBonusMultipliers({ weekend: 1.5, highPriority: 2.0, firstTime: 1.2 });
      setHasChanges(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadMissionTypes} />;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Point Configuration</h1>
        <p className="text-gray-600">Adjust point values for each mission type and bonus multipliers</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-medium text-blue-900 mb-1">Important Notes:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Changes apply to new submissions only (existing submissions remain unchanged)</li>
              <li>• All changes are logged for audit purposes</li>
              <li>• Point values directly impact leaderboard rankings</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mission Point Values */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Mission Type Point Values</h2>
            
            {missionTypes.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No mission types found</p>
                <p className="text-sm text-gray-400 mt-2">Mission types should be configured in the database</p>
              </div>
            ) : (
              <div className="space-y-4">
                {missionTypes.map((mission) => (
                  <div key={mission.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">
                          {mission.icon && <span className="mr-2">{mission.icon}</span>}
                          {mission.name}
                        </h3>
                        <p className="text-sm text-gray-600">{mission.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Point Value
                        </label>
                        <input
                          type="number"
                          value={mission.base_points}
                          onChange={(e) => updatePoints(mission.id, parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                          min="0"
                          step="10"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preview
                        </label>
                        <div className="px-4 py-2 bg-[#E60000] text-white font-bold rounded-lg text-center">
                          {mission.base_points} Points
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bonus Multipliers */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Bonus Multipliers</h2>
            <p className="text-sm text-gray-600 mb-4">Note: Multipliers are configured but not yet connected to backend. Coming soon!</p>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Weekend Submissions</h3>
                    <p className="text-sm text-gray-600">Bonus for Saturday-Sunday submissions</p>
                  </div>
                  <span className="text-2xl">📅</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={bonusMultipliers.weekend}
                    onChange={(e) => updateMultiplier('weekend', parseFloat(e.target.value) || 1)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                    min="1"
                    max="3"
                    step="0.1"
                  />
                  <span className="font-bold text-gray-900">{bonusMultipliers.weekend}x</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Example: 100 pts × {bonusMultipliers.weekend}x = {100 * bonusMultipliers.weekend} pts
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">High-Priority Zones</h3>
                    <p className="text-sm text-gray-600">Bonus for strategic locations</p>
                  </div>
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={bonusMultipliers.highPriority}
                    onChange={(e) => updateMultiplier('highPriority', parseFloat(e.target.value) || 1)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                    min="1"
                    max="3"
                    step="0.1"
                  />
                  <span className="font-bold text-gray-900">{bonusMultipliers.highPriority}x</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Example: 100 pts × {bonusMultipliers.highPriority}x = {100 * bonusMultipliers.highPriority} pts
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">First-Time Submission</h3>
                    <p className="text-sm text-gray-600">Bonus for new mission types</p>
                  </div>
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    value={bonusMultipliers.firstTime}
                    onChange={(e) => updateMultiplier('firstTime', parseFloat(e.target.value) || 1)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E60000] focus:border-transparent"
                    min="1"
                    max="2"
                    step="0.1"
                  />
                  <span className="font-bold text-gray-900">{bonusMultipliers.firstTime}x</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Example: 100 pts × {bonusMultipliers.firstTime}x = {100 * bonusMultipliers.firstTime} pts
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {hasChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <p className="font-medium text-yellow-900">You have unsaved changes</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-[#E60000] text-white rounded-lg font-medium hover:bg-[#CC0000] transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Current Values</h2>
            
            <div className="space-y-3">
              {missionTypes.map((mission) => (
                <div key={mission.id} className="pb-3 border-b border-gray-200 last:border-0">
                  <p className="text-sm font-medium text-gray-900">{mission.name}</p>
                  <p className="text-lg font-bold text-[#E60000]">{mission.base_points} pts</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-br from-[#E60000] to-[#CC0000] rounded-xl p-6 text-white mt-6">
            <h3 className="font-bold mb-3">💡 Quick Tips</h3>
            <ul className="text-sm space-y-2 text-white/90">
              <li>• Higher points = more competitive missions</li>
              <li>• Use bonuses to incentivize strategic areas</li>
              <li>• Monitor leaderboard impact after changes</li>
              <li>• Adjust based on business priorities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
