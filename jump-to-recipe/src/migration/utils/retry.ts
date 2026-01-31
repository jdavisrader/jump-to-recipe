/**
 * Retry mechanism with exponential backoff for migration operations
 */

import {
  MigrationError,
  categorizeError,
  getRetryConfig,
  type MigrationPhase,
  type ErrorMetadata,
} from '../types/errors';
import { logger } from './logger';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (error: MigrationError, attempt: number) => void;
}

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  phase: MigrationPhase,
  options: RetryOptions = {},
  metadata: ErrorMetadata = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: MigrationError | null = null;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Execute the function
      const result = await fn();
      
      // Log success if this was a retry
      if (attempt > 0) {
        logger.info('Operation succeeded after retry', {
          phase,
          attempt,
          metadata,
        });
      }
      
      return result;
    } catch (error) {
      // Categorize the error
      lastError = categorizeError(error, phase, {
        ...metadata,
        attemptNumber: attempt + 1,
      });

      // Check if we should retry
      if (!lastError.retryable || attempt >= maxRetries) {
        logger.error('Operation failed (not retryable or max retries reached)', {
          error: lastError.toJSON(),
          attempt: attempt + 1,
          maxRetries,
        });
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      logger.warn('Operation failed, retrying...', {
        error: lastError.toJSON(),
        attempt: attempt + 1,
        maxRetries,
        delayMs: delay,
      });

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      // Wait before retrying
      await sleep(delay);

      attempt++;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Execute a function with retry logic using error category-specific configuration
 */
export async function withAutoRetry<T>(
  fn: () => Promise<T>,
  phase: MigrationPhase,
  metadata: ErrorMetadata = {}
): Promise<T> {
  let lastError: MigrationError | null = null;

  try {
    return await fn();
  } catch (error) {
    // Categorize the error to get retry config
    lastError = categorizeError(error, phase, metadata);
    const retryConfig = getRetryConfig(lastError.category);

    // If not retryable, throw immediately
    if (!lastError.retryable || retryConfig.maxRetries === 0) {
      logger.error('Operation failed (not retryable)', {
        error: lastError.toJSON(),
      });
      throw lastError;
    }

    // Retry with category-specific configuration
    logger.info('Using auto-retry with category-specific config', {
      category: lastError.category,
      maxRetries: retryConfig.maxRetries,
      initialDelay: retryConfig.initialDelay,
    });

    return await withRetry(fn, phase, retryConfig, metadata);
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a batch operation with individual item retry
 */
export async function withBatchRetry<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  phase: MigrationPhase,
  options: RetryOptions = {}
): Promise<Array<{ item: T; result?: R; error?: MigrationError }>> {
  const results: Array<{ item: T; result?: R; error?: MigrationError }> = [];

  for (const item of items) {
    try {
      const result = await withRetry(
        () => fn(item),
        phase,
        options,
        { context: { item } }
      );
      results.push({ item, result });
    } catch (error) {
      const migrationError =
        error instanceof MigrationError
          ? error
          : categorizeError(error, phase, { context: { item } });
      results.push({ item, error: migrationError });
    }
  }

  return results;
}

/**
 * Execute multiple operations in parallel with retry
 */
export async function withParallelRetry<T>(
  operations: Array<() => Promise<T>>,
  phase: MigrationPhase,
  options: RetryOptions = {},
  concurrency: number = 5
): Promise<Array<{ result?: T; error?: MigrationError }>> {
  const results: Array<{ result?: T; error?: MigrationError }> = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];

    const promise = (async () => {
      try {
        const result = await withRetry(
          operation,
          phase,
          options,
          { context: { operationIndex: i } }
        );
        results[i] = { result };
      } catch (error) {
        const migrationError =
          error instanceof MigrationError
            ? error
            : categorizeError(error, phase, { context: { operationIndex: i } });
        results[i] = { error: migrationError };
      }
    })();

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
