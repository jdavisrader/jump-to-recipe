/**
 * Tests for performance monitoring utilities
 */

import { performanceMonitor, usePerformanceMonitor, measureAsync, trackWebVitals } from '../performance-monitor';

// Mock performance API
const mockPerformance = {
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(),
  getEntriesByType: jest.fn(),
  now: jest.fn(() => Date.now()),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock PerformanceObserver
class MockPerformanceObserver {
  callback: (list: any) => void;
  
  constructor(callback: (list: any) => void) {
    this.callback = callback;
  }
  
  observe() {}
  disconnect() {}
}

Object.defineProperty(global, 'PerformanceObserver', {
  value: MockPerformanceObserver,
  writable: true,
});

describe('Performance Monitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor.clear();
    mockPerformance.getEntriesByName.mockReturnValue([{ duration: 100 }]);
  });

  describe('Basic Functionality', () => {
    test('should mark start and end of operations', () => {
      performanceMonitor.markStart('test-operation');
      performanceMonitor.markEnd('test-operation');

      expect(mockPerformance.mark).toHaveBeenCalledWith('test-operation-start');
      expect(mockPerformance.mark).toHaveBeenCalledWith('test-operation-end');
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'test-operation-duration',
        'test-operation-start',
        'test-operation-end'
      );
    });

    test('should record custom metrics', () => {
      performanceMonitor.recordMetric('custom-metric', 150, { context: 'test' });

      const metrics = performanceMonitor.getAllMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'custom-metric',
        value: 150,
        context: { context: 'test' },
      });
    });

    test('should track user interactions', () => {
      performanceMonitor.trackUserInteraction('searchInteractions', { query: 'test' });
      performanceMonitor.trackUserInteraction('searchInteractions', { query: 'another' });

      const userMetrics = performanceMonitor.getUserMetrics();
      expect(userMetrics.searchInteractions).toBe(2);

      const metrics = performanceMonitor.getMetricsByName('user-interaction-searchInteractions');
      expect(metrics).toHaveLength(2);
    });

    test('should calculate average metrics', () => {
      performanceMonitor.recordMetric('test-metric', 100);
      performanceMonitor.recordMetric('test-metric', 200);
      performanceMonitor.recordMetric('test-metric', 300);

      const average = performanceMonitor.getAverageMetric('test-metric');
      expect(average).toBe(200);
    });
  });

  describe('Performance Requirements', () => {
    test('should check performance requirements', () => {
      // Set up metrics that meet requirements
      performanceMonitor.recordMetric('my-recipes-initial-load', 1500);
      performanceMonitor.recordMetric('my-recipes-search', 800);
      performanceMonitor.recordMetric('my-recipes-pagination', 600);

      const check = performanceMonitor.checkPerformanceRequirements();
      expect(check.initialLoadOk).toBe(true);
      expect(check.searchOk).toBe(true);
      expect(check.paginationOk).toBe(true);
      expect(check.overall).toBe(true);
    });

    test('should identify performance issues', () => {
      // Set up metrics that exceed requirements
      performanceMonitor.recordMetric('my-recipes-initial-load', 3000);
      performanceMonitor.recordMetric('my-recipes-search', 1500);
      performanceMonitor.recordMetric('my-recipes-pagination', 1200);

      const check = performanceMonitor.checkPerformanceRequirements();
      expect(check.initialLoadOk).toBe(false);
      expect(check.searchOk).toBe(false);
      expect(check.paginationOk).toBe(false);
      expect(check.overall).toBe(false);
    });
  });

  describe('Performance Report', () => {
    test('should generate comprehensive performance report', () => {
      // Set up test data
      performanceMonitor.recordMetric('my-recipes-initial-load', 2500);
      performanceMonitor.recordMetric('my-recipes-search', 1200);
      performanceMonitor.trackUserInteraction('searchInteractions');
      performanceMonitor.trackUserInteraction('errorEncounters');
      performanceMonitor.trackUserInteraction('retryAttempts');

      const report = performanceMonitor.generateReport();

      expect(report.loadingMetrics.initialLoad).toBe(2500);
      expect(report.loadingMetrics.searchTime).toBe(1200);
      expect(report.userMetrics.searchInteractions).toBe(1);
      expect(report.userMetrics.errorEncounters).toBe(1);
      expect(report.performanceCheck.initialLoadOk).toBe(false);
      expect(report.recommendations).toContain(
        'Initial load time exceeds 2 seconds. Consider implementing lazy loading or reducing initial data fetch size.'
      );
    });

    test('should provide recommendations based on metrics', () => {
      // High error rate scenario
      for (let i = 0; i < 10; i++) {
        performanceMonitor.trackUserInteraction('searchInteractions');
      }
      for (let i = 0; i < 3; i++) {
        performanceMonitor.trackUserInteraction('errorEncounters');
        performanceMonitor.trackUserInteraction('retryAttempts');
      }

      const report = performanceMonitor.generateReport();
      expect(report.recommendations).toContain(
        'High error rate detected. Review error handling and network reliability.'
      );
      expect(report.recommendations).toContain(
        'High retry rate suggests network issues. Consider implementing better offline support.'
      );
    });
  });

  describe('Memory Management', () => {
    test('should limit metrics to prevent memory leaks', () => {
      // Add more than 100 metrics
      for (let i = 0; i < 150; i++) {
        performanceMonitor.recordMetric(`metric-${i}`, i);
      }

      const metrics = performanceMonitor.getAllMetrics();
      expect(metrics.length).toBe(100);
      
      // Should keep the most recent metrics
      expect(metrics[0].name).toBe('metric-50');
      expect(metrics[99].name).toBe('metric-149');
    });

    test('should clear all data when requested', () => {
      performanceMonitor.recordMetric('test-metric', 100);
      performanceMonitor.trackUserInteraction('searchInteractions');

      performanceMonitor.clear();

      expect(performanceMonitor.getAllMetrics()).toHaveLength(0);
      expect(performanceMonitor.getUserMetrics().searchInteractions).toBe(0);
    });
  });

  describe('Export Functionality', () => {
    test('should export metrics for external monitoring', () => {
      performanceMonitor.recordMetric('test-metric', 100, { context: 'test' });
      performanceMonitor.trackUserInteraction('searchInteractions');

      const exported = performanceMonitor.exportMetrics();

      expect(exported).toHaveProperty('timestamp');
      expect(exported).toHaveProperty('userAgent');
      expect(exported).toHaveProperty('url');
      expect(exported).toHaveProperty('metrics');
      expect(exported).toHaveProperty('summary');
      expect(exported.metrics).toHaveLength(2); // test-metric + user-interaction
    });
  });
});

