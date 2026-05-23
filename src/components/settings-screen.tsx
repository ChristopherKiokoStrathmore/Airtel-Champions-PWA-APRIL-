import { useState, useEffect } from 'react';
import { Toast } from './toast';
import { PushNotificationBell } from './push-notification-bell';
import { Bell, BarChart3, Camera, Globe, Smartphone, Lock, Upload, User, Settings as SettingsIcon } from 'lucide-react';
import { PasswordChangeModal } from './password-change-modal';
import { TwoFactorModal } from './two-factor-modal';
import VanCalendarFeatureToggle from './van-calendar-feature-toggle';
import { getSupabaseClient } from '../utils/supabase/client';
import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';

export function SettingsScreen({ onBack, user, userData, onOpenDebugger }: { onBack: () => void; user?: any; userData?: any; onOpenDebugger?: () => void }) {
  // Track page view automatically
  usePageTracking(ANALYTICS_PAGES.SETTINGS);
  
  // Load persisted settings from localStorage on mount
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('tai_settings');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
  };
  const savedSettings = loadSavedSettings();

  const [notifications, setNotifications] = useState(savedSettings?.notifications ?? true);
  const [emailNotif, setEmailNotif] = useState(savedSettings?.emailNotif ?? true);
  const [smsNotif, setSmsNotif] = useState(savedSettings?.smsNotif ?? false);
  const [wifiOnly, setWifiOnly] = useState(savedSettings?.wifiOnly ?? false);
  const [autoSync, setAutoSync] = useState(savedSettings?.autoSync ?? true);
  const [cameraQuality, setCameraQuality] = useState(savedSettings?.cameraQuality ?? 'high');
  const [gpsTagging, setGpsTagging] = useState(savedSettings?.gpsTagging ?? true);
  const [gpsTrackingConsent, setGpsTrackingConsent] = useState(savedSettings?.gpsTrackingConsent ?? false);
  const [language, setLanguage] = useState(savedSettings?.language ?? 'english');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showFeatureToggle, setShowFeatureToggle] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(userData?.profile_photo || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const userId = user?.id || userData?.id;
  const userName = userData?.full_name || user?.full_name || 'User';
  const userRole = user?.role || userData?.role || '';
  const twoFactorEnabled = userData?.two_factor_enabled || false;
  const isHQOrDirector = ['hq_command_center', 'director'].includes(userRole);

  // Handle profile photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToastMessage('Please select an image file');
      setShowToast(true);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('Image must be less than 5MB');
      setShowToast(true);
      return;
    }

    try {
      setUploadingPhoto(true);
      const supabase = getSupabaseClient();

      // Compress and resize image
      const resizedImage = await compressImage(file, 400, 400);
      
      // Convert to blob
      const blob = await fetch(resizedImage).then(r => r.blob());
      
      // Upload to Supabase Storage
      const fileName = `profile_${userId}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('make-28f2f653-profile-photos')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('make-28f2f653-profile-photos')
        .getPublicUrl(fileName);

      const photoUrl = urlData.publicUrl;

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ profile_photo: photoUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setProfilePhoto(photoUrl);
      setToastMessage('Profile photo updated successfully!');
      setShowToast(true);

      console.log('✅ Profile photo uploaded:', photoUrl);
    } catch (error: any) {
      console.error('❌ Photo upload failed:', error);
      setToastMessage(error.message || 'Failed to upload photo');
      setShowToast(true);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Compress image to reduce file size for 2G/3G
  const compressImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress as JPEG with 0.7 quality
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // Auto-save when settings change
  useEffect(() => {
    if (hasChanges) {
      const timer = setTimeout(() => {
        saveSettings();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [notifications, emailNotif, smsNotif, wifiOnly, autoSync, cameraQuality, gpsTagging, gpsTrackingConsent, language, hasChanges]);

  const saveSettings = async () => {
    // Persist to localStorage
    const settingsPayload = {
      notifications, emailNotif, smsNotif, wifiOnly, autoSync,
      cameraQuality, gpsTagging, gpsTrackingConsent, language,
    };
    localStorage.setItem('tai_settings', JSON.stringify(settingsPayload));

    // Persist GPS consent to user record so the location tracker can read it
    if (userId) {
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from('app_users')
          .update({ gps_tracking_consent: gpsTrackingConsent })
          .eq('id', userId);

        // Also update localStorage user object so App.tsx picks it up immediately
        const storedUser = localStorage.getItem('tai_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.gps_tracking_consent = gpsTrackingConsent;
          localStorage.setItem('tai_user', JSON.stringify(parsed));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.warn('Failed to persist GPS consent to DB:', e);
      }
    }

    setToastMessage('Settings saved successfully');
    setShowToast(true);
    setHasChanges(false);
  };

  const handleToggle = (setter: (value: boolean) => void, currentValue: boolean) => {
    setter(!currentValue);
    setHasChanges(true);
  };

  // Enhanced Toggle Component - BIGGER per Steve Jobs
  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-14 h-8 rounded-full transition-all duration-300 relative active:scale-95 ${
        enabled ? 'bg-green-600' : 'bg-gray-300'
      }`}
    >
      <div
        className={`w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-300 absolute top-0.5 flex items-center justify-center ${
          enabled ? 'translate-x-7' : 'translate-x-0.5'
        }`}
      >
        {/* Checkmark when enabled - per Jony Ive */}
        {enabled && (
          <svg className="w-4 h-4 text-green-600 animate-bounce-in" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header - with gradient per board feedback */}
      <div className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={onBack} 
              className="mr-3 hover:scale-110 active:scale-95 transition-transform"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl text-gray-900">Settings</h2>
              <p className="text-sm text-gray-500">Customize your Airtel Champions experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content - with proper spacing per Dieter Rams */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Profile Photo Section */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 shadow-sm border border-red-200 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center mr-3">
              <User className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide text-red-800 font-semibold">Profile Photo</h3>
              <p className="text-xs text-red-700">Update your profile picture</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Current Photo */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500">
                    <span className="text-3xl text-white font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {/* Upload Button */}
            <div className="flex-1">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
                <div className={`px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all font-medium text-sm flex items-center justify-center gap-2 ${
                  uploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                }`}>
                  <Upload className="w-4 h-4" />
                  {uploadingPhoto ? 'Uploading...' : 'Upload New Photo'}
                </div>
              </label>
              <p className="text-xs text-red-700 mt-2">
                Max 5MB • JPG, PNG, or GIF • Optimized for 2G/3G
              </p>
            </div>
          </div>
        </div>
        
        {/* Notifications Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mr-3">
              <Bell className="w-5 h-5 text-red-600" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide text-gray-600 font-semibold">Notifications</h3>
              <p className="text-xs text-gray-500">Stay updated on missions and rewards</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">Get alerts for approvals, rank changes, challenges & announcements</p>
              </div>
              {/* Real Web Push toggle — connects to browser PushManager */}
              <PushNotificationBell userId={user?.id || userData?.id} showLabel />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">Weekly summary and important updates</p>
              </div>
              <Toggle enabled={emailNotif} onToggle={() => handleToggle(setEmailNotif, emailNotif)} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">Critical announcements via SMS</p>
              </div>
              <Toggle enabled={smsNotif} onToggle={() => handleToggle(setSmsNotif, smsNotif)} />
            </div>
          </div>
        </div>

        {/* Camera & GPS Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mr-3">
              <Camera className="w-5 h-5 text-purple-600" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide text-gray-600 font-semibold">Camera & Location</h3>
              <p className="text-xs text-gray-500">Field capture settings</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Camera Quality</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => {
                      setCameraQuality(quality);
                      setHasChanges(true);
                    }}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium text-sm capitalize ${
                      cameraQuality === quality
                        ? 'bg-purple-600 border-purple-600 text-white scale-105 shadow-lg'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {quality}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Higher quality = larger file size</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium text-gray-900">Live Location Tracking</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">Allow Mission Control to see your live location for route optimization</p>
              </div>
              <Toggle enabled={gpsTrackingConsent} onToggle={() => { setGpsTrackingConsent(!gpsTrackingConsent); setHasChanges(true); }} />
            </div>
          </div>
        </div>

        {/* Language & Region Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mr-3">
              <Globe className="w-5 h-5 text-green-600" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide text-gray-600 font-semibold">Language & Region</h3>
              <p className="text-xs text-gray-500">Localization preferences</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">Language</label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setHasChanges(true);
              }}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-sm"
            >
              <option value="english">English</option>
              <option value="swahili">Kiswahili</option>
              <option value="french">Français</option>
            </select>
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center mr-3">
              <Lock className="w-5 h-5 text-yellow-600" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide text-gray-600 font-semibold">Privacy & Security</h3>
              <p className="text-xs text-gray-500">Protect your account</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors text-sm text-left flex items-center justify-between"
            >
              <span>Change Password</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => setShow2FAModal(true)}
              className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors text-sm text-left flex items-center justify-between"
            >
              <span>Two-Factor Authentication</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Feature Management - HQ/Director Only */}
        {isHQOrDirector && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-200 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-5">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
                <SettingsIcon className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-wide text-blue-800 font-semibold">Feature Management</h3>
                <p className="text-xs text-blue-700">Control app features for all users</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setShowFeatureToggle(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-sm hover:shadow-md text-sm text-left flex items-center justify-between font-semibold"
              >
                <span className="flex items-center gap-2">
                  🚐 Van Calendar Feature
                </span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>No APK update required:</strong> Enable or disable features instantly for all 662 users
              </p>
            </div>
          </div>
        )}

        {/* App Info */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-center mb-3">
            <Smartphone className="w-5 h-5 text-red-600 mr-2" strokeWidth={2} />
            <h3 className="text-sm uppercase tracking-wide text-red-800 font-semibold">App Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Version</span>
              <span className="font-semibold text-gray-900">1.0.0 (MVP)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Build</span>
              <span className="font-semibold text-gray-900">2024.12.29</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="text-green-600 font-semibold flex items-center">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                Online
              </span>
            </div>
            
            {onOpenDebugger && (
              <div className="pt-2 mt-2 border-t border-red-100">
                <button 
                  onClick={onOpenDebugger}
                  className="w-full py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-3 h-3" />
                  Debug Van Database
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <PasswordChangeModal
          userId={userId}
          userName={userName}
          onClose={() => setShowPasswordModal(false)}
        />
      )}

      {/* Two-Factor Authentication Modal */}
      {show2FAModal && (
        <TwoFactorModal
          userId={userId}
          userName={userName}
          currentStatus={twoFactorEnabled}
          onClose={() => setShow2FAModal(false)}
        />
      )}

      {/* Van Calendar Feature Toggle - HQ/Director Only */}
      {showFeatureToggle && isHQOrDirector && (
        <VanCalendarFeatureToggle
          onClose={() => setShowFeatureToggle(false)}
        />
      )}
    </div>
  );
}