// LoginScreen.tsx - Extracted from App.tsx for better maintainability
import React, { useState } from 'react';
import { LoginPage } from './LoginPage';
import { SignupScreen } from './signup-screen';

interface LoginScreenProps {
  onShowSignup: () => void;
  setUser: (user: any) => void;
  setUserData: (data: any) => void;
  setIsAuthenticated: (auth: boolean) => void;
}

export function LoginScreen({ onShowSignup, setUser, setUserData, setIsAuthenticated }: LoginScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelpContact, setShowHelpContact] = useState(false);

  // 🛡️ Error Boundary for UpdateManager to prevent crashes if DB table missing
  // This ensures the app still works even if the SQL migration hasn't been run
  React.useEffect(() => {
    const suppressMissingTableError = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('app_versions')) {
        console.warn('⚠️ App Update check failed: app_versions table missing. Skipping check.');
        event.preventDefault(); // Prevent crash
      }
    };
    window.addEventListener('unhandledrejection', suppressMissingTableError);
    return () => window.removeEventListener('unhandledrejection', suppressMissingTableError);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EA0228] to-[#003C71] flex flex-col justify-center items-center p-4 overflow-y-auto">
      <div className="w-full max-w-md flex flex-col justify-center items-center">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl font-bold text-[#EA0228]">TA</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Airtel Champions</h1>
          <p className="text-white/80">Empowering Sales Excellence</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <button className="px-6 py-2 bg-[#EA0228] text-white rounded-full text-sm font-medium">
              Login
            </button>
            <button 
              onClick={onShowSignup}
              className="px-6 py-2 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-100"
            >
              Sign Up
            </button>
          </div>
          
          <LoginPage
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            pin={pin}
            setPin={setPin}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            error={error}
            setError={setError}
            setUser={setUser}
            setUserData={setUserData}
            setIsAuthenticated={setIsAuthenticated}
          />
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => setShowHelpContact(true)}
              className="text-sm text-[#EA0228] hover:underline"
            >
              Need Help? Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
