import { useState, useRef } from 'react';
import { supabase } from '../utils/supabase/client';

// ZSM, ZBM, and Zone hierarchy
const organizationHierarchy = {
  'Central Region': {
    zbm: 'Mary Wanjiku',
    zones: {
      'Nairobi West': ['James Mwangi', 'Peter Kamau', 'Grace Njeri'],
      'Nairobi East': ['John Ochieng', 'Sarah Akinyi', 'David Kipchoge'],
      'Nairobi CBD': ['Michael Omondi', 'Jane Wambui', 'Robert Karanja'],
    }
  },
  'Coast Region': {
    zbm: 'Ali Hassan',
    zones: {
      'Mombasa': ['Hassan Mohamed', 'Fatuma Ali', 'Omar Sheikh'],
      'Kilifi': ['Amina Juma', 'Said Abdalla'],
    }
  },
  'Western Region': {
    zbm: 'Paul Wafula',
    zones: {
      'Kisumu': ['Charles Otieno', 'Faith Auma', 'Daniel Ouma'],
      'Kakamega': ['Moses Waswa', 'Lucy Nekesa'],
    }
  },
  'Rift Valley Region': {
    zbm: 'Joseph Kiprono',
    zones: {
      'Nakuru': ['Simon Koech', 'Emily Chebet', 'Daniel Ruto'],
      'Eldoret': ['Evans Kiplagat', 'Mercy Chepkoech'],
    }
  }
};

interface ProfileSetupProps {
  user: any;
  onComplete: () => void;
}

