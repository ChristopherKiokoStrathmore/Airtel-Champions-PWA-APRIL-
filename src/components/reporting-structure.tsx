import { useState, useEffect } from 'react';

interface ReportingStructureProps {
  userData: any;
  userName: string;
  userInitial: string;
  rank: number | string;
  points: number;
  role: 'se' | 'zsm' | 'zbm';
  teamMembers?: any[];
  zsms?: any[];
}

export function ReportingStructure({ 
  userData, 
  userName, 
  userInitial, 
  rank, 
  points, 
  role,
  teamMembers = [],
  zsms = []
}: ReportingStructureProps) {
  const [hasViewed, setHasViewed] = useState(false);

  useEffect(() => {
    // Check if user has viewed reporting structure before
    const viewed = localStorage.getItem(`reporting_structure_viewed_${userData?.id}`);
    if (!viewed) {
      setHasViewed(false);
      // Mark as viewed after 2 seconds
      setTimeout(() => {
        localStorage.setItem(`reporting_structure_viewed_${userData?.id}`, 'true');
        setHasViewed(true);
      }, 2000);
    } else {
      setHasViewed(true);
    }

    // Track analytics
    const viewTime = new Date().toISOString();
    console.log(`[Analytics] Reporting Structure Viewed: ${userData?.full_name} at ${viewTime}`);
  }, [userData?.id, userData?.full_name]);

  const handleContactManager = () => {
    const phone = userData?.zsm_phone || '';
    const managerName = userData?.zsm || 'your manager';
    
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const message = `Hi ${encodeURIComponent(managerName)}, I need assistance.`;
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
      
      // Track contact attempt
      console.log(`[Analytics] Manager Contact: ${userData?.full_name} contacted ${managerName}`);
    } else {
      alert(`📞 Contact ${managerName} for assistance\n\n(WhatsApp integration requires phone number in database)`);
    }
  };

  const handleContactZBM = () => {
    const managerName = userData?.zbm || 'your ZBM';
    alert(`📞 Contact ${managerName} for escalation\n\n(WhatsApp integration coming soon)`);
  };

  if (role === 'se') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm overflow-hidden relative">
        {/* First-time confetti effect */}
        {!hasViewed && (
          <>
            <div className="absolute top-0 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-confetti-1"></div>
            <div className="absolute top-0 right-1/4 w-3 h-3 bg-blue-500 rounded-full animate-confetti-2"></div>
            <div className="absolute top-0 left-1/2 w-3 h-3 bg-purple-500 rounded-full animate-confetti-3"></div>
          </>
        )}

        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">🏢 Reporting Structure</h4>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">662 Total SEs</span>
        </div>
        <p className="text-xs text-gray-600 mb-4">You're part of a team changing Kenya's connectivity 🇰🇪</p>
        
        <div className="space-y-4">
          {/* Current User - SE with pulse animation */}
          <div className="flex items-center gap-3 bg-red-50 border-2 border-red-300 rounded-xl p-3 relative animate-pulse-slow">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-sm shadow-md">
              {userInitial}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-red-600">Sales Executive (You)</p>
              <p className="text-xs text-gray-500 mt-1">Rank #{rank} • {points} points</p>
            </div>
            <div className="absolute -right-1 -top-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs animate-bounce">
              ✓
            </div>
          </div>

          {/* Animated Arrow up with glow */}
          <div className="flex justify-center">
            <svg className="w-6 h-6 text-blue-400 animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>

          {/* ZSM - Manager with contact button */}
          <button
            onClick={handleContactManager}
            className="w-full flex items-center gap-3 hover:bg-blue-50 rounded-xl p-3 transition-all group border border-transparent hover:border-blue-200"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm shadow-md group-hover:scale-110 transition-transform">
              {userData?.zsm?.substring(0, 1) || 'Z'}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">{userData?.zsm || 'Zonal Sales Manager'}</p>
              <p className="text-xs text-gray-500">Your manager • Tap to WhatsApp 💬</p>
            </div>
            <svg className="w-5 h-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>

          {/* Arrow up */}
          <div className="flex justify-center" style={{ animationDelay: '0.2s' }}>
            <svg className="w-6 h-6 text-purple-400 animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>

          {/* ZBM */}
          <button
            onClick={handleContactZBM}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm shadow-md group-hover:scale-105 transition-transform">
              {userData?.zbm?.substring(0, 1) || 'ZB'}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">{userData?.zbm || 'Zonal Business Manager'}</p>
              <p className="text-xs text-gray-500">Zone leadership • Tap for escalation</p>
            </div>
          </button>

          {/* Arrow up */}
          <div className="flex justify-center" style={{ animationDelay: '0.4s' }}>
            <svg className="w-6 h-6 text-red-400 animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>

          {/* Director */}
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm shadow-md">
              D
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Director</p>
              <p className="text-xs text-gray-500">Executive leadership</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ZSM View
  if (role === 'zsm') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h4 className="font-semibold mb-4">🏢 Reporting Structure</h4>
        <div className="space-y-4">
          {/* Current User - ZSM */}
          <div className="flex items-center gap-3 bg-blue-50 border-2 border-blue-300 rounded-xl p-3 relative animate-pulse-slow">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm shadow-md">
              {userInitial}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-blue-600">Zonal Sales Manager (You)</p>
              <p className="text-xs text-gray-500 mt-1">Managing {teamMembers.length} SEs</p>
            </div>
          </div>

          {/* Arrow up */}
          <div className="flex justify-center">
            <svg className="w-6 h-6 text-purple-400 animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>

          {/* ZBM - Manager with contact button */}
          <button
            onClick={() => {
              const managerName = userData?.zbm || 'your ZBM';
              alert(`📞 Contact ${managerName}\n\n(WhatsApp integration coming soon)`);
            }}
            className="w-full flex items-center gap-3 hover:bg-purple-50 rounded-xl p-3 transition-all group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm shadow-md group-hover:scale-110 transition-transform">
              {userData?.zbm?.substring(0, 1) || 'Z'}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">{userData?.zbm || 'Zonal Business Manager'}</p>
              <p className="text-xs text-gray-500">Your manager • Tap to contact</p>
            </div>
          </button>

          {/* Arrow up */}
          <div className="flex justify-center">
            <svg className="w-6 h-6 text-red-400 animate-float" style={{ animationDelay: '0.2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>

          {/* Director */}
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm shadow-md">
              D
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Director</p>
              <p className="text-xs text-gray-500">Executive leadership</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Managing Section */}
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-gray-600 mb-2">👥 You manage:</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm shadow-md">
                {teamMembers.length}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{teamMembers.length} Sales Executives</p>
                <p className="text-xs text-gray-500">Direct reports • View in Team tab</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ZBM View
  if (role === 'zbm') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold">🏢 Reporting Structure</h4>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{zsms.length} ZSMs</span>
        </div>
        <p className="text-xs text-gray-600 mb-4">Leading regional sales operations</p>
        
        <div className="space-y-4">
          {/* Current User */}
          <div className="flex items-center gap-3 bg-purple-50 border-2 border-purple-300 rounded-xl p-3 relative animate-pulse-slow">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm shadow-md">
              {userInitial}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{userName}</p>
              <p className="text-xs text-purple-600">Zonal Business Manager (You)</p>
            </div>
          </div>

          {/* Arrow up */}
          <div className="flex justify-center">
            <svg className="w-6 h-6 text-red-400 animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>

          {/* Reporting Line */}
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm shadow-md">
              D
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Director</p>
              <p className="text-xs text-gray-500">Your manager</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2"></div>

          {/* Managing Section */}
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xs text-gray-600 mb-3">👥 You manage:</p>
            
            {/* ZSMs */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm shadow-md">
                {zsms.length}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{zsms.length} Zonal Sales Managers</p>
                <p className="text-xs text-gray-500">Direct reports • View in Team tab</p>
              </div>
            </div>

            {/* Arrow down to show hierarchy */}
            <div className="flex justify-center my-2">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* Sales Executives */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-sm shadow-md">
                SE
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Sales Executives</p>
                <p className="text-xs text-gray-500">Front-line team (indirect)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
