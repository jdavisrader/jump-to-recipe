/**
 * Performance Provider component for monitoring and optimization
 * Provides performance tracking context throughout the application
 */

'use client';

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { usePerformanceMonitor, trackWebVitals } from '@/lib/performance-monitor';
import { recipeCache } from '@/lib/recipe-cache';

interface PerformanceContextValue {
  markStart: (name: string, context?: Record<string, any>) => void;
  markEnd: (name: string, context?: Record<string, any>) => number;
  trackInteraction: (type: string, context?: Record<string, any>) => void;
  getReport: () => any;
  optimizeCache: () => void;
  getCacheStats: () => any;
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

interface PerformanceProviderProps {
  children: React.ReactNode;
  enableWebVitals?: boolean;
  enableCacheOptimization?: boolean;
}

export function PerformanceProvider({ 
  children, 
  enableWebVitals = true,
  enableCacheOptimization = true 
}: PerformanceProviderProps) {
  const { markStart, markEnd, trackInteraction, getReport, monitor } = usePerformanceMonitor();

  // Initialize Web Vitals tracking
  useEffect(() => {
    if (enableWebVitals && typeof window !== 'undefined') {
      trackWebVitals();
    }
  }, [enableWebVitals]);

  // Periodic cache optimization
  useEffect(() => {
    if (!enableCacheOptimization) return;

    const optimizeInterval = setInterval(() => {
      recipeCache.optimize();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(optimizeInterval);
  }, [enableCacheOptimization]);

  // Performance monitoring for page visibility changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        markEnd('page-visible-time');
      } else {
        markStart('page-visible-time');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Start tracking when component mounts
    markStart('page-visible-time');

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      markEnd('page-visible-time');
    };
  }, [markStart, markEnd]);

  // Memory usage monitoring
  useEffect(() => {
    if (typeof window === 'undefined' || !('memory' in performance)) return;

    const checkMemoryUsage = () => {
      const memory = (performance as any).memory;
      if (memory) {
        monitor.recordMetric('memory-used-js-heap', memory.usedJSHeapSize);
        monitor.recordMetric('memory-total-js-heap', memory.totalJSHeapSize);
        monitor.recordMetric('memory-js-heap-limit', memory.jsHeapSizeLimit);
        
        // Warn if memory usage is high
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          console.warn('High memory usage detected:', usagePercent.toFixed(2) + '%');
          
          // Trigger cache cleanup
          if (enableCacheOptimization) {
            recipeCache.optimize();
          }
        }
      }
    };

    const memoryInterval = setInterval(checkMemoryUsage, 30000); // Every 30 seconds
    
    return () => clearInterval(memoryInterval);
  }, [monitor, enableCacheOptimization]);

  const optimizeCache = useCallback(() => {
    recipeCache.optimize();
  }, []);

  const getCacheStats = useCallback(() => {
    return recipeCache.getStats();
  }, []);

  const contextValue: PerformanceContextValue = {
    markStart,
    markEnd,
    trackInteraction,
    getReport,
    optimizeCache,
    getCacheStats,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformanceContext() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
}

/**
 * HOC for automatic performance tracking of components
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const { markStart, markEnd } = usePerformanceContext();
    
    useEffect(() => {
      markStart(`${componentName}-mount`);
      
      return () => {
        markEnd(`${componentName}-unmount`);
      };
    }, [markStart, markEnd]);
    
    useEffect(() => {
      markStart(`${componentName}-render`);
      markEnd(`${componentName}-render`);
    });
    
    return <Component {...props} />;
  };
}

/**
 * Performance debugging component (development only)
 */
export function PerformanceDebugger() {
  const { getReport, getCacheStats } = usePerformanceContext();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const [showDebugger, setShowDebugger] = React.useState(false);
  const [report, setReport] = React.useState<any>(null);
  const [cacheStats, setCacheStats] = React.useState<any>(null);

  const updateStats = useCallback(() => {
    setReport(getReport());
    setCacheStats(getCacheStats());
  }, [getReport, getCacheStats]);

  useEffect(() => {
    if (showDebugger) {
      updateStats();
      const interval = setInterval(updateStats, 1000);
      return () => clearInterval(interval);
    }
  }, [showDebugger, updateStats]);

  if (!showDebugger) {
    return (
      <button
        onClick={() => setShowDebugger(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-2 rounded text-xs z-50"
        style={{ fontSize: '10px' }}
      >
        Perf Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm max-h-96 overflow-auto z-50 text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Performance Debug</h3>
        <button
          onClick={() => setShowDebugger(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      {report && (
        <div className="space-y-2">
          <div>
            <h4 className="font-semibold">Loading Metrics (ms)</h4>
            <div className="text-xs">
              <div>Initial: {report.loadingMetrics.initialLoad.toFixed(0)}</div>
              <div>Search: {report.loadingMetrics.searchTime.toFixed(0)}</div>
              <div>Pagination: {report.loadingMetrics.paginationTime.toFixed(0)}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold">User Interactions</h4>
            <div className="text-xs">
              <div>Searches: {report.userMetrics.searchInteractions}</div>
              <div>Pagination: {report.userMetrics.paginationClicks}</div>
              <div>Errors: {report.userMetrics.errorEncounters}</div>
              <div>Retries: {report.userMetrics.retryAttempts}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold">Performance Check</h4>
            <div className="text-xs">
              <div className={report.performanceCheck.initialLoadOk ? 'text-green-600' : 'text-red-600'}>
                Initial Load: {report.performanceCheck.initialLoadOk ? '✓' : '✗'}
              </div>
              <div className={report.performanceCheck.searchOk ? 'text-green-600' : 'text-red-600'}>
                Search: {report.performanceCheck.searchOk ? '✓' : '✗'}
              </div>
              <div className={report.performanceCheck.paginationOk ? 'text-green-600' : 'text-red-600'}>
                Pagination: {report.performanceCheck.paginationOk ? '✓' : '✗'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {cacheStats && (
        <div className="mt-2 pt-2 border-t">
          <h4 className="font-semibold">Cache Stats</h4>
          <div className="text-xs">
            <div>Hit Rate: {(cacheStats.hitRate * 100).toFixed(1)}%</div>
            <div>Size: {cacheStats.totalSize}</div>
            <div>Memory: {(cacheStats.memoryUsage / 1024).toFixed(1)}KB</div>
          </div>
        </div>
      )}
      
      {report?.recommendations && report.recommendations.length > 0 && (
        <div className="mt-2 pt-2 border-t">
          <h4 className="font-semibold text-orange-600">Recommendations</h4>
          <ul className="text-xs space-y-1">
            {report.recommendations.slice(0, 2).map((rec: string, i: number) => (
              <li key={i} className="text-orange-600">• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}