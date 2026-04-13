import { useState, useEffect } from 'react';
import { Target, CheckCircle, Clock, Flame, Trophy, Star, Award } from 'lucide-react';

interface Mission {
  id: number;
  title: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  points: number;
  completed: boolean;
  type: 'submission' | 'approval' | 'quality' | 'streak';
}

interface DailyMissionsProps {
  onClose: () => void;
}

export function DailyMissions({ onClose }: DailyMissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [streak, setStreak] = useState(7);
  const [totalPoints, setTotalPoints] = useState(145);
  const [level, setLevel] = useState(5);
  const [nextLevelPoints, setNextLevelPoints] = useState(200);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<any>(null);

  useEffect(() => {
    loadDailyMissions();
  }, []);

  const loadDailyMissions = () => {
    // Generate daily missions (resets at midnight)
    const today = new Date().toDateString();
    
    setMissions([
      {
        id: 1,
        title: 'Network Scout',
        description: 'Submit 3 Network Experience reports',
        icon: '📶',
        progress: 2,
        target: 3,
        points: 15,
        completed: false,
        type: 'submission',
      },
      {
        id: 2,
        title: 'Quality Agent',
        description: 'Get 2 submissions approved by your ZSM',
        icon: '⭐',
        progress: 1,
        target: 2,
        points: 20,
        completed: false,
        type: 'approval',
      },
      {
        id: 3,
        title: 'Early Bird',
        description: 'Submit before 10:00 AM',
        icon: '🌅',
        progress: 1,
        target: 1,
        points: 10,
        completed: true,
        type: 'submission',
      },
    ]);
  };

  const handleClaimReward = (mission: Mission) => {
    if (!mission.completed) return;

    // Update points
    setTotalPoints((prev) => prev + mission.points);

    // Mark as claimed
    setMissions(missions.map((m) => 
      m.id === mission.id ? { ...m, claimed: true } : m
    ));

    // Check for level up
    checkLevelUp(totalPoints + mission.points);

    // Check for badges
    checkBadgeUnlock();
  };

  const checkLevelUp = (newPoints: number) => {
    if (newPoints >= nextLevelPoints) {
      setLevel((prev) => prev + 1);
      setNextLevelPoints((prev) => prev + 100);
      
      // Show level up celebration
      showCelebration('🎉 Level Up!', `You've reached Level ${level + 1}!`);
    }
  };

  const checkBadgeUnlock = () => {
    // Check if streak milestone reached
    if (streak === 7) {
      const badge = {
        name: 'Week Warrior',
        description: '7-day streak achieved!',
        icon: '🔥',
        rarity: 'gold',
      };
      setUnlockedBadge(badge);
      setShowBadgeModal(true);
    }
  };

  const showCelebration = (title: string, message: string) => {
    // Simple alert for now - could be a fancy modal
    alert(`${title}\n${message}`);
  };

  const getProgressPercentage = (mission: Mission) => {
    return Math.min((mission.progress / mission.target) * 100, 100);
  };

  const completedMissionsCount = missions.filter((m) => m.completed).length;
  const totalMissionsPoints = missions.reduce((sum, m) => sum + (m.completed ? m.points : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-up-bottom overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <Target className="w-7 h-7" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Daily Missions</h2>
                <p className="text-sm opacity-90">Complete to earn bonus points!</p>
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

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Flame className="w-5 h-5 mr-1" strokeWidth={2} />
                <p className="text-2xl font-bold">{streak}</p>
              </div>
              <p className="text-xs opacity-75">Day Streak</p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="w-5 h-5 mr-1" strokeWidth={2} />
                <p className="text-2xl font-bold">{level}</p>
              </div>
              <p className="text-xs opacity-75">Level</p>
            </div>

            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center mb-1">
                <Star className="w-5 h-5 mr-1" strokeWidth={2} />
                <p className="text-2xl font-bold">{completedMissionsCount}/3</p>
              </div>
              <p className="text-xs opacity-75">Completed</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Level Progress */}
          <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-3">
                  <Trophy className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Level {level}</p>
                  <p className="text-sm text-gray-600">{totalPoints} / {nextLevelPoints} points</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">{nextLevelPoints - totalPoints} to Level {level + 1}</p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${(totalPoints / nextLevelPoints) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Missions List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Target className="w-5 h-5 mr-2" strokeWidth={2} />
              Today's Missions
            </h3>

            {missions.map((mission, index) => {
              const progressPercentage = getProgressPercentage(mission);
              const isComplete = mission.completed;

              return (
                <div
                  key={mission.id}
                  className="bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden transition-all hover:shadow-md animate-slide-in-right"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-5">
                    {/* Mission Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mr-3 ${
                          isComplete ? 'bg-green-50' : 'bg-gray-50'
                        }`}>
                          {isComplete ? (
                            <CheckCircle className="w-7 h-7 text-green-600" strokeWidth={2} />
                          ) : (
                            mission.icon
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <h4 className="font-semibold text-gray-900">{mission.title}</h4>
                            {isComplete && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                Complete
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{mission.description}</p>
                        </div>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-lg font-bold text-purple-600">+{mission.points}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">
                          Progress: {mission.progress} / {mission.target}
                        </p>
                        <p className="text-sm font-medium text-purple-600">
                          {progressPercentage.toFixed(0)}%
                        </p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isComplete ? 'bg-green-500' : 'bg-purple-600'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Button */}
                    {isComplete && (
                      <button
                        onClick={() => handleClaimReward(mission)}
                        className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl transition-all font-medium flex items-center justify-center active:scale-95"
                      >
                        <Award className="w-5 h-5 mr-2" strokeWidth={2} />
                        Claim {mission.points} Points
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Streak Info */}
          <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-5">
            <div className="flex items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <Flame className="w-7 h-7 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  🔥 {streak}-Day Streak!
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  You've submitted intelligence for {streak} consecutive days. Keep it up to unlock the <strong>Week Warrior</strong> badge!
                </p>
                <div className="flex items-center gap-2 mt-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div
                      key={day}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        day <= streak
                          ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Next Missions Timer */}
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center">
            <Clock className="w-6 h-6 text-blue-600 mr-3" strokeWidth={2} />
            <div className="flex-1">
              <p className="font-medium text-gray-900">New missions in</p>
              <p className="text-sm text-gray-600">Resets at midnight (00:00)</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {new Date().getHours() < 12 ? (24 - new Date().getHours()) : (24 - new Date().getHours())}h
              </p>
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

      {/* Badge Unlock Modal */}
      {showBadgeModal && unlockedBadge && (
        <BadgeUnlockModal
          badge={unlockedBadge}
          onClose={() => setShowBadgeModal(false)}
        />
      )}
    </div>
  );
}

function BadgeUnlockModal({ badge, onClose }: { badge: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 animate-fade-in" onClick={onClose}></div>

      {/* Badge Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm mx-4 text-center animate-bounce-in">
        {/* Confetti Effect (CSS) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-confetti-1"></div>
          <div className="absolute top-0 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-confetti-2"></div>
          <div className="absolute top-0 left-1/3 w-2 h-2 bg-red-400 rounded-full animate-confetti-3"></div>
        </div>

        {/* Badge Icon */}
        <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse-badge">
          <span className="text-6xl">{badge.icon}</span>
        </div>

        {/* Badge Info */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Badge Unlocked!</h3>
        <p className="text-xl font-semibold text-purple-600 mb-2">{badge.name}</p>
        <p className="text-gray-600 mb-6">{badge.description}</p>

        {/* Rarity */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${
          badge.rarity === 'gold' ? 'bg-yellow-100 text-yellow-700' :
          badge.rarity === 'silver' ? 'bg-gray-100 text-gray-700' :
          'bg-orange-100 text-orange-700'
        }`}>
          <Award className="w-4 h-4" strokeWidth={2} />
          <span>{badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)} Badge</span>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all font-medium active:scale-95"
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  );
}
