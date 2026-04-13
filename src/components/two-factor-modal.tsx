import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

interface TwoFactorModalProps {
  onClose: () => void;
  userId: string;
  userName: string;
  currentStatus: boolean;
}

export function TwoFactorModal({ onClose, userId, userName, currentStatus }: TwoFactorModalProps) {
  const [isEnabled, setIsEnabled] = useState(currentStatus);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadUserPhone();
  }, []);

  const loadUserPhone = async () => {
    try {
      const { data } = await supabase
        .from('app_users')
        .select('phone_number')
        .eq('id', userId)
        .single();
      
      if (data?.phone_number) {
        setPhoneNumber(data.phone_number);
      }
    } catch (error) {
      console.error('Error loading phone:', error);
    }
  };

  const handleToggle2FA = async () => {
    if (isEnabled) {
      // Disable 2FA
      await disable2FA();
    } else {
      // Enable 2FA - send verification code
      await send2FACode();
    }
  };

  const send2FACode = async () => {
    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Generate a 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store verification code temporarily
      await supabase.from('verification_codes').insert({
        user_id: userId,
        phone_number: phoneNumber,
        code: code,
        type: '2fa_setup',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

      // In production, send SMS via Twilio/Africa's Talking
      // For now, show the code (development only)
      alert(`📱 Your verification code is: ${code}\n\n(In production, this would be sent via SMS)`);

      setStep('verify');
    } catch (err: any) {
      console.error('Error sending code:', err);
      setError('Failed to send verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Verify the code
      const { data: codeData } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('type', '2fa_setup')
        .eq('code', verificationCode)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!codeData) {
        setError('Invalid or expired code');
        setIsSubmitting(false);
        return;
      }

      // Enable 2FA in database
      await supabase
        .from('app_users')
        .update({ two_factor_enabled: true })
        .eq('id', userId);

      // Notify developer
      await supabase.from('notifications').insert({
        recipient_role: 'developer',
        type: '2fa_enabled',
        message: `🔐 2FA enabled by ${userName} (${userId})`,
        created_at: new Date().toISOString(),
        is_read: false
      });

      setIsEnabled(true);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error verifying code:', err);
      setError('Failed to verify code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const disable2FA = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Disable 2FA in database
      await supabase
        .from('app_users')
        .update({ two_factor_enabled: false })
        .eq('id', userId);

      // Notify developer
      await supabase.from('notifications').insert({
        recipient_role: 'developer',
        type: '2fa_disabled',
        message: `🔓 2FA disabled by ${userName} (${userId})`,
        created_at: new Date().toISOString(),
        is_read: false
      });

      setIsEnabled(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error disabling 2FA:', err);
      setError('Failed to disable 2FA');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">🔒 Two-Factor Authentication</h3>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm animate-slide-up">
              ✅ 2FA {isEnabled ? 'enabled' : 'disabled'} successfully! Developer has been notified.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
              ❌ {error}
            </div>
          )}

          {/* Status Card */}
          <div className={`rounded-xl p-4 border-2 ${isEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isEnabled ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    )}
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {isEnabled ? 'Your account is protected' : 'Add extra security'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Step */}
          {step === 'setup' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">🛡️ What is 2FA?</p>
                <p className="text-xs text-blue-800">
                  Two-Factor Authentication adds an extra layer of security by requiring a code sent to your phone when logging in.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., 0712345678"
                  disabled={isSubmitting || success}
                />
              </div>

              <button
                onClick={handleToggle2FA}
                disabled={isSubmitting || success || !phoneNumber}
                className={`w-full px-4 py-3 rounded-xl transition-colors font-semibold disabled:opacity-50 ${
                  isEnabled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : isEnabled ? (
                  'Disable 2FA'
                ) : (
                  'Enable 2FA'
                )}
              </button>
            </div>
          )}

          {/* Verification Step */}
          {step === 'verify' && (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-green-900 font-medium mb-2">📱 Code Sent!</p>
                <p className="text-xs text-green-800">
                  We've sent a 6-digit code to {phoneNumber}. Enter it below to complete setup.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-center text-2xl tracking-widest font-mono"
                  placeholder="000000"
                  maxLength={6}
                  disabled={isSubmitting || success}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep('setup');
                    setVerificationCode('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors font-semibold"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  onClick={verifyAndEnable2FA}
                  disabled={isSubmitting || success || verificationCode.length !== 6}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {!success && (
            <button
              onClick={onClose}
              className="w-full py-3 text-sm text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
