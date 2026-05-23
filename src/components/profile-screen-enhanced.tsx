import { useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { ReportingStructure } from './reporting-structure-new';
import { DirectorReportingStructure } from './director-reporting-structure';
import { usePageTracking } from '../hooks/usePageTracking';
import { ANALYTICS_PAGES } from '../utils/analytics';

interface ProfileScreenEnhancedProps {
  user: any;
  userData: any;
  onBack: () => void;
  onLogout: () => void;
}

export function ProfileScreenEnhanced({ user, userData, onBack, onLogout }: ProfileScreenEnhancedProps) {
  // Track page view automatically
  usePageTracking(ANALYTICS_PAGES.PROFILE);
  
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(userData?.email || '');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(userData?.phone_number || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState(userData?.profile_picture || null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const userName = userData?.full_name || user?.full_name || user?.user_metadata?.full_name || 'Sales Executive';
  const userEmail = userData?.email || user?.email || 'Not provided';
  const userPhone = user?.phone_number || userData?.phone_number || userData?.phone || user?.phone || user?.user_metadata?.phone_number || 'Not provided';
  const employeeId = userData?.employee_id || user?.employee_id || 'N/A';
  const region = userData?.region || user?.region || 'N/A';
  const rank = userData?.rank || user?.rank || '--';
  const points = userData?.total_points || user?.total_points || 0;
  const userInitial = userName.substring(0, 1).toUpperCase();
  const userRole = userData?.role || user?.role || 'sales_executive';

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('❌ Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage('❌ Image must be less than 2MB');
      return;
    }

    setUploadingPicture(true);
    setMessage('');

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id || userData?.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update user record
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ profile_picture: publicUrl })
        .eq('id', user.id || userData?.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setProfilePicture(publicUrl);
      setMessage('✅ Profile picture updated!');
      setTimeout(() => setMessage(''), 3000);

      // Update localStorage to reflect the change immediately
      const storedUser = localStorage.getItem('tai_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          userData.profile_picture = publicUrl;
          localStorage.setItem('tai_user', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to update localStorage:', error);
        }
      }

      // Reload the page to update the profile icon everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      setMessage('❌ Failed to upload picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!newEmail || newEmail === userEmail) {
      setIsEditingEmail(false);
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ email: newEmail })
        .eq('id', user.id || userData?.id);

      if (error) throw error;

      setMessage('✅ Email updated successfully!');
      setIsEditingEmail(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error updating email:', error);
      setMessage('❌ Failed to update email');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPhoneChange = async () => {
    if (!newPhone || newPhone === userPhone) {
      setIsEditingPhone(false);
      return;
    }

    setIsSaving(true);
    setMessage('');

    try {
      // Determine approver based on role
      let approverRole = '';
      if (userRole === 'sales_executive') approverRole = 'zonal_sales_manager';
      else if (userRole === 'zonal_sales_manager') approverRole = 'zonal_business_manager';
      else if (userRole === 'zonal_business_manager') approverRole = 'hq_staff';

      // Create phone change request
      const { error } = await supabase
        .from('phone_change_requests')
        .insert({
          user_id: user.id || userData?.id,
          employee_id: employeeId,
          current_phone: userPhone,
          requested_phone: newPhone,
          status: 'pending',
          requested_by_role: userRole,
          approver_role: approverRole,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessage(`✅ Phone change request submitted! Pending approval from ${approverRole.replace('_', ' ').toUpperCase()}`);
      setIsEditingPhone(false);
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      console.error('Error requesting phone change:', error);
      setMessage('❌ Failed to submit request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveToggle = () => {
    setShowLeaveModal(true);
  };

  const confirmLeaveStatus = (status: boolean) => {
    setIsOnLeave(status);
    setShowLeaveModal(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl">👤 My Profile</h2>
          </div>
          <button onClick={onLogout} className="text-gray-600 hover:text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Success/Error Message */}
        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium animate-slide-up ${
            message.startsWith('✅') 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Profile Avatar & Name */}
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <div className="relative inline-block">
            {/* Avatar */}
            {profilePicture ? (
              <img 
                src={profilePicture} 
                alt={userName}
                className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg object-cover border-4 border-red-100"
              />
            ) : (
              <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-4 shadow-lg border-4 border-red-100">
                {userInitial}
              </div>
            )}
            
            {/* Upload Picture Button */}
            <label htmlFor="profile-picture-upload" className="absolute bottom-3 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
              {uploadingPicture ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </label>
            <input 
              id="profile-picture-upload" 
              type="file" 
              accept="image/*" 
              onChange={handleProfilePictureUpload}
              className="hidden"
            />
          </div>
          <h3 className="text-2xl mb-1">{userName}</h3>
          <p className="text-sm text-red-600 mt-2">
            {userRole.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </p>
          {/* Employee ID removed - no longer displayed */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Only show rank for SE, ZSM, and ZBM */}
          {['sales_executive', 'zonal_sales_manager', 'zonal_business_manager'].includes(userRole) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
              <p className="text-3xl mb-1">#{rank}</p>
              <p className="text-xs text-yellow-800">Current Rank</p>
            </div>
          )}
          <div className={`bg-green-50 border border-green-200 rounded-xl p-4 text-center ${
            !['sales_executive', 'zonal_sales_manager', 'zonal_business_manager'].includes(userRole) ? 'col-span-2' : ''
          }`}>
            <p className="text-3xl mb-1">{points}</p>
            <p className="text-xs text-green-800">Total Points</p>
          </div>
        </div>

        {/* Personal Information - Editable */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h4 className="font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h4>
          
          <div className="space-y-4">
            {/* Email - Editable (Director can edit directly, others need approval) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600">Email</p>
                {!isEditingEmail && (
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {userRole === 'director' ? 'Edit' : 'Edit'}
                  </button>
                )}
              </div>
              {isEditingEmail ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="Enter new email"
                    />
                    <button
                      onClick={handleSaveEmail}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? '...' : '✓'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingEmail(false);
                        setNewEmail(userEmail);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                  {userRole === 'director' && (
                    <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                      ✅ As Director, you can change your email directly
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg">{userEmail}</p>
              )}
            </div>

            {/* Phone Number - Request Change */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600">Phone Number</p>
                {!isEditingPhone && (
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="text-xs text-orange-600 hover:text-orange-800 flex items-center"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Request Change
                  </button>
                )}
              </div>
              {isEditingPhone ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-600"
                      placeholder="Enter new phone number"
                    />
                    <button
                      onClick={handleRequestPhoneChange}
                      disabled={isSaving}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
                    >
                      {isSaving ? '...' : '📤'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingPhone(false);
                        setNewPhone(userPhone);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                    ⚠️ Phone changes require approval from your {userRole === 'sales_executive' ? 'ZSM' : userRole === 'zonal_sales_manager' ? 'ZBM' : 'HQ team'}
                  </p>
                </div>
              ) : (
                <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg">{userPhone}</p>
              )}
            </div>

            {/* Region - Read Only */}
            <div>
              <p className="text-xs text-gray-600 mb-1">Region</p>
              <p className="text-sm bg-gray-50 px-3 py-2 rounded-lg">{region}</p>
            </div>
          </div>
        </div>

        {/* Organizational Structure */}
        {userRole === 'director' ? (
          <DirectorReportingStructure
            userName={userName}
            userInitial={userInitial}
            isOnLeave={isOnLeave}
            onLeaveToggle={handleLeaveToggle}
          />
        ) : (
          <ReportingStructure
            userData={userData}
            userName={userName}
            userInitial={userInitial}
            rank={rank}
            points={points}
            role="se"
          />
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-lg"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}