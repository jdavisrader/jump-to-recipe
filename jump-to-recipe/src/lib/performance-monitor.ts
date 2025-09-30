/**
 * Performance monitoring utilities for My Recipes feature
 * Tracks loading times, user interactions, and resource usage
 */

import React from "react";

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

export interface LoadingMetrics {
  initialLoad: number;
  searchTime: number;
  paginationTime: number;
  errorRecoveryTime: number;
}

export interface UserInteractionMetrics {
  searchInteractions: number;
  paginationClicks: number;
  retryAttempts: number;
  errorEncounters: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private loadingMetrics: Partial<LoadingMetrics> = {};
  private userMetrics: UserInteractionMetrics = {
    searchInteractions: 0,
    paginationClicks: 0,
    retryAttempts: 0,
    errorEncounters: 0,
  };

  /**
   * Mark the start of a performance measurement
   */
  markStart(name: string, context?: Record<string, any>): void {
    if (typeof window !== 'undefined' && window.performance && typeof window.performance.mark === 'function') {
      const markName = `${name}-start`;
      try {
        window.performance.mark(markName);

        if (process.env.NODE_ENV === 'development') {
          console.log(`Performance mark: ${markName}`, context);
        }
      } catch (error) {
        // Silently fail in test environments
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`Failed to mark performance: ${markName}`, error);
        }
      }
    }
  }

  /**
   * Mark the end of a performance measurement and calculate duration
   */
  markEnd(name: string, context?: Record<string, any>): number {
    if (typeof window !== 'undefined' && window.performance && typeof window.performance.mark === 'function') {
      const startMark = `${name}-start`;
      const endMark = `${name}-end`;
      const measureName = `${name}-duration`;

      try {
        window.performance.mark(endMark);
        window.performance.measure(measureName, startMark, endMark);

        const measure = window.performance.getEntriesByName(measureName)[0];
        const duration = measure?.duration || 0;

        this.recordMetric(name, duration, context);

        if (process.env.NODE_ENV === 'development') {
          console.log(`Performance measure: ${measureName} = ${duration}ms`, context);
        }

        return duration;
      } catch (error) {
        // Silently fail in test environments
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`Failed to measure performance for ${name}:`, error);
        }
        return 0;
      }
    }
    return 0;
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number, context?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    this.metrics.push(metric);

    // Update specific metric categories
    this.updateLoadingMetrics(name, value);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Track user interactions
   */
  trackUserInteraction(type: keyof UserInteractionMetrics, context?: Record<string, any>): void {
    this.userMetrics[type]++;

    this.recordMetric(`user-interaction-${type}`, this.userMetrics[type], context);
  }

  /**
   * Update loading-specific metrics
   */
  private updateLoadingMetrics(name: string, value: number): void {
    switch (name) {
      case 'my-recipes-initial-load':
        this.loadingMetrics.initialLoad = value;
        break;
      case 'my-recipes-search':
        this.loadingMetrics.searchTime = value;
        break;
      case 'my-recipes-pagination':
        this.loadingMetrics.paginationTime = value;
        break;
      case 'my-recipes-error-recovery':
        this.loadingMetrics.errorRecoveryTime = value;
        break;
    }
  }

  /**
   * Get current loading metrics
   */
  getLoadingMetrics(): LoadingMetrics {
    return {
      initialLoad: this.loadingMetrics.initialLoad || 0,
      searchTime: this.loadingMetrics.searchTime || 0,
      paginationTime: this.loadingMetrics.paginationTime || 0,
      errorRecoveryTime: this.loadingMetrics.errorRecoveryTime || 0,
    };
  }

  /**
   * Get user interaction metrics
   */
  getUserMetrics(): UserInteractionMetrics {
    return { ...this.userMetrics };
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name pattern
   */
  getMetricsByName(pattern: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name.includes(pattern));
  }

  /**
   * Calculate average for a metric
   */
  getAverageMetric(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  /**
   * Check if performance meets requirements
   */
  checkPerformanceRequirements(): {
    initialLoadOk: boolean;
    searchOk: boolean;
    paginationOk: boolean;
    overall: boolean;
  } {
    const metrics = this.getLoadingMetrics();

    // Performance requirements from the spec
    const initialLoadOk = metrics.initialLoad <= 2000; // 2 seconds
    const searchOk = metrics.searchTime <= 1000; // 1 second
    const paginationOk = metrics.paginationTime <= 1000; // 1 second

    return {
      initialLoadOk,
      searchOk,
      paginationOk,
      overall: initialLoadOk && searchOk && paginationOk,
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    loadingMetrics: LoadingMetrics;
    userMetrics: UserInteractionMetrics;
    performanceCheck: {
      initialLoadOk: boolean;
      searchOk: boolean;
      paginationOk: boolean;
      overall: boolean;
    };
    recommendations: string[];
  } {
    const loadingMetrics = this.getLoadingMetrics();
    const userMetrics = this.getUserMetrics();
    const performanceCheck = this.checkPerformanceRequirements();
    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (!performanceCheck.initialLoadOk) {
      recommendations.push('Initial load time exceeds 2 seconds. Consider implementing lazy loading or reducing initial data fetch size.');
    }

    if (!performanceCheck.searchOk) {
      recommendations.push('Search response time exceeds 1 second. Consider implementing search debouncing or client-side filtering.');
    }

    if (!performanceCheck.paginationOk) {
      recommendations.push('Pagination loading time exceeds 1 second. Consider implementing infinite scroll or reducing page size.');
    }

    if (userMetrics.errorEncounters > userMetrics.searchInteractions * 0.1) {
      recommendations.push('High error rate detected. Review error handling and network reliability.');
    }

    if (userMetrics.retryAttempts > userMetrics.errorEncounters * 0.5) {
      recommendations.push('High retry rate suggests network issues. Consider implementing better offline support.');
    }

    return {
      loadingMetrics,
      userMetrics,
      performanceCheck,
      recommendations,
    };
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.metrics = [];
    this.loadingMetrics = {};
    this.userMetrics = {
      searchInteractions: 0,
      paginationClicks: 0,
      retryAttempts: 0,
      errorEncounters: 0,
    };
  }

  /**
   * Export metrics for external monitoring services
   */
  exportMetrics(): {
    timestamp: number;
    userAgent: string;
    url: string;
    metrics: PerformanceMetric[];
    summary: {
      loadingMetrics: LoadingMetrics;
      userMetrics: UserInteractionMetrics;
      performanceCheck: {
        initialLoadOk: boolean;
        searchOk: boolean;
        paginationOk: boolean;
        overall: boolean;
      };
      recommendations: string[];
    };
  } {
    return {
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      metrics: this.getAllMetrics(),
      summary: this.generateReport(),
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const markStart = (name: string, context?: Record<string, any>) => {
    performanceMonitor.markStart(name, context);
  };

  const markEnd = (name: string, context?: Record<string, any>) => {
    return performanceMonitor.markEnd(name, context);
  };

  const trackInteraction = (type: keyof UserInteractionMetrics, context?: Record<string, any>) => {
    performanceMonitor.trackUserInteraction(type, context);
  };

  const getReport = () => {
    return performanceMonitor.generateReport();
  };

  return {
    markStart,
    markEnd,
    trackInteraction,
    getReport,
    monitor: performanceMonitor,
  };
}

/**
 * Higher-order component for automatic performance tracking
 */
export function withPerformanceTracking<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: T) {
    const { markStart, markEnd } = usePerformanceMonitor();

    React.useEffect(() => {
      markStart(`${componentName}-render`);

      return () => {
        markEnd(`${componentName}-render`);
      };
    }, [markStart, markEnd]);

    return React.createElement(Component, props);
  };
}

/**
 * Utility for measuring async operations
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  performanceMonitor.markStart(name, context);

  try {
    const result = await operation();
    performanceMonitor.markEnd(name, { ...context, success: true });
    return result;
  } catch (error) {
    performanceMonitor.markEnd(name, { ...context, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

/**
 * Web Vitals integration
 */
export function trackWebVitals() {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    // Track Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      performanceMonitor.recordMetric('web-vitals-lcp', lastEntry.startTime, {
        element: (lastEntry as any).element?.tagName,
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    // Track First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const eventEntry = entry as PerformanceEventTiming;
        performanceMonitor.recordMetric('web-vitals-fid', eventEntry.processingStart - eventEntry.startTime, {
          eventType: eventEntry.name,
        });
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      });
      performanceMonitor.recordMetric('web-vitals-cls', clsValue);
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }
  }
}