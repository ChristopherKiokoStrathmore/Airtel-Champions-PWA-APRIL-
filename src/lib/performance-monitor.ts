// Performance Monitor - Tracks app performance metrics
interface PerformanceMetrics {
  // Core Web Vitals
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  pageLoadTime?: number;
  apiResponseTime?: number;
  componentRenderTime?: number;
  memoryUsage?: number;
  
  // User interactions
  clickResponseTime?: number;
  formSubmissionTime?: number;
  navigationTime?: number;
}

interface PerformanceEvent {
  type: string;
  timestamp: number;
  metrics: PerformanceMetrics;
  url: string;
  userAgent: string;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private events: PerformanceEvent[] = [];
  private observers: PerformanceObserver[] = [];
  private startTime: number = Date.now();

  constructor() {
    this.initializeObservers();
    this.trackPageLoad();
    this.trackMemoryUsage();
  }

  private initializeObservers() {
    // Track Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Track First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Track Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

      // Track First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    }
  }

  private trackPageLoad() {
    if ('performance' in window && 'navigation' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
    }
  }

  private trackMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;
    }
  }

  // Track API response times
  trackApiCall(url: string, startTime: number, endTime: number, success: boolean) {
    const responseTime = endTime - startTime;
    this.metrics.apiResponseTime = responseTime;

    this.recordEvent('api_call', {
      url,
      responseTime,
      success,
    });
  }

  // Track component render times
  trackComponentRender(componentName: string, renderTime: number) {
    this.metrics.componentRenderTime = renderTime;
    
    this.recordEvent('component_render', {
      componentName,
      renderTime,
    });
  }

  // Track user interactions
  trackClick(element: string, responseTime: number) {
    this.metrics.clickResponseTime = responseTime;
    
    this.recordEvent('click', {
      element,
      responseTime,
    });
  }

  trackFormSubmission(formName: string, submissionTime: number, success: boolean) {
    this.metrics.formSubmissionTime = submissionTime;
    
    this.recordEvent('form_submission', {
      formName,
      submissionTime,
      success,
    });
  }

  trackNavigation(from: string, to: string, navigationTime: number) {
    this.metrics.navigationTime = navigationTime;
    
    this.recordEvent('navigation', {
      from,
      to,
      navigationTime,
    });
  }

  private recordEvent(type: string, additionalData: any = {}) {
    const event: PerformanceEvent = {
      type,
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getUserId(),
      ...additionalData,
    };

    this.events.push(event);
    
    // Keep only last 100 events to prevent memory issues
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    // Send to analytics service (in production)
    if (import.meta.env.PROD) {
      this.sendToAnalytics(event);
    }
  }

  private getUserId(): string | undefined {
    // Get user ID from local storage or auth context
    try {
      const userData = localStorage.getItem('tai_user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id;
      }
    } catch (error) {
      // Ignore errors
    }
    return undefined;
  }

  private async sendToAnalytics(event: PerformanceEvent) {
    try {
      // Send to your analytics service
      // This could be a custom endpoint, Google Analytics, etc.
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Fail silently to not impact user experience
      console.warn('Failed to send performance analytics:', error);
    }
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    let score = 100;
    
    // Deduct points for poor metrics
    if (this.metrics.lcp && this.metrics.lcp > 2500) score -= 20;
    if (this.metrics.fid && this.metrics.fid > 100) score -= 20;
    if (this.metrics.cls && this.metrics.cls > 0.1) score -= 20;
    if (this.metrics.pageLoadTime && this.metrics.pageLoadTime > 3000) score -= 20;
    
    return Math.max(0, score);
  }

  // Get performance report
  getPerformanceReport(): {
    score: number;
    metrics: PerformanceMetrics;
    recommendations: string[];
  } {
    const score = this.getPerformanceScore();
    const recommendations = this.generateRecommendations();
    
    return {
      score,
      metrics: this.getMetrics(),
      recommendations,
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.lcp && this.metrics.lcp > 2500) {
      recommendations.push('Optimize images and reduce server response time');
    }
    
    if (this.metrics.fid && this.metrics.fid > 100) {
      recommendations.push('Reduce JavaScript execution time');
    }
    
    if (this.metrics.cls && this.metrics.cls > 0.1) {
      recommendations.push('Ensure proper image dimensions and avoid layout shifts');
    }
    
    if (this.metrics.pageLoadTime && this.metrics.pageLoadTime > 3000) {
      recommendations.push('Implement code splitting and lazy loading');
    }
    
    if (this.metrics.memoryUsage && this.metrics.memoryUsage > 50000000) {
      recommendations.push('Optimize memory usage and prevent memory leaks');
    }
    
    return recommendations;
  }

  // Clean up observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return getPerformanceMonitor();
};

// Higher-order component for tracking render performance
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const monitor = usePerformanceMonitor();
    const renderStart = performance.now();
    
    React.useEffect(() => {
      const renderTime = performance.now() - renderStart;
      monitor.trackComponentRender(componentName, renderTime);
    });
    
    return <Component {...props} />;
  });
};
