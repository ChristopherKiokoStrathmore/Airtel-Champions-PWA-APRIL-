import { useState } from 'react';

// Import Airtel Champions logo (now using universal LOGO.png)
import airtelChampionsLogo from '../assets/LOGO.png';

interface AdminLoginProps {
  onLogin: (phone: string, method: 'pin' | 'otp', credential: string) => Promise<void>;
  onSendOTP: (phone: string) => Promise<void>;
  onForgotPin: (phone: string, otp: string, newPin: string) => Promise<void>;
  error?: string;
  loading?: boolean;
  otpSent?: boolean;
  forgotPinMode?: boolean;
}

export function AdminLogin({ 
  onLogin, 
  onSendOTP,
  onForgotPin,
  error, 
  loading,
  otpSent = false,
  forgotPinMode = false
}: AdminLoginProps) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loginMethod, setLoginMethod] = useState<'pin' | 'otp'>('pin');
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [forgotPinStep, setForgotPinStep] = useState<'phone' | 'otp' | 'newpin'>('phone');
  const [forgotPinPhone, setForgotPinPhone] = useState('');
  const [forgotPinOtp, setForgotPinOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginMethod === 'pin') {
      await onLogin(phone, 'pin', pin);
    } else {
      if (!otpSent) {
        // Request OTP
        await onSendOTP(phone);
      } else {
        // Verify OTP
        await onLogin(phone, 'otp', otp);
      }
    }
  };

  const handleForgotPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (forgotPinStep === 'phone') {
      // Send OTP for forgot PIN
      await onSendOTP(forgotPinPhone);
      setForgotPinStep('otp');
    } else if (forgotPinStep === 'otp') {
      // Verify OTP and move to new PIN step
      setForgotPinStep('newpin');
    } else if (forgotPinStep === 'newpin') {
      // Reset PIN
      if (newPin !== confirmPin) {
        alert('PINs do not match!');
        return;
      }
      if (newPin.length !== 4) {
        alert('PIN must be 4 digits!');
        return;
      }
      await onForgotPin(forgotPinPhone, forgotPinOtp, newPin);
      // Reset state
      setShowForgotPin(false);
      setForgotPinStep('phone');
      setForgotPinPhone('');
      setForgotPinOtp('');
      setNewPin('');
      setConfirmPin('');
    }
  };

  const handleSwitchMethod = () => {
    setLoginMethod(loginMethod === 'pin' ? 'otp' : 'pin');
    setPin('');
    setOtp('');
  };

  if (showForgotPin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 mb-4">
              <img 
                src={airtelChampionsLogo} 
                alt="Airtel Champions" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot PIN</h1>
            <p className="text-gray-600">Reset your PIN to regain access</p>
          </div>

          {/* Forgot PIN Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleForgotPinSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className={`flex items-center ${forgotPinStep === 'phone' ? 'text-[#E60000]' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${forgotPinStep === 'phone' ? 'bg-[#E60000] text-white' : 'bg-gray-200'}`}>
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Phone</span>
                </div>
                <div className="flex-1 h-1 mx-2 bg-gray-200">
                  <div className={`h-full ${forgotPinStep !== 'phone' ? 'bg-[#E60000]' : 'bg-gray-200'}`} />
                </div>
                <div className={`flex items-center ${forgotPinStep === 'otp' ? 'text-[#E60000]' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${forgotPinStep === 'otp' ? 'bg-[#E60000] text-white' : 'bg-gray-200'}`}>
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Verify</span>
                </div>
                <div className="flex-1 h-1 mx-2 bg-gray-200">
                  <div className={`h-full ${forgotPinStep === 'newpin' ? 'bg-[#E60000]' : 'bg-gray-200'}`} />
                </div>
                <div className={`flex items-center ${forgotPinStep === 'newpin' ? 'text-[#E60000]' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${forgotPinStep === 'newpin' ? 'bg-[#E60000] text-white' : 'bg-gray-200'}`}>
                    3
                  </div>
                  <span className="ml-2 text-sm font-medium">Reset</span>
                </div>
              </div>

              {forgotPinStep === 'phone' && (
                <div>
                  <label htmlFor="forgot-phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    id="forgot-phone"
                    type="tel"
                    value={forgotPinPhone}
                    onChange={(e) => setForgotPinPhone(e.target.value)}
                    placeholder="+254700000001"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all text-gray-900"
                    style={{ color: '#111827' }}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enter your registered phone number to receive an OTP
                  </p>
                </div>
              )}

              {forgotPinStep === 'otp' && (
                <div>
                  <label htmlFor="forgot-otp" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP Code
                  </label>
                  <input
                    id="forgot-otp"
                    type="text"
                    value={forgotPinOtp}
                    onChange={(e) => setForgotPinOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all text-center text-2xl tracking-widest text-gray-900"
                    style={{ color: '#111827' }}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Check your phone for the 6-digit code
                  </p>
                </div>
              )}

              {forgotPinStep === 'newpin' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="new-pin" className="block text-sm font-medium text-gray-700 mb-2">
                      New PIN
                    </label>
                    <input
                      id="new-pin"
                      type="password"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      maxLength={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-pin" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm PIN
                    </label>
                    <input
                      id="confirm-pin"
                      type="password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      maxLength={4}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  {newPin && confirmPin && newPin !== confirmPin && (
                    <p className="text-sm text-red-600">PINs do not match</p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPin(false);
                    setForgotPinStep('phone');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#E60000] text-white py-3 rounded-lg font-medium hover:bg-[#CC0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : forgotPinStep === 'phone' ? 'Send OTP' : forgotPinStep === 'otp' ? 'Verify OTP' : 'Reset PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 mb-4">
            <img 
              src={airtelChampionsLogo} 
              alt="Airtel Champions" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Airtel Champions Intelligence Network</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Login Method Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('pin')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'pin'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              PIN Login
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('otp')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginMethod === 'otp'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              OTP Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {otpSent && loginMethod === 'otp' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium">✓ OTP sent to {phone}</p>
                <p className="text-xs text-green-700 mt-1">Check the console for the OTP code (in production, this will be sent via SMS)</p>
              </div>
            )}

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254700000001"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all"
                required
                disabled={otpSent && loginMethod === 'otp'}
              />
            </div>

            {loginMethod === 'pin' && (
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  PIN
                </label>
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all"
                  required
                />
              </div>
            )}

            {loginMethod === 'otp' && otpSent && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP Code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#E60000] focus:border-transparent transition-all text-center text-2xl tracking-widest"
                  required
                />
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E60000] text-white py-3 rounded-lg font-medium hover:bg-[#CC0000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? 'Processing...' 
                : loginMethod === 'otp' && !otpSent 
                ? 'Send OTP' 
                : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {loginMethod === 'pin' && (
              <button
                onClick={() => setShowForgotPin(true)}
                className="text-sm text-[#E60000] hover:text-[#CC0000] font-medium"
              >
                Forgot PIN?
              </button>
            )}
            {loginMethod === 'otp' && otpSent && (
              <button
                onClick={() => onSendOTP(phone)}
                disabled={loading}
                className="text-sm text-[#E60000] hover:text-[#CC0000] font-medium disabled:opacity-50"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">🔐 Test Accounts:</p>
          <div className="space-y-1">
            <p className="text-sm text-blue-700"><strong>Admin:</strong> +254700000001 | PIN: 1234</p>
            <p className="text-sm text-blue-700"><strong>ZSM:</strong> +254710000001 | PIN: 1234</p>
            <p className="text-xs text-blue-600 mt-2">
              💡 For OTP login: Check browser console for the OTP code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}