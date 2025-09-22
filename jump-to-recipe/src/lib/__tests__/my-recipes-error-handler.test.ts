/**
 * Tests for My Recipes error handling utilities
 */

import {
  categorizeError,
  withRetry,
  fetchWithRetry,
  isRecipeAccessibilityError,
  getGracefulDegradationStrategy,
  DEFAULT_RETRY_CONFIG,
} from '../my-recipes-error-handler';

// Mock fetch and Response for testing
global.fetch = jest.fn();

// Mock Response class for Node.js environment
class MockResponse {
  status: number;
  statusText: string;
  body: string;
  ok: boolean;

  constructor(body: string, init: { status: number; statusText?: string }) {
    this.body = body;
    this.status = init.status;
    this.statusText = init.statusText || '';
    this.ok = init.status >= 200 && init.status < 300;
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }
}

// Replace global Response with mock
(global as any).Response = MockResponse;

// Mock AbortSignal.timeout for Node.js environment
if (!AbortSignal.timeout) {
  (AbortSignal as any).timeout = (ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

describe('My Recipes Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('categorizeError', () => {
    it('should categorize HTTP 401 as auth error', () => {
      const response = new MockResponse('Unauthorized', { status: 401, statusText: 'Unauthorized' });
      const error = categorizeError(response);

      expect(error.type).toBe('auth');
      expect(error.retryable).toBe(false);
      expect(error.actionType).toBe('login');
      expect(error.userMessage).toContain('session has expired');
    });

    it('should categorize HTTP 403 as permission error', () => {
      const response = new MockResponse('Forbidden', { status: 403, statusText: 'Forbidden' });
      const error = categorizeError(response);

      expect(error.type).toBe('permission');
      expect(error.retryable).toBe(false);
      expect(error.actionType).toBe('home');
      expect(error.userMessage).toContain('permission');
    });

    it('should categorize HTTP 404 as validation error', () => {
      const response = new MockResponse('Not Found', { status: 404, statusText: 'Not Found' });
      const error = categorizeError(response);

      expect(error.type).toBe('validation');
      expect(error.retryable).toBe(true);
      expect(error.actionType).toBe('refresh');
      expect(error.userMessage).toContain('deleted or are no longer accessible');
    });

    it('should categorize HTTP 500 as server error', () => {
      const response = new MockResponse('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
      const error = categorizeError(response);

      expect(error.type).toBe('server');
      expect(error.retryable).toBe(true);
      expect(error.actionType).toBe('retry');
      expect(error.userMessage).toContain('server is experiencing issues');
    });

    it('should categorize network errors correctly', () => {
      const networkError = new Error('fetch failed');
      const error = categorizeError(networkError);

      expect(error.type).toBe('network');
      expect(error.retryable).toBe(true);
      expect(error.actionType).toBe('retry');
      expect(error.userMessage).toContain('connection');
    });

    it('should categorize authentication errors correctly', () => {
      const authError = new Error('Authentication required');
      const error = categorizeError(authError);

      expect(error.type).toBe('auth');
      expect(error.retryable).toBe(false);
      expect(error.actionType).toBe('login');
    });

    it('should include context information', () => {
      const context = {
        operation: 'fetchRecipes',
        userId: 'user123',
        timestamp: Date.now(),
      };
      const error = categorizeError(new Error('Test error'), context);

      expect(error.context).toEqual(context);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');
      
      const promise = withRetry(operation, { maxRetries: 2, baseDelay: 100 });
      
      // Fast-forward timers to complete retries
      await jest.advanceTimersByTimeAsync(5000);
      
      const result = await promise;
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-retryable errors', async () => {
      const authResponse = new MockResponse('Unauthorized', { status: 401 });
      const operation = jest.fn().mockRejectedValue(authResponse);
      
      await expect(withRetry(operation)).rejects.toBe(authResponse);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect max retry limit', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('network error'));
      
      const promise = withRetry(operation, { maxRetries: 2, baseDelay: 100 });
      
      // Fast-forward timers
      await jest.advanceTimersByTimeAsync(10000);
      
      await expect(promise).rejects.toThrow('network error');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('fetchWithRetry', () => {
    it('should make successful request', async () => {
      const mockResponse = new MockResponse('{"data": "test"}', { status: 200 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const response = await fetchWithRetry('/api/test');
      
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
    });

    it('should throw on non-ok response', async () => {
      const mockResponse = new MockResponse('Error', { status: 500 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      const promise = fetchWithRetry('/api/test');
      
      // Fast-forward timers for retries
      await jest.advanceTimersByTimeAsync(10000);
      
      await expect(promise).rejects.toBe(mockResponse);
    });

    it('should include timeout signal', async () => {
      const mockResponse = new MockResponse('{"data": "test"}', { status: 200 });
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      
      await fetchWithRetry('/api/test');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        signal: expect.any(AbortSignal),
      }));
    });
  });

  describe('isRecipeAccessibilityError', () => {
    it('should identify validation errors as accessibility errors', () => {
      const error = categorizeError(new MockResponse('Not Found', { status: 404 }));
      expect(isRecipeAccessibilityError(error)).toBe(true);
    });

    it('should identify deleted recipe errors', () => {
      const error = categorizeError(new Error('Recipe deleted'));
      expect(isRecipeAccessibilityError(error)).toBe(true);
    });

    it('should not identify network errors as accessibility errors', () => {
      const error = categorizeError(new Error('fetch failed'));
      expect(isRecipeAccessibilityError(error)).toBe(false);
    });
  });

  describe('getGracefulDegradationStrategy', () => {
    it('should provide network error degradation strategy', () => {
      const error = categorizeError(new Error('fetch failed'));
      const strategy = getGracefulDegradationStrategy(error);

      expect(strategy.showPartialResults).toBe(true);
      expect(strategy.disableFeatures).toContain('search');
      expect(strategy.disableFeatures).toContain('pagination');
      expect(strategy.fallbackMessage).toContain('connection issues');
    });

    it('should provide server error degradation strategy', () => {
      const error = categorizeError(new MockResponse('Server Error', { status: 500 }));
      const strategy = getGracefulDegradationStrategy(error);

      expect(strategy.showPartialResults).toBe(true);
      expect(strategy.disableFeatures).toContain('search');
      expect(strategy.fallbackMessage).toContain('temporarily unavailable');
    });

    it('should provide validation error degradation strategy', () => {
      const error = categorizeError(new MockResponse('Not Found', { status: 404 }));
      const strategy = getGracefulDegradationStrategy(error);

      expect(strategy.showPartialResults).toBe(true);
      expect(strategy.disableFeatures).toHaveLength(0);
      expect(strategy.fallbackMessage).toContain('data issues');
    });

    it('should not show partial results for unknown errors', () => {
      const error = categorizeError(new Error('Unknown error'));
      const strategy = getGracefulDegradationStrategy(error);

      expect(strategy.showPartialResults).toBe(false);
    });
  });
});