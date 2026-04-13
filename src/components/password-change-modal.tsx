import { useState } from 'react';
import { supabase } from '../utils/supabase/client';

interface PasswordChangeModalProps {
  onClose: () => void;
  userId: string;
  userName: string;
}

export function PasswordChangeModal({ onClose, userId, userName }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      // Since we use localStorage-based auth (not Supabase Auth),
      // we update the password_hash directly in app_users table
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ 
          password_hash: newPassword, // In production, this should be hashed server-side
          password_updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Log the password change and notify developer
      await supabase.from('password_changes').insert({
        user_id: userId,
        changed_at: new Date().toISOString(),
        user_name: userName
      });

      // Notify developer (Christopher) via a notifications table
      await supabase.from('notifications').insert({
        recipient_role: 'developer',
        type: 'password_change',
        message: `🔐 Password changed by ${userName} (${userId})`,
        created_at: new Date().toISOString(),
        is_read: false
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">🔐 Change Password</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm animate-slide-up">
              ✅ Password changed successfully! Developer has been notified.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
              ❌ {error}
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-600"
              placeholder="Enter current password"
              disabled={success || isSubmitting}
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-600"
              placeholder="Enter new password (min 8 characters)"
              disabled={success || isSubmitting}
            />
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-600"
              placeholder="Confirm new password"
              disabled={success || isSubmitting}
            />
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-600 font-medium mb-2">Password requirements:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center">
                <span className={`mr-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                  {newPassword.length >= 8 ? '✓' : '○'}
                </span>
                At least 8 characters
              </li>
              <li className="flex items-center">
                <span className={`mr-2 ${newPassword === confirmPassword && newPassword ? 'text-green-600' : 'text-gray-400'}`}>
                  {newPassword === confirmPassword && newPassword ? '✓' : '○'}
                </span>
                Passwords match
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors font-semibold"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Changing...
                </div>
              ) : success ? (
                '✓ Changed!'
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}