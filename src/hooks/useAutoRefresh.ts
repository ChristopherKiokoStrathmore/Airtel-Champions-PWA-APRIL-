import { useEffect, useRef } from 'react';

interface AutoRefreshOptions {
  interval?: number; // Interval in milliseconds (default: 5 minutes)
  enableLogging?: boolean;
  onRefreshTriggered?: () => void;
}

/**
 * Hook to enable automatic hard refresh of the PWA every 5 minutes
 * Checks for new versions in the background and refreshes silently
 */
export function useAutoRefresh({
  interval = 5 * 60 * 1000, // 5 minutes default
  enableLogging = true,
  onRefreshTriggered
}: AutoRefreshOptions = {}) {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastVersionRef = useRef<string>('');

  useEffect(() => {
    // Store initial version hash
    lastVersionRef.current = getPageHash();

    const checkForUpdates = async () => {
      try {
        if (enableLogging) {
          console.log('[AutoRefresh] Checking for updates...');
        }

        // Fetch the index.html to check for version changes
        const response = await fetch('/?t=' + Date.now(), {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });

        const html = await response.text();
        const newHash = hashString(html);

        if (lastVersionRef.current && newHash !== lastVersionRef.current) {
          if (enableLogging) {
            console.log('[AutoRefresh] Update detected! Version hash changed. Refreshing...');
          }
          
          onRefreshTriggered?.();
          
          // Hard refresh to clear cache and reload
          window.location.href = window.location.href;
        }
      } catch (error) {
        if (enableLogging) {
          console.warn('[AutoRefresh] Error checking for updates:', error);
        }
      }
    };

    // Initial check after a short delay to ensure app is loaded
    const initialCheckTimeout = setTimeout(checkForUpdates, 10000);

    // Set up periodic checks
    refreshIntervalRef.current = setInterval(checkForUpdates, interval);

    if (enableLogging) {
      console.log(`[AutoRefresh] Auto-refresh enabled (interval: ${interval / 1000}s)`);
    }

    // Cleanup
    return () => {
      clearTimeout(initialCheckTimeout);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [interval, enableLogging, onRefreshTriggered]);
}

/**
 * Simple hash function to detect content changes
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

/**
 * Get a hash of the current page
 */
function getPageHash(): string {
  const html = document.documentElement.outerHTML;
  return hashString(html);
}
