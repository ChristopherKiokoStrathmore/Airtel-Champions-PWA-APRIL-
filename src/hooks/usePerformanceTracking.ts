// usePerformanceTracking.ts - React hook for performance tracking
import { useEffect, useRef, useCallback } from 'react';
import { getPerformanceMonitor } from '../lib/performance-monitor';

interface UsePerformanceTrackingOptions {
  trackClicks?: boolean;
  trackPageNavigation?: boolean;
  trackForms?: boolean;
  trackApiCalls?: boolean;
}

export const usePerformanceTracking = (options: UsePerformanceTrackingOptions = {}) => {
  const {
    trackClicks = true,
    trackPageNavigation: trackNavigationOption = true,
    trackForms = true,
    trackApiCalls = true,
  } = options;
  
  const monitor = getPerformanceMonitor();
  const apiCallStartTimes = useRef<Map<string, number>>(new Map());

  // Track click interactions
  const trackClick = useCallback((element: string, callback?: () => void) => {
    if (!trackClicks) return callback?.();
    
    const startTime = performance.now();
    
    return () => {
      const responseTime = performance.now() - startTime;
      monitor.trackClick(element, responseTime);
      callback?.();
    };
  }, [monitor, trackClicks]);

  // Track API calls
  const trackApiCall = useCallback(async (url: string, apiCall: () => Promise<any>) => {
    if (!trackApiCalls) return apiCall();
    
    const startTime = performance.now();
    apiCallStartTimes.current.set(url, startTime);
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      monitor.trackApiCall(url, startTime, endTime, true);
      return result;
    } catch (error) {
      const endTime = performance.now();
      monitor.trackApiCall(url, startTime, endTime, false);
      throw error;
    } finally {
      apiCallStartTimes.current.delete(url);
    }
  }, [monitor, trackApiCalls]);

  // Track form submissions
  const trackFormSubmission = useCallback(async (formName: string, submission: () => Promise<any>) => {
    if (!trackForms) return submission();
    
    const startTime = performance.now();
    
    try {
      const result = await submission();
      const endTime = performance.now();
      monitor.trackFormSubmission(formName, endTime - startTime, true);
      return result;
    } catch (error) {
      const endTime = performance.now();
      monitor.trackFormSubmission(formName, endTime - startTime, false);
      throw error;
    }
  }, [monitor, trackForms]);

  // Track navigation
  const trackNavigation = useCallback((from: string, to: string, callback?: () => void) => {
    if (!trackNavigationOption) return callback?.();
    
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      monitor.trackNavigation(from, to, endTime - startTime);
      callback?.();
    };
  }, [monitor, trackNavigationOption]);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return monitor.getPerformanceReport();
  }, [monitor]);

  // Get performance score
  const getPerformanceScore = useCallback(() => {
    return monitor.getPerformanceScore();
  }, [monitor]);

  // Setup performance monitoring
  useEffect(() => {
    // Monitor page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is hidden, send any pending analytics
        const metrics = monitor.getMetrics();
        if (metrics.pageLoadTime) {
          // Send final metrics
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [monitor]);

  // Monitor memory usage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        monitor.metrics.memoryUsage = memory.usedJSHeapSize;
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [monitor]);

  return {
    trackClick,
    trackApiCall,
    trackFormSubmission,
    trackNavigation,
    getPerformanceReport,
    getPerformanceScore,
    currentMetrics: monitor.getMetrics(),
  };
};
