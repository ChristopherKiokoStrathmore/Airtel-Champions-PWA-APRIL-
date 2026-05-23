import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';

interface ReportingStructureProps {
  userData: any;
  userName: string;
  userInitial: string;
  rank: number | string;
  points: number;
  role: 'se' | 'zsm' | 'zbm' | 'director';
  teamMembers?: any[];
  zsms?: any[];
  onStatusChange?: (status: string) => void;
}

export function ReportingStructure({ 
  userData, 
  userName, 
  userInitial, 
  rank, 
  points, 
  role,
  teamMembers = [],
  zsms = [],
  onStatusChange
}: ReportingStructureProps) {
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    // Check leave status from localStorage
    const leaveStatus = localStorage.getItem(`leave_status_${userData?.id}`);
    setIsOnLeave(leaveStatus === 'true');
  }, [userData?.id]);

  const handleLeaveToggle = () => {
    setShowLeaveModal(true);
  };

  const confirmLeaveStatus = (status: boolean) => {
    setIsOnLeave(status);
    localStorage.setItem(`leave_status_${userData?.id}`, status.toString());
    setShowLeaveModal(false);
    if (onStatusChange) {
      onStatusChange(status ? 'on_leave' : 'active');
    }
    console.log(`[Analytics] Status Change: ${userName} - ${status ? 'On Leave' : 'Active'}`);
  };

  const handleContactManager = (managerName: string, phone?: string) => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      // Use tel: for regular phone call instead of WhatsApp
      window.location.href = `tel:${cleanPhone}`;
      console.log(`[Analytics] Manager Contact: ${userName} called ${managerName}`);
    } else {
      alert(`📞 Contact ${managerName}\n\n(Phone number not available)`);
    }
  };

  // Calculate total SEs under ZBM
  const totalSEs = teamMembers.length > 0 ? teamMembers.length : 
                   (zsms.length > 0 ? zsms.reduce((acc: number, zsm: any) => acc + (zsm.team_count || 0), 0) : 0);

  if (role === 'se') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">🏢 Reporting Structure</h4>
          <button
            onClick={handleLeaveToggle}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              isOnLeave 
                ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            {isOnLeave ? '🏖️ On Leave' : '✅ Active'}
          </button>
        </div>

        <div className="space-y-3">
          {/* Director - Top */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white shadow-md">
                D
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Director</p>
                <p className="text-xs text-gray-600">Sales & Distribution</p>
              </div>
            </div>
          </div>

          {/* Connector Line with Arrow */}
          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-gray-300 relative">
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* ZBM */}
          <button
            onClick={() => handleContactManager(userData?.zbm || 'ZBM')}
            className="w-full bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
                {userData?.zbm?.substring(0, 2).toUpperCase() || 'ZB'}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-800">{userData?.zbm || 'Zonal Business Manager'}</p>
                <p className="text-xs text-gray-600">Zonal Business Manager</p>
              </div>
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
          </button>

          {/* Connector Line with Arrow */}
          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-gray-300 relative">
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* ZSM - Your Manager */}
          <button
            onClick={() => handleContactManager(userData?.zsm || 'ZSM', userData?.zsm_phone)}
            className="w-full bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
                {userData?.zsm?.substring(0, 2).toUpperCase() || 'ZM'}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-800">{userData?.zsm || 'Zonal Sales Manager'}</p>
                <p className="text-xs text-gray-600">Zonal Sales Manager • Your Manager</p>
              </div>
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
          </button>

          {/* Connector Line with Arrow */}
          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-gray-300 relative">
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* You - SE */}
          <div className={`bg-gradient-to-br from-green-50 to-green-100 border-2 rounded-xl p-4 ${
            isOnLeave ? 'border-orange-300' : 'border-green-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md relative ${
                isOnLeave 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
                  : 'bg-gradient-to-br from-green-500 to-green-600'
              }`}>
                {userInitial}
                {isOnLeave && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs">
                    🏖️
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-600">
                  Sales Executive • You {isOnLeave && '(On Leave)'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Rank #{rank} • {points} points</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Status Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLeaveModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Update Status</h3>
              <p className="text-sm text-gray-600 mb-6">Set your availability status for your manager and team.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => confirmLeaveStatus(false)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    !isOnLeave 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                      ✅
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">Active</p>
                      <p className="text-xs text-gray-600">Available for work</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => confirmLeaveStatus(true)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    isOnLeave 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                      🏖️
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">On Leave</p>
                      <p className="text-xs text-gray-600">Temporarily unavailable</p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowLeaveModal(false)}
                className="w-full mt-4 py-3 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ZSM View
  if (role === 'zsm') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">🏢 Reporting Structure</h4>
          <button
            onClick={handleLeaveToggle}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              isOnLeave 
                ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            {isOnLeave ? '🏖️ On Leave' : '✅ Active'}
          </button>
        </div>

        <div className="space-y-3">
          {/* Director - Top */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white shadow-md">
                D
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Director</p>
                <p className="text-xs text-gray-600">Sales & Distribution</p>
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-gray-300 relative">
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* ZBM */}
          <button
            onClick={() => handleContactManager(userData?.zbm || 'ZBM')}
            className="w-full bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
                {userData?.zbm?.substring(0, 2).toUpperCase() || 'ZB'}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-800">{userData?.zbm || 'Zonal Business Manager'}</p>
                <p className="text-xs text-gray-600">Zonal Business Manager • Your Manager</p>
              </div>
            </div>
          </button>

          {/* Connector */}
          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-gray-300 relative">
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* You - ZSM */}
          <div className={`bg-gradient-to-br from-blue-50 to-blue-100 border-2 rounded-xl p-4 ${
            isOnLeave ? 'border-orange-300' : 'border-blue-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md relative ${
                isOnLeave 
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                {userInitial}
                {isOnLeave && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs">
                    🏖️
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-600">
                  Zonal Sales Manager • You {isOnLeave && '(On Leave)'}
                </p>
              </div>
            </div>
          </div>

          {/* Team Management */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-3">👥 You Manage:</p>
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white shadow-md text-sm font-semibold">
                  {teamMembers.length}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Sales Executives</p>
                  <p className="text-xs text-gray-600">{teamMembers.length} direct reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Modal (same as SE) */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLeaveModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Update Status</h3>
              <p className="text-sm text-gray-600 mb-6">Set your availability status for your manager and team.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => confirmLeaveStatus(false)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    !isOnLeave ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">✅</div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">Active</p>
                      <p className="text-xs text-gray-600">Available for work</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => confirmLeaveStatus(true)}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    isOnLeave ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">🏖️</div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">On Leave</p>
                      <p className="text-xs text-gray-600">Temporarily unavailable</p>
                    </div>
                  </div>
                </button>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="w-full mt-4 py-3 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ZBM View
  if (role === 'zbm') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">🏢 Reporting Structure</h4>
          <button
            onClick={handleLeaveToggle}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              isOnLeave ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            {isOnLeave ? '🏖️ On Leave' : '✅ Active'}
          </button>
        </div>

        <div className="space-y-3">
          {/* Director */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white shadow-md">
                D
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">Director</p>
                <p className="text-xs text-gray-600">Sales & Distribution • Your Manager</p>
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="flex justify-center">
            <div className="w-0.5 h-6 bg-gray-300 relative">
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* You - ZBM */}
          <div className={`bg-gradient-to-br from-purple-50 to-purple-100 border-2 rounded-xl p-4 ${
            isOnLeave ? 'border-orange-300' : 'border-purple-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md relative ${
                isOnLeave ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'
              }`}>
                {userInitial}
                {isOnLeave && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs">🏖️</div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-600">Zonal Business Manager • You {isOnLeave && '(On Leave)'}</p>
              </div>
            </div>
          </div>

          {/* Team Management */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-3">👥 You Manage:</p>
            
            {/* ZSMs */}
            <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-md text-sm font-semibold">
                  {zsms.length}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Zonal Sales Managers</p>
                  <p className="text-xs text-gray-600">{zsms.length} direct reports</p>
                </div>
              </div>
            </div>

            {/* Connector */}
            <div className="flex justify-center my-2">
              <div className="w-0.5 h-4 bg-gray-300"></div>
            </div>

            {/* SEs */}
            <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white shadow-md text-sm font-semibold">
                  {totalSEs || 'SE'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Sales Executives</p>
                  <p className="text-xs text-gray-600">{totalSEs > 0 ? `${totalSEs} total SEs` : 'Indirect reports'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLeaveModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Update Status</h3>
              <p className="text-sm text-gray-600 mb-6">Set your availability status for your manager and team.</p>
              <div className="space-y-3">
                <button onClick={() => confirmLeaveStatus(false)} className={`w-full p-4 rounded-xl border-2 transition-all ${!isOnLeave ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">✅</div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">Active</p>
                      <p className="text-xs text-gray-600">Available for work</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => confirmLeaveStatus(true)} className={`w-full p-4 rounded-xl border-2 transition-all ${isOnLeave ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">🏖️</div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">On Leave</p>
                      <p className="text-xs text-gray-600">Temporarily unavailable</p>
                    </div>
                  </div>
                </button>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="w-full mt-4 py-3 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Director View
  if (role === 'director') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">🏢 Reporting Structure</h4>
          <button
            onClick={handleLeaveToggle}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              isOnLeave ? 'bg-orange-100 text-orange-700 border border-orange-300' : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            {isOnLeave ? '🏖️ On Leave' : '✅ Active'}
          </button>
        </div>

        <div className="space-y-3">
          {/* Director - Single Card (Merged Director + User) */}
          <div className={`bg-gradient-to-br from-red-50 to-red-100 border-2 rounded-xl p-4 ${
            isOnLeave ? 'border-orange-300' : 'border-red-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md relative ${
                isOnLeave ? 'bg-gradient-to-br from-orange-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-red-600'
              }`}>
                {userInitial}
                {isOnLeave && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-xs">🏖️</div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-600">Director • Sales & Distribution {isOnLeave && '(On Leave)'}</p>
              </div>
            </div>
          </div>

          {/* Team Management - What Director Manages */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-3">👥 You Manage:</p>
            
            {/* Hierarchy: Director → ZBM → ZSM → SE */}
            <div className="space-y-2">
              {/* ZBMs */}
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md text-xs font-semibold">
                    ZB
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Zonal Business Managers (ZBM)</p>
                    <p className="text-xs text-gray-600">12 ZBMs across all zones</p>
                  </div>
                </div>
              </div>

              {/* Connector */}
              <div className="flex justify-center">
                <div className="w-0.5 h-4 bg-gray-300"></div>
              </div>

              {/* ZSMs */}
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-md text-xs font-semibold">
                    ZM
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Zonal Sales Managers (ZSM)</p>
                    <p className="text-xs text-gray-600">Managed by ZBMs</p>
                  </div>
                </div>
              </div>

              {/* Connector */}
              <div className="flex justify-center">
                <div className="w-0.5 h-4 bg-gray-300"></div>
              </div>

              {/* SEs */}
              <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white shadow-md text-sm font-semibold">
                    {totalSEs || 'SE'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Sales Executives</p>
                    <p className="text-xs text-gray-600">{totalSEs > 0 ? `${totalSEs} total SEs` : 'Indirect reports'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Modal */}
        {showLeaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLeaveModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Update Status</h3>
              <p className="text-sm text-gray-600 mb-6">Set your availability status for your manager and team.</p>
              <div className="space-y-3">
                <button onClick={() => confirmLeaveStatus(false)} className={`w-full p-4 rounded-xl border-2 transition-all ${!isOnLeave ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">✅</div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">Active</p>
                      <p className="text-xs text-gray-600">Available for work</p>
                    </div>
                  </div>
                </button>
                <button onClick={() => confirmLeaveStatus(true)} className={`w-full p-4 rounded-xl border-2 transition-all ${isOnLeave ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">🏖️</div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">On Leave</p>
                      <p className="text-xs text-gray-600">Temporarily unavailable</p>
                    </div>
                  </div>
                </button>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="w-full mt-4 py-3 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}