/**
 * WakeLockButton
 * A compact toggle button that requests/releases the Screen Wake Lock.
 * Drop it into any screen where you want "keep screen on" functionality.
 * Renders nothing on browsers that don't support the API.
 */

import { useWakeLock } from '../hooks/useWakeLock';

interface WakeLockButtonProps {
  className?: string;
}

export function WakeLockButton({ className = '' }: WakeLockButtonProps) {
  const { isActive, isSupported, request, release } = useWakeLock();

  if (!isSupported) return null;

  return (
    <button
      onClick={isActive ? release : request}
      title={isActive ? 'Screen is staying on — tap to disable' : 'Keep screen on during presentation'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        isActive
          ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-inner'
          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
      } ${className}`}
    >
      {/* Sun / moon icon */}
      {isActive ? (
        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a1 1 0 011 1v1a1 1 0 01-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v1a1 1 0 01-2 0v-1a1 1 0 011-1zm9-7a1 1 0 010 2h-1a1 1 0 010-2h1zM4 11a1 1 0 010 2H3a1 1 0 010-2h1zm14.95-6.364a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zm-12.728 12.02a1 1 0 010 1.415l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zm12.02.707a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414-1.414l.707.707a1 1 0 010 1.414zM5.636 6.05a1 1 0 01-1.414 0l-.707-.707A1 1 0 014.929 3.93l.707.707a1 1 0 010 1.414zM12 7a5 5 0 110 10A5 5 0 0112 7z"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
      {isActive ? 'Screen On' : 'Keep On'}
    </button>
  );
}
