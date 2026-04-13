import { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ResetPointsModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetPointsModal({ onClose, onSuccess }: ResetPointsModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'warning' | 'confirm'>('warning');

  const CONFIRMATION_TEXT = 'RESET ALL POINTS';

  const handleReset = async () => {
    if (confirmText !== CONFIRMATION_TEXT) {
      toast.error('Please type the confirmation text exactly as shown');
      return;
    }

    setLoading(true);
    console.log('[ResetPoints] 🔴 STARTING POINTS RESET - This will reset ALL user points!');
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/reset-all-points`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset points');
      }

      console.log('[ResetPoints] ✅ Points reset successful:', data);
      toast.success(`Successfully reset points for ${data.usersUpdated} users!`, {
        description: 'All users now have 0 points'
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[ResetPoints] ❌ Error resetting points:', error);
      toast.error('Failed to reset points', {
        description: error.message || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                ⚠️ Reset All Points
              </h2>
              <p className="text-red-100 text-sm mt-1">Permanent & irreversible action</p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {step === 'warning' && (
            <>
              {/* Warning Messages */}
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <p className="font-semibold text-red-800 mb-2">This action will:</p>
                    <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                      <li>Reset ALL users' <strong>total_points</strong> to 0</li>
                      <li>Reset ALL users' <strong>weekly_points</strong> to 0</li>
                      <li>Reset ALL users' <strong>monthly_points</strong> to 0</li>
                      <li>Reset ALL <strong>submission counts</strong> to 0</li>
                      <li>Clear the entire <strong>leaderboard</strong></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <p className="font-semibold text-orange-800">Historical data:</p>
                    <p className="text-sm text-orange-700 mt-1">
                      Past submissions will remain in the database, but all point counters 
                      will be zeroed out. This is useful for starting a fresh competition 
                      period while keeping historical records.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-semibold text-yellow-800">Use case:</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Start a fresh quarter/year competition while maintaining submission history
                    </p>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors"
                >
                  I Understand, Continue →
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              {/* Final Confirmation */}
              <div className="bg-red-100 border-2 border-red-300 rounded-xl p-4">
                <p className="text-center font-bold text-red-800 text-lg mb-3">
                  ⚠️ FINAL CONFIRMATION ⚠️
                </p>
                <p className="text-sm text-red-700 text-center mb-4">
                  Type <code className="bg-red-200 px-2 py-1 rounded font-mono font-bold">{CONFIRMATION_TEXT}</code> to confirm
                </p>
                
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type here..."
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-red-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-center font-semibold disabled:opacity-50"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setStep('warning');
                    setConfirmText('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading || confirmText !== CONFIRMATION_TEXT}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Resetting...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>Reset All Points</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-2">
                This action will affect {' '}
                <span className="font-bold text-red-600">ALL users</span> in the system
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