export function ProfileSetupScreen({ user, onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [employeeId, setEmployeeId] = useState('');
  const [region, setRegion] = useState('');
  const [zone, setZone] = useState('');
  const [zsm, setZsm] = useState('');
  const [zbm, setZbm] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-populate ZBM when region changes
  const handleRegionChange = (selectedRegion: string) => {
    setRegion(selectedRegion);
    setZone('');
    setZsm('');
    if (selectedRegion && organizationHierarchy[selectedRegion]) {
      setZbm(organizationHierarchy[selectedRegion].zbm);
    } else {
      setZbm('');
    }
  };

  // Auto-populate ZSMs when zone changes
  const handleZoneChange = (selectedZone: string) => {
    setZone(selectedZone);
    setZsm('');
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    try {
      let profilePictureUrl = null;

      // Upload profile picture to Supabase Storage
      if (profilePictureFile) {
        const fileExt = profilePictureFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(fileName, profilePictureFile);

        if (uploadError) {
          throw new Error('Failed to upload profile picture');
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-pictures')
          .getPublicUrl(fileName);

        profilePictureUrl = publicUrl;
      }

      // Insert user data into users table
      const { data, error: insertError } = await supabase
        .from('app_users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          employee_id: employeeId,
          phone_number: user.user_metadata.phone,
          region: region,
          zone: zone,
          zsm: zsm,
          zbm: zbm,
          profile_picture: profilePictureUrl,
          role: 'field_agent',
          rank: 999, // Default rank
          total_points: 0,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      // Profile setup complete — no Supabase Auth needed (direct DB mode)
      console.log('[ProfileSetup] Profile setup complete for user');

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile setup');
    } finally {
      setIsLoading(false);
    }
  };

  const availableZones = region && organizationHierarchy[region] 
    ? Object.keys(organizationHierarchy[region].zones) 
    : [];

  const availableZSMs = region && zone && organizationHierarchy[region]?.zones[zone]
    ? organizationHierarchy[region].zones[zone]
    : [];

  if (step === 1) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-6">
          <h2 className="text-2xl mb-2">Welcome to TAI! 🦅</h2>
          <p className="text-sm opacity-90">Let's set up your profile</p>
          <div className="mt-4 flex items-center">
            <div className="flex-1 bg-white h-2 rounded-full overflow-hidden">
              <div className="bg-yellow-400 h-full w-1/3"></div>
            </div>
            <span className="ml-3 text-sm">Step 1 of 3</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Profile Picture Upload */}
            <div className="text-center">
              <div className="mb-4">
                {profilePicture ? (
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-red-600 shadow-lg">
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 flex items-center justify-center border-4 border-dashed border-gray-400">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                {profilePicture ? '📸 Change Photo' : '📸 Upload Photo'}
              </button>
              <p className="text-xs text-gray-500 mt-2">Max 5MB • JPG, PNG, or GIF</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Employee ID *</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g., SE-12345"
                  className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <button
            onClick={() => {
              if (!fullName || !employeeId) {
                setError('Please fill in all required fields');
                return;
              }
              setStep(2);
              setError('');
            }}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
          >
            CONTINUE →
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-6">
          <button onClick={() => setStep(1)} className="mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl mb-2">Your Organization 🏢</h2>
          <p className="text-sm opacity-90">Select your region and zone</p>
          <div className="mt-4 flex items-center">
            <div className="flex-1 bg-white h-2 rounded-full overflow-hidden">
              <div className="bg-yellow-400 h-full w-2/3"></div>
            </div>
            <span className="ml-3 text-sm">Step 2 of 3</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Region */}
            <div>
              <label className="block text-sm mb-2 text-gray-700">Region *</label>
              <select
                value={region}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              >
                <option value="">Select Region</option>
                {Object.keys(organizationHierarchy).map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Zone */}
            {region && (
              <div>
                <label className="block text-sm mb-2 text-gray-700">Zone *</label>
                <select
                  value={zone}
                  onChange={(e) => handleZoneChange(e.target.value)}
                  className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                  required
                >
                  <option value="">Select Zone</option>
                  {availableZones.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            )}

            {/* ZBM (Auto-populated, read-only) */}
            {zbm && (
              <div>
                <label className="block text-sm mb-2 text-gray-700">Zone Business Manager (ZBM)</label>
                <input
                  type="text"
                  value={zbm}
                  disabled
                  className="w-full px-4 py-4 bg-gray-100 border-2 border-gray-300 rounded-xl text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">✅ Auto-assigned based on your region</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <button
            onClick={() => {
              if (!region || !zone) {
                setError('Please select your region and zone');
                return;
              }
              setStep(3);
              setError('');
            }}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
          >
            CONTINUE →
          </button>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-6">
          <button onClick={() => setStep(2)} className="mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-2xl mb-2">Your Zone Commander 👮</h2>
          <p className="text-sm opacity-90">Select your Zone Sales Manager</p>
          <div className="mt-4 flex items-center">
            <div className="flex-1 bg-white h-2 rounded-full overflow-hidden">
              <div className="bg-yellow-400 h-full w-full"></div>
            </div>
            <span className="ml-3 text-sm">Step 3 of 3</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* ZSM */}
            <div>
              <label className="block text-sm mb-2 text-gray-700">Zone Sales Manager (ZSM) *</label>
              <select
                value={zsm}
                onChange={(e) => setZsm(e.target.value)}
                className="w-full px-4 py-4 bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                required
              >
                <option value="">Select your ZSM</option>
                {availableZSMs.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Your direct supervisor / Zone Commander</p>
            </div>

            {/* Summary */}
            {zsm && (
              <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                <h4 className="font-semibold mb-4 text-green-800">✅ Profile Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">Name:</span>
                    <span className="font-semibold">{fullName}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">Employee ID:</span>
                    <span className="font-semibold">{employeeId}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">Region:</span>
                    <span className="font-semibold">{region}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">Zone:</span>
                    <span className="font-semibold">{zone}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">ZSM:</span>
                    <span className="font-semibold">{zsm}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600 w-32">ZBM:</span>
                    <span className="font-semibold">{zbm}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-4">
          <button
            onClick={handleSubmit}
            disabled={isLoading || !zsm}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Setting up your profile...
              </div>
            ) : (
              '✅ COMPLETE SETUP'
            )}
          </button>
        </div>
      </div>
    );
  }

  return null;
}