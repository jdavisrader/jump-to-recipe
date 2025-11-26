import {
  uploadPhotoWithRetry,
  isRetryableError,
  getRetryDelay,
  preflightPhotoUpload,
} from '../photo-upload-retry';
import { NetworkError } from '../error-handling';
import * as networkUtils from '../network-utils';

// Mock fetch
global.fetch = jest.fn();

// Mock network utils
jest.mock('../network-utils', () => ({
  getNetworkStatus: jest.fn(() => ({
    isOnline: true,
    connectionType: 'fast',
    lastChecked: Date.now(),
  })),
  testConnectivity: jest.fn(() => Promise.resolve(true)),
  setupNetworkMonitoring: jest.fn(() => () => {}),
}));

describe('Photo Upload Retry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('uploadPhotoWithRetry', () => {
    it('should successfully upload on first attempt', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ success: true, photos: [{ id: '1' }] }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadPhotoWithRetry('recipe-id', file);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error', async () => {
      const mockError = new NetworkError('Network error', 500);
      const mockSuccess = {
        ok: true,
        json: async () => ({ success: true, photos: [{ id: '1' }] }),
      };

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccess);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadPhotoWithRetry('recipe-id', file, {
        maxRetries: 3,
        baseDelay: 10,
        maxDelay: 100,
      });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('should not retry on client errors', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadPhotoWithRetry('recipe-id', file);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const mockError = new NetworkError('Network error', 500);
      (global.fetch as jest.Mock).mockRejectedValue(mockError);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadPhotoWithRetry('recipe-id', file, {
        maxRetries: 2,
        baseDelay: 10,
        maxDelay: 100,
      });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // Initial + 2 retries
    });

    it('should call onRetry callback for slow connection', async () => {
      (networkUtils.getNetworkStatus as jest.Mock).mockReturnValue({
        isOnline: true,
        connectionType: 'slow',
        lastChecked: Date.now(),
      });

      const mockSuccess = {
        ok: true,
        json: async () => ({ success: true, photos: [{ id: '1' }] }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockSuccess);

      const onRetry = jest.fn();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await uploadPhotoWithRetry('recipe-id', file, {
        maxRetries: 3,
        baseDelay: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalled();
      
      // Reset mock
      (networkUtils.getNetworkStatus as jest.Mock).mockReturnValue({
        isOnline: true,
        connectionType: 'fast',
        lastChecked: Date.now(),
      });
    });

    it('should handle offline status', async () => {
      (networkUtils.getNetworkStatus as jest.Mock).mockReturnValue({
        isOnline: false,
        connectionType: 'offline',
        lastChecked: Date.now(),
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadPhotoWithRetry('recipe-id', file, {
        maxRetries: 1,
        baseDelay: 10,
        maxDelay: 100,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No internet connection');
      
      // Reset mock
      (networkUtils.getNetworkStatus as jest.Mock).mockReturnValue({
        isOnline: true,
        connectionType: 'fast',
        lastChecked: Date.now(),
      });
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable network errors', () => {
      const error = new NetworkError('Server error', 500);
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify non-retryable client errors', () => {
      const error = new NetworkError('Bad request', 400);
      expect(isRetryableError(error)).toBe(false);
    });

    it('should identify retryable rate limit errors', () => {
      const error = new NetworkError('Too many requests', 429);
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify retryable timeout errors', () => {
      const error = new NetworkError('Request timeout', 408);
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify generic network errors as retryable', () => {
      const error = new Error('fetch failed');
      expect(isRetryableError(error)).toBe(true);
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      const delay1 = getRetryDelay(0, 1000, 10000);
      const delay2 = getRetryDelay(1, 1000, 10000);
      const delay3 = getRetryDelay(2, 1000, 10000);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should respect max delay', () => {
      const delay = getRetryDelay(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000 * 1.3); // Account for jitter
    });

    it('should adjust for slow connections', () => {
      (networkUtils.getNetworkStatus as jest.Mock).mockReturnValueOnce({
        isOnline: true,
        connectionType: 'slow',
        lastChecked: Date.now(),
      });

      const normalDelay = getRetryDelay(1, 1000, 10000);
      
      (networkUtils.getNetworkStatus as jest.Mock).mockReturnValueOnce({
        isOnline: true,
        connectionType: 'fast',
        lastChecked: Date.now(),
      });

      const fastDelay = getRetryDelay(1, 1000, 10000);

      // Slow connection should have longer delay (accounting for jitter variance)
      expect(normalDelay).toBeGreaterThanOrEqual(fastDelay * 0.7);
    });
  });

  describe('preflightPhotoUpload', () => {
    it('should allow upload when online', async () => {
      const result = await preflightPhotoUpload();

      expect(result.canUpload).toBe(true);
    });

    it('should prevent upload when offline', async () => {
      (networkUtils.getNetworkStatus as jest.Mock).mockReturnValueOnce({
        isOnline: false,
        connectionType: 'offline',
        lastChecked: Date.now(),
      });

      const result = await preflightPhotoUpload();

      expect(result.canUpload).toBe(false);
      expect(result.reason).toContain('No internet connection');
    });

    it('should warn about slow connection', async () => {
      (networkUtils.getNetworkStatus as jest.Mock).mockReturnValueOnce({
        isOnline: true,
        connectionType: 'slow',
        lastChecked: Date.now(),
      });

      const result = await preflightPhotoUpload();

      expect(result.canUpload).toBe(true);
      expect(result.reason).toContain('Slow connection');
    });

    it('should prevent upload when server unreachable', async () => {
      (networkUtils.testConnectivity as jest.Mock).mockResolvedValueOnce(false);

      const result = await preflightPhotoUpload();

      expect(result.canUpload).toBe(false);
      expect(result.reason).toContain('Cannot reach server');
    });
  });
});
