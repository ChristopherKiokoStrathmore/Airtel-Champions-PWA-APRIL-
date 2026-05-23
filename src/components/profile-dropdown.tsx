import React from 'react';

interface ProfileDropdownProps {
  userName: string;
  userInitial: string;
  userZone: string;
  userData: any;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  onClose: () => void;
}

export function ProfileDropdown({
  userName,
  userInitial,
  userZone,
  userData,
  onProfileClick,
  onSettingsClick,
  onLogout,
  onClose
}: ProfileDropdownProps) {
  return (
    <>
      {/* Backdrop to close menu */}
      <div 
        className="fixed inset-0 z-10" 
        onClick={onClose}
      ></div>
      
      {/* Dropdown - Steve Jobs Style! */}
      <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 overflow-hidden animate-dropdown-slide-in">
        {/* User Info Card - Beautiful Header */}
        <div className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-800"></div>
          
          {/* Animated Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-2xl animate-float-delayed"></div>
          </div>
          
          {/* Content */}
          <div className="relative px-6 py-5">
            {/* Avatar & Name */}
            <div className="flex items-center mb-4 animate-fade-in-up">
              <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-2xl mr-4 shadow-lg border-2 border-white border-opacity-30 animate-scale-in">
                {userInitial}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-lg mb-1 tracking-tight">{userName}</p>
                <div className="flex items-center text-red-100 text-xs">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {userZone}
                </div>
              </div>
            </div>
            
            {/* Reporting Line - Clean Design (Hide for Director) */}
            {userData?.role !== 'director' && (
              <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl px-4 py-3 space-y-2 animate-fade-in-up animation-delay-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-800 flex items-center font-semibold">
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    ZSM
                  </span>
                  <span className="font-bold text-gray-900">{userData?.zsm || 'Not Assigned'}</span>
                </div>
                <div className="h-px bg-gray-300"></div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-800 flex items-center font-semibold">
                    <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    ZBM
                  </span>
                  <span className="font-bold text-gray-900">{userData?.zbm || 'Not Assigned'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items - Elegant List */}
        <div className="py-2">
          <button
            onClick={onProfileClick}
            className="w-full px-6 py-3.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-all flex items-center group"
          >
            <div className="w-10 h-10 bg-gray-100 group-hover:bg-red-100 rounded-xl flex items-center justify-center mr-3 transition-colors">
              <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors text-base">My Profile</p>
              <p className="text-xs text-gray-600 mt-0.5 font-medium">View and edit your info</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={onSettingsClick}
            className="w-full px-6 py-3.5 text-left hover:bg-gray-50 active:bg-gray-100 transition-all flex items-center group"
          >
            <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mr-3 transition-colors">
              <svg className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-base">Settings</p>
              <p className="text-xs text-gray-600 mt-0.5 font-medium">App preferences</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Divider */}
          <div className="my-2 mx-6 h-px bg-gray-200"></div>

          <button
            onClick={onLogout}
            className="w-full px-6 py-3.5 text-left hover:bg-red-50 active:bg-red-100 transition-all flex items-center group"
          >
            <div className="w-10 h-10 bg-red-50 group-hover:bg-red-100 rounded-xl flex items-center justify-center mr-3 transition-colors">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-600 text-base">Sign Out</p>
              <p className="text-xs text-red-500 mt-0.5 font-medium">Log out of TAI</p>
            </div>
            <svg className="w-5 h-5 text-red-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}