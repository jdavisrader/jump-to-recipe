/**
 * Error types and classification for migration system
 */

export type ErrorCategory =
  | 'SSH_CONNECTION'
  | 'DATABASE_CONNECTION'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'IMPORT_ERROR'
  | 'NETWORK_ERROR'
  | 'FILE_SYSTEM_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'UNKNOWN_ERROR';

export type MigrationPhase = 'extract' | 'transform' | 'validate' | 'import';

export interface ErrorMetadata {
  recordId?: number | string;
  recordTitle?: string;
  attemptNumber?: number;
  originalError?: Error;
  context?: Record<string, any>;
}

/**
 * Custom error class for migration operations
 */
export class MigrationError extends Error {
  public readonly category: ErrorCategory;
  public readonly phase: MigrationPhase;
  public readonly retryable: boolean;
  public readonly metadata: ErrorMetadata;
  public readonly timestamp: Date;

  constructor(
    message: string,
    category: ErrorCategory,
    phase: MigrationPhase,
    retryable: boolean = false,
    metadata: ErrorMetadata = {}
  ) {
    super(message);
    this.name = 'MigrationError';
    this.category = category;
    this.phase = phase;
    this.retryable = retryable;
    this.metadata = metadata;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MigrationError);
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      phase: this.phase,
      retryable: this.retryable,
      metadata: this.metadata,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

/**
 * Categorize a generic error into a MigrationError
 */
export function categorizeError(
  error: Error | unknown,
  phase: MigrationPhase,
  metadata: ErrorMetadata = {}
): MigrationError {
  // If already a MigrationError, return as-is
  if (error instanceof MigrationError) {
    return error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const originalError = error instanceof Error ? error : undefined;

  // Categorize based on error message patterns
  let category: ErrorCategory = 'UNKNOWN_ERROR';
  let retryable = false;

  // SSH connection errors
  if (
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('SSH') ||
    errorMessage.includes('tunnel') ||
    errorMessage.includes('authentication failed')
  ) {
    category = 'SSH_CONNECTION';
    retryable = true;
  }
  // Database connection errors
  else if (
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('database') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('timeout')
  ) {
    category = 'DATABASE_CONNECTION';
    retryable = true;
  }
  // Network errors (5xx)
  else if (
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503') ||
    errorMessage.includes('504') ||
    errorMessage.includes('network') ||
    errorMessage.includes('ENOTFOUND')
  ) {
    category = 'NETWORK_ERROR';
    retryable = true;
  }
  // Validation errors (4xx)
  else if (
    errorMessage.includes('400') ||
    errorMessage.includes('401') ||
    errorMessage.includes('403') ||
    errorMessage.includes('404') ||
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid')
  ) {
    category = 'VALIDATION_ERROR';
    retryable = false;
  }
  // Parse errors
  else if (
    errorMessage.includes('parse') ||
    errorMessage.includes('JSON') ||
    errorMessage.includes('syntax')
  ) {
    category = 'PARSE_ERROR';
    retryable = false;
  }
  // File system errors
  else if (
    errorMessage.includes('ENOENT') ||
    errorMessage.includes('EACCES') ||
    errorMessage.includes('file') ||
    errorMessage.includes('directory')
  ) {
    category = 'FILE_SYSTEM_ERROR';
    retryable = false;
  }
  // Configuration errors
  else if (
    errorMessage.includes('config') ||
    errorMessage.includes('environment') ||
    errorMessage.includes('missing required')
  ) {
    category = 'CONFIGURATION_ERROR';
    retryable = false;
  }
  // Import errors
  else if (errorMessage.includes('import') || errorMessage.includes('API')) {
    category = 'IMPORT_ERROR';
    retryable = errorMessage.includes('5') || errorMessage.includes('timeout');
  }

  return new MigrationError(errorMessage, category, phase, retryable, {
    ...metadata,
    originalError,
  });
}

/**
 * Get retry configuration for error category
 */
export function getRetryConfig(category: ErrorCategory): {
  maxRetries: number;
  initialDelay: number;
} {
  switch (category) {
    case 'SSH_CONNECTION':
      return { maxRetries: 3, initialDelay: 2000 }; // 2s, 4s, 8s
    case 'DATABASE_CONNECTION':
      return { maxRetries: 3, initialDelay: 1000 }; // 1s, 2s, 4s
    case 'NETWORK_ERROR':
      return { maxRetries: 3, initialDelay: 1000 }; // 1s, 2s, 4s
    case 'IMPORT_ERROR':
      return { maxRetries: 3, initialDelay: 500 }; // 0.5s, 1s, 2s
    case 'PARSE_ERROR':
    case 'VALIDATION_ERROR':
    case 'FILE_SYSTEM_ERROR':
    case 'CONFIGURATION_ERROR':
    case 'UNKNOWN_ERROR':
    default:
      return { maxRetries: 0, initialDelay: 0 }; // No retry
  }
}
