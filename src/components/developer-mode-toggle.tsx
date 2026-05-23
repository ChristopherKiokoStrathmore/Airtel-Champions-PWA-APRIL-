import { useState } from 'react';
import { supabase } from '../utils/supabase/client';

export function DeveloperModeToggle({ userData, onLogout }: { userData: any; onLogout: () => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const switchToDeveloper = async () => {
    if (!confirm('Switch to Developer Dashboard? You will need to re-login.')) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ role: 'developer' })
        .eq('id', userData.id);

      if (error) throw error;

      alert('✅ Role updated to Developer! Logging out...');
      setTimeout(() => {
        onLogout();
      }, 1000);
    } catch (error: any) {
      alert('❌ Error: ' + error.message);
      setIsLoading(false);
    }
  };

  // Only show for Christopher or directors
  if (userData?.role !== 'director' && !userData?.full_name?.toLowerCase().includes('christopher')) {
    return null;
  }

  return (
    <button
      onClick={switchToDeveloper}
      disabled={isLoading}
      className="fixed top-4 right-4 z-50 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Updating...
        </>
      ) : (
        <>
          💻 Switch to Developer Mode
        </>
      )}
    </button>
  );
}
