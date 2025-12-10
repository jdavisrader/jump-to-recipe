/**
 * API retry logic with exponential backoff
 */

import { getNetworkAwareRetryConfig, isOnline } from './network-utils';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number, delay: number) => void;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: Error): boolean {
  // Network errors are retryable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // Check for specific HTTP status codes that are retryable
  if ('status' in error) {
    const status = (error as { status: number }).status;
    // Retry on 408 (Request Timeout), 429 (Too Many Requests), 500+ (Server Errors)
    return status === 408 || status === 429 || status >= 500;
  }

  return false;
}

/**
 * Calculates exponential backoff delay with jitter
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  
  // Add jitter (random value between 0 and 25% of delay)
  const jitter = Math.random() * exponentialDelay * 0.25;
  
  // Cap at maxDelay
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Sleeps for the specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wraps a fetch request with retry logic
 */
export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  // Merge with default config first
  const mergedConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...retryConfig,
  };
  
  // Apply network-aware adjustments
  const networkConfig = getNetworkAwareRetryConfig({
    maxRetries: mergedConfig.maxRetries,
    baseDelay: mergedConfig.baseDelay,
    maxDelay: mergedConfig.maxDelay,
  });
  
  // Final config with all properties
  const config: RetryConfig = {
    ...networkConfig,
    shouldRetry: mergedConfig.shouldRetry,
    onRetry: mergedConfig.onRetry,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Check if online before attempting
      if (!isOnline()) {
        throw new Error('No internet connection');
      }

      const response = await fetch(url, options);

      // If response is not ok, throw an error with status
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`) as Error & { status: number };
        error.status = response.status;
        throw error;
      }

      // Parse and return response
      const data = await response.json();
      return data as T;
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const shouldRetry = config.shouldRetry
        ? config.shouldRetry(lastError, attempt)
        : isRetryableError(lastError);

      // If this is the last attempt or error is not retryable, throw
      if (attempt >= config.maxRetries || !shouldRetry) {
        throw lastError;
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay);
      
      // Call onRetry callback if provided
      if (config.onRetry) {
        config.onRetry(lastError, attempt + 1, delay);
      }

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Unknown error occurred');
}

/**
 * Wraps any async function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  // Merge with default config first
  const mergedConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...retryConfig,
  };
  
  // Apply network-aware adjustments
  const networkConfig = getNetworkAwareRetryConfig({
    maxRetries: mergedConfig.maxRetries,
    baseDelay: mergedConfig.baseDelay,
    maxDelay: mergedConfig.maxDelay,
  });
  
  // Final config with all properties
  const config: RetryConfig = {
    ...networkConfig,
    shouldRetry: mergedConfig.shouldRetry,
    onRetry: mergedConfig.onRetry,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      const shouldRetry = config.shouldRetry
        ? config.shouldRetry(lastError, attempt)
        : isRetryableError(lastError);

      // If this is the last attempt or error is not retryable, throw
      if (attempt >= config.maxRetries || !shouldRetry) {
        throw lastError;
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt, config.baseDelay, config.maxDelay);
      
      // Call onRetry callback if provided
      if (config.onRetry) {
        config.onRetry(lastError, attempt + 1, delay);
      }

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Unknown error occurred');
}

/**
 * Creates a fetch function with retry logic pre-configured
 */
export function createRetryFetch(retryConfig?: Partial<RetryConfig>) {
  return async <T>(url: string, options?: RequestInit): Promise<T> => {
    return fetchWithRetry<T>(url, options, retryConfig);
  };
}