describe('measureAsync utility', () => {
  test('should measure async operation duration', async () => {
    const mockOperation = jest.fn().mockResolvedValue('result');
    
    const result = await measureAsync('test-async', mockOperation, { context: 'test' });
    
    expect(result).toBe('result');
    expect(mockPerformance.mark).toHaveBeenCalledWith('test-async-start');
    expect(mockPerformance.mark).toHaveBeenCalledWith('test-async-end');
    expect(mockPerformance.measure).toHaveBeenCalledWith(
      'test-async-duration',
      'test-async-start',
      'test-async-end'
    );
  });

  test('should handle async operation errors', async () => {
    const mockError = new Error('Test error');
    const mockOperation = jest.fn().mockRejectedValue(mockError);
    
    await expect(measureAsync('test-async-error', mockOperation)).rejects.toThrow('Test error');
    
    expect(mockPerformance.mark).toHaveBeenCalledWith('test-async-error-start');
    expect(mockPerformance.mark).toHaveBeenCalledWith('test-async-error-end');
  });
});

describe('trackWebVitals', () => {
  test('should set up performance observers', () => {
    const observeSpy = jest.spyOn(MockPerformanceObserver.prototype, 'observe');
    
    trackWebVitals();
    
    // Should create observers for LCP, FID, and CLS
    expect(observeSpy).toHaveBeenCalledTimes(3);
  });

  test('should handle unsupported performance observers gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const observeSpy = jest.spyOn(MockPerformanceObserver.prototype, 'observe')
      .mockImplementation(() => {
        throw new Error('Not supported');
      });
    
    trackWebVitals();
    
    expect(consoleSpy).toHaveBeenCalledTimes(3);
    consoleSpy.mockRestore();
  });
});