import { useState, useEffect } from 'react';
import { Toast } from './toast';
import { PushNotificationBell } from './push-notification-bell';
import { Bell, BarChart3, Camera, Globe, Smartphone, Lock, Upload, User, Settings as SettingsIcon, Truck, ClipboardList } from 'lucide-react';
import { PasswordChangeModal } from './password-change-modal';
import { TwoFactorModal } from './two-factor-modal';
import VanCalendarFeatureToggle from './van-calendar-feature-toggle';
import { ProgramFormConfigPanel } from './program-form-config';
import { getSupabaseClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';
import { useTheme } from './theme-provider';
import { ThemeSelector } from './theme-selector';
import { Palette } from 'lucide-react';

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
  const [showCheckoutEnforcement, setShowCheckoutEnforcement] = useState(false);
  const [checkoutEnforcementEnabled, setCheckoutEnforcementEnabled] = useState(false);
  const [checkoutEnforcementLoading, setCheckoutEnforcementLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(userData?.profile_photo || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showFormConfig, setShowFormConfig] = useState(false);

  const { theme } = useTheme();

  const userId = user?.id || userData?.id;
  const userName = userData?.full_name || user?.full_name || 'User';
  const userRole = user?.role || userData?.role || '';
  const twoFactorEnabled = userData?.two_factor_enabled || false;
  const isHQOrDirector = ['hq_command_center', 'director'].includes(userRole);

  // Load van checkout enforcement status on mount (HQ/Director only)
  useEffect(() => {
    if (isHQOrDirector) {
      loadCheckoutEnforcementStatus();
    }
  }, [isHQOrDirector]);

  const loadCheckoutEnforcementStatus = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/van-checkout-enforcement/status`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      const result = await response.json();
      if (result.success) {
        setCheckoutEnforcementEnabled(result.enabled);
      }
    } catch (err) {
      console.error('[Settings] Error loading checkout enforcement status:', err);
    }
  };

  const toggleCheckoutEnforcement = async (enable: boolean) => {
    try {
      setCheckoutEnforcementLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-28f2f653/van-checkout-enforcement/toggle`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
            'X-User-Id': userId || '',
          },
          body: JSON.stringify({ enabled: enable }),
        }
      );
      const result = await response.json();
      if (result.success) {
        setCheckoutEnforcementEnabled(enable);
        setToastMessage(`Van checkout enforcement ${enable ? 'ENABLED' : 'DISABLED'}`);
        setShowToast(true);
      } else {
        setToastMessage(`Error: ${result.error}`);
        setShowToast(true);
      }
    } catch (err: any) {
      console.error('[Settings] Error toggling checkout enforcement:', err);
      setToastMessage(`Error: ${err.message}`);
      setShowToast(true);
    } finally {
      setCheckoutEnforcementLoading(false);
    }
  };

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
    <div className="flex-1 flex flex-col overflow-hidden transition-colors duration-300" style={{ backgroundColor: theme.colors.bgPage }}>
      {/* Header - with gradient per board feedback */}
      <div className="px-6 py-4 transition-colors duration-300" style={{ backgroundColor: theme.colors.bgCard, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={onBack} 
              className="mr-3 hover:scale-110 active:scale-95 transition-transform"
            >
              <svg className="w-6 h-6" style={{ color: theme.colors.textSecondary }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-2xl" style={{ color: theme.colors.textPrimary }}>Settings</h2>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Customize your Airtel Champions experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Content - with proper spacing per Dieter Rams */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Profile Photo Section */}
        <div className="rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ background: `linear-gradient(135deg, ${theme.colors.primaryLight}, ${theme.colors.bgCard})`, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ background: `linear-gradient(135deg, ${theme.colors.primaryGradientFrom}, ${theme.colors.primaryGradientTo})` }}>
              <User className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide font-semibold" style={{ color: theme.colors.textPrimary }}>Profile Photo</h3>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>Update your profile picture</p>
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
                  <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.primaryGradientFrom}, ${theme.colors.primaryGradientTo})` }}>
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
                <div className={`px-6 py-3 text-white rounded-xl transition-all font-medium text-sm flex items-center justify-center gap-2 ${
                  uploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'
                }`} style={{ background: `linear-gradient(135deg, ${theme.colors.primaryGradientFrom}, ${theme.colors.primaryGradientTo})` }}>
                  <Upload className="w-4 h-4" />
                  {uploadingPhoto ? 'Uploading...' : 'Upload New Photo'}
                </div>
              </label>
              <p className="text-xs mt-2" style={{ color: theme.colors.textMuted }}>
                Max 5MB • JPG, PNG, or GIF • Optimized for 2G/3G
              </p>
            </div>
          </div>
        </div>
        
        {/* Notifications Section */}
        <div className="rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primaryLight }}>
              <Bell className="w-5 h-5" style={{ color: theme.colors.primary }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide font-semibold" style={{ color: theme.colors.textSecondary }}>Notifications</h3>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>Stay updated on missions and rewards</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>Push Notifications</p>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: theme.colors.textMuted }}>Get alerts for approvals, rank changes, challenges & announcements</p>
              </div>
              {/* Real Web Push toggle — connects to browser PushManager */}
              <PushNotificationBell userId={user?.id || userData?.id} showLabel />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>Email Notifications</p>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: theme.colors.textMuted }}>Weekly summary and important updates</p>
              </div>
              <Toggle enabled={emailNotif} onToggle={() => handleToggle(setEmailNotif, emailNotif)} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>SMS Notifications</p>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: theme.colors.textMuted }}>Critical announcements via SMS</p>
              </div>
              <Toggle enabled={smsNotif} onToggle={() => handleToggle(setSmsNotif, smsNotif)} />
            </div>
          </div>
        </div>

        {/* Camera & GPS Section */}
        <div className="rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primaryLight }}>
              <Camera className="w-5 h-5" style={{ color: theme.colors.primary }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide font-semibold" style={{ color: theme.colors.textSecondary }}>Camera & Location</h3>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>Field capture settings</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.textPrimary }}>Camera Quality</label>
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
                        ? 'text-white scale-105 shadow-lg'
                        : ''
                    }`}
                    style={
                      cameraQuality === quality
                        ? { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, color: theme.colors.textOnPrimary }
                        : { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border, color: theme.colors.textSecondary }
                    }
                  >
                    {quality}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: theme.colors.textMuted }}>Higher quality = larger file size</p>
            </div>

            <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${theme.colors.borderLight}` }}>
              <div className="flex-1 mr-4">
                <p className="text-sm font-medium" style={{ color: theme.colors.textPrimary }}>Live Location Tracking</p>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: theme.colors.textMuted }}>Allow Mission Control to see your live location for route optimization</p>
              </div>
              <Toggle enabled={gpsTrackingConsent} onToggle={() => { setGpsTrackingConsent(!gpsTrackingConsent); setHasChanges(true); }} />
            </div>
          </div>
        </div>

        {/* Language & Region Section */}
        <div className="rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primaryLight }}>
              <Globe className="w-5 h-5" style={{ color: theme.colors.primary }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide font-semibold" style={{ color: theme.colors.textSecondary }}>Language & Region</h3>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>Localization preferences</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.textPrimary }}>Language</label>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setHasChanges(true);
              }}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 text-sm"
              style={{
                backgroundColor: theme.colors.bgInput,
                border: `2px solid ${theme.colors.border}`,
                color: theme.colors.textPrimary,
                '--tw-ring-color': theme.colors.primary,
              } as React.CSSProperties}
            >
              <option value="english">English</option>
              <option value="swahili">Kiswahili</option>
              <option value="french">Français</option>
            </select>
          </div>
        </div>

        {/* Theme Selector Section — Available to all roles */}
        <div className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-all" style={{ background: `linear-gradient(135deg, ${theme.colors.primaryLight}, ${theme.colors.bgCard})`, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ background: `linear-gradient(135deg, ${theme.colors.primaryGradientFrom}, ${theme.colors.primaryGradientTo})` }}>
              <Palette className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide font-semibold" style={{ color: theme.colors.textPrimary }}>App Theme</h3>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>Choose your visual experience</p>
            </div>
          </div>

          <button
            onClick={() => setShowThemeSelector(true)}
            className="w-full py-3.5 px-4 rounded-2xl transition-all text-sm text-left flex items-center justify-between font-semibold active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primaryGradientFrom}, ${theme.colors.primaryGradientTo})`,
              color: theme.colors.textOnPrimary,
              boxShadow: `0 4px 14px ${theme.colors.primary}30`,
            }}
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{theme.icon}</span>
              <span>{theme.name} Theme</span>
            </span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <p className="text-[11px] mt-3 text-center italic" style={{ color: theme.colors.textMuted }}>
            "Simplicity is the ultimate sophistication." — Leonardo da Vinci
          </p>
        </div>

        {/* Privacy & Security Section */}
        <div className="rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primaryLight }}>
              <Lock className="w-5 h-5" style={{ color: theme.colors.primary }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm uppercase tracking-wide font-semibold" style={{ color: theme.colors.textSecondary }}>Privacy & Security</h3>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>Protect your account</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-3 px-4 rounded-xl transition-colors text-sm text-left flex items-center justify-between"
              style={{ backgroundColor: theme.colors.bgSubtle, color: theme.colors.textPrimary }}
            >
              <span>Change Password</span>
              <svg className="w-5 h-5" style={{ color: theme.colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => setShow2FAModal(true)}
              className="w-full py-3 px-4 rounded-xl transition-colors text-sm text-left flex items-center justify-between"
              style={{ backgroundColor: theme.colors.bgSubtle, color: theme.colors.textPrimary }}
            >
              <span>Two-Factor Authentication</span>
              <svg className="w-5 h-5" style={{ color: theme.colors.textMuted }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <button
                onClick={() => setShowFormConfig(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all shadow-sm hover:shadow-md text-sm text-left flex items-center justify-between font-semibold"
              >
                <span className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Program Form Configuration
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

        {/* Checkout Enforcement - HQ/Director Only */}
        {isHQOrDirector && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 shadow-sm border border-red-200 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-5">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center mr-3">
                <Truck className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-sm uppercase tracking-wide text-red-800 font-semibold">Checkout Enforcement</h3>
                <p className="text-xs text-red-700">Control van checkout behavior</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => setShowCheckoutEnforcement(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all shadow-sm hover:shadow-md text-sm text-left flex items-center justify-between font-semibold"
              >
                <span className="flex items-center gap-2">
                  🚚 Van Checkout Enforcement
                </span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-xs text-red-800">
                💡 <strong>No APK update required:</strong> Enable or disable checkout enforcement instantly for all 662 users
              </p>
            </div>
          </div>
        )}

        {/* App Info */}
        <div className="rounded-xl p-6 shadow-sm" style={{ background: `linear-gradient(135deg, ${theme.colors.primaryLight}, ${theme.colors.bgCard})`, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center mb-3">
            <Smartphone className="w-5 h-5 mr-2" style={{ color: theme.colors.primary }} strokeWidth={2} />
            <h3 className="text-sm uppercase tracking-wide font-semibold" style={{ color: theme.colors.textSecondary }}>App Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span style={{ color: theme.colors.textMuted }}>Version</span>
              <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>4.0.0</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: theme.colors.textMuted }}>Build</span>
              <span className="font-semibold" style={{ color: theme.colors.textPrimary }}>2026-03-09-003</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: theme.colors.textMuted }}>Status</span>
              <span className="font-semibold flex items-center" style={{ color: theme.colors.success }}>
                <div className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: theme.colors.success }}></div>
                Online
              </span>
            </div>
            
            {onOpenDebugger && (
              <div className="pt-2 mt-2" style={{ borderTop: `1px solid ${theme.colors.borderLight}` }}>
                <button 
                  onClick={onOpenDebugger}
                  className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
                  style={{ backgroundColor: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, color: theme.colors.primary }}
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

      {/* Theme Selector Modal */}
      {showThemeSelector && (
        <ThemeSelector onClose={() => setShowThemeSelector(false)} />
      )}

      {/* Program Form Configuration - HQ/Director Only */}
      {showFormConfig && isHQOrDirector && (
        <ProgramFormConfigPanel onClose={() => setShowFormConfig(false)} />
      )}

      {/* Van Checkout Enforcement Toggle - HQ/Director Only */}
      {showCheckoutEnforcement && isHQOrDirector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">🚚 Van Checkout Enforcement</h2>
                <p className="text-sm text-red-100">Require van checkout before next check-in</p>
              </div>
              <button
                onClick={() => setShowCheckoutEnforcement(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Current Status */}
              <div className="mb-6">
                <div className={`p-4 rounded-xl border-2 ${
                  checkoutEnforcementEnabled 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-red-50 border-red-500'
                }`}>
                  <div className="flex items-center gap-3">
                    <Truck className={`w-8 h-8 ${checkoutEnforcementEnabled ? 'text-green-600' : 'text-red-600'}`} />
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg ${
                        checkoutEnforcementEnabled ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {checkoutEnforcementEnabled ? 'Enforcement is ENABLED' : 'Enforcement is DISABLED'}
                      </h3>
                      <p className={`text-sm ${
                        checkoutEnforcementEnabled ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {checkoutEnforcementEnabled 
                          ? 'Vans must be checked out before they can be checked in again'
                          : 'Vans can be checked in without prior checkout'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
                <div className="flex gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <h4 className="font-bold text-orange-900 mb-1">How it works</h4>
                    <p className="text-sm text-orange-700">
                      When enabled, if a van was checked in but not checked out, attempting to check it in again will show: 
                      <span className="font-semibold italic"> "Kindly check out previous trip before you can check in again"</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => toggleCheckoutEnforcement(true)}
                  disabled={checkoutEnforcementLoading || checkoutEnforcementEnabled}
                  className={`py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    checkoutEnforcementEnabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  ENABLE
                </button>

                <button
                  onClick={() => toggleCheckoutEnforcement(false)}
                  disabled={checkoutEnforcementLoading || !checkoutEnforcementEnabled}
                  className={`py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    !checkoutEnforcementEnabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  DISABLE
                </button>
              </div>

              {/* Loading Overlay */}
              {checkoutEnforcementLoading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                    <p className="text-gray-600 font-semibold">Processing...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 rounded-b-2xl border-t-2 border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                This applies to all programs with "Check In" in the title
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}