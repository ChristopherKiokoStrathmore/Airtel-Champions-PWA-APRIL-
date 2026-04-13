/**
 * usePageTracking Hook
 * Automatically tracks page views and time spent on each page
 * 
 * Usage:
 * import { usePageTracking } from '../hooks/usePageTracking';
 * 
 * function MyComponent() {
 *   usePageTracking('Dashboard'); // Automatically tracks this page
 *   return <div>...</div>;
 * }
 */

import { useEffect, useRef } from 'react';
import { trackPageView, updatePageTimeSpent } from '../utils/analytics';

export const usePageTracking = (pageName: string, pageUrl?: string) => {
  const startTimeRef = useRef<number>(Date.now());
  const pageViewIdRef = useRef<string | null>(null);

  useEffect(() => {
    // ⚠️ ANALYTICS TEMPORARILY DISABLED - Just log to console
    console.log(`[PageTracking] 📄 Viewing: ${pageName}`);
    
    // Reset start time when page changes
    startTimeRef.current = Date.now();
    
    // Track page view is disabled due to RLS policy issues
    // Will be re-enabled after proper database policies are configured
    
    /* DISABLED CODE - Re-enable after fixing RLS policies
    const logPageView = async () => {
      const userId = getUserId();
      const sessionId = localStorage.getItem('analytics_session_id');
      
      if (!userId || !sessionId) return;
      
      const pageViewId = await trackPageView(userId, sessionId, pageName, pageUrl);
      pageViewIdRef.current = pageViewId;
      
      console.log(`[PageTracking] 📄 Viewing: ${pageName}`);
    };

    logPageView();

    // Update time spent when component unmounts
    return () => {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      if (pageViewIdRef.current && timeSpent > 0) {
        updatePageTimeSpent(pageViewIdRef.current, timeSpent);
        console.log(`[PageTracking] ⏱️ Spent ${timeSpent}s on ${pageName}`);
      }
    };
    */
  }, [pageName, pageUrl]);
};