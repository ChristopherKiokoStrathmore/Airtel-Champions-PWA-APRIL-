import { useState } from 'react';
import { Monitor, Smartphone, RefreshCw } from 'lucide-react';
import { getLayoutMode, setLayoutMode } from '../lib/platform';

interface DeveloperToggleProps {
  userData: any;
}

export function DeveloperToggle({ userData }: DeveloperToggleProps) {
  const [currentMode, setCurrentMode] = useState(getLayoutMode());
  const [isChanging, setIsChanging] = useState(false);

  // Only show to Christopher Kioko (DEV001)
  const isChristopher = userData?.employee_id === 'DEV001' || userData?.role === 'developer';
  
  if (!isChristopher) {
    return null;
  }

  const handleToggle = () => {
    setIsChanging(true);
    
    const newMode = currentMode === 'mobile' ? 'desktop' : 'mobile';
    setLayoutMode(newMode);
    
    // Page will reload automatically via setLayoutMode
  };

  const handleReset = () => {
    setIsChanging(true);
    setLayoutMode('auto');
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex items-center gap-2">
      {/* Current Mode Indicator */}
      <div className="bg-purple-900 text-white px-3 py-2 rounded-lg text-xs font-semibold shadow-lg border-2 border-purple-500">
        {currentMode === 'mobile' ? '📱 Mobile' : '💻 Desktop'} Mode
      </div>

      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        disabled={isChanging}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 font-semibold disabled:opacity-50"
        title="Switch between Mobile and Desktop view"
      >
        {isChanging ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Switching...
          </>
        ) : currentMode === 'mobile' ? (
          <>
            <Monitor className="w-4 h-4" />
            Desktop
          </>
        ) : (
          <>
            <Smartphone className="w-4 h-4" />
            Mobile
          </>
        )}
      </button>

      {/* Reset to Auto */}
      <button
        onClick={handleReset}
        disabled={isChanging}
        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg shadow-lg transition-all text-xs font-semibold disabled:opacity-50"
        title="Reset to auto-detect"
      >
        Auto
      </button>

      {/* Developer Label */}
      <div className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg">
        🔧 DEV
      </div>
    </div>
  );
}
