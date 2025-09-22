/**
 * Enhanced error handling utilities for My Recipes feature
 * Provides comprehensive error handling, retry mechanisms, and graceful degradation
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface ErrorContext {
  operation?: string;
  userId?: string;
  searchParams?: Record<string, any>;
  timestamp: number;
}

export interface MyRecipesError {
  type: 'network' | 'auth' | 'permission' | 'validation' | 'server' | 'unknown';
  message: string;
  originalError?: Error;
  context?: ErrorContext;
  retryable: boolean;
  userMessage: string;
  actionLabel?: string;
  actionType?: 'retry' | 'login' | 'refresh' | 'home';
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Categorizes and enriches errors with user-friendly information
 */
export function categorizeError(error: unknown, context?: ErrorContext): MyRecipesError {
  const timestamp = Date.now();
  const errorContext = { ...context, timestamp };

  // Handle Response errors (fetch API)
  if (error instanceof Response) {
    switch (error.status) {
      case 401:
        return {
          type: 'auth',
          message: 'Authentication failed',
          originalError: new Error(`HTTP ${error.status}: ${error.statusText}`),
          context: errorContext,
          retryable: false,
          userMessage: 'Your session has expired. Please log in again.',
          actionLabel: 'Log In',
          actionType: 'login',
        };
      
      case 403:
        return {
          type: 'permission',
          message: 'Access denied',
          originalError: new Error(`HTTP ${error.status}: ${error.statusText}`),
          context: errorContext,
          retryable: false,
          userMessage: 'You do not have permission to access these recipes.',
          actionLabel: 'Go Home',
          actionType: 'home',
        };
      
      case 404:
        return {
          type: 'validation',
          message: 'Recipes not found',
          originalError: new Error(`HTTP ${error.status}: ${error.statusText}`),
          context: errorContext,
          retryable: true,
          userMessage: 'Some recipes may have been deleted or are no longer accessible.',
          actionLabel: 'Refresh',
          actionType: 'refresh',
        };
      
      case 429:
        return {
          type: 'server',
          message: 'Rate limit exceeded',
          originalError: new Error(`HTTP ${error.status}: ${error.statusText}`),
          context: errorContext,
          retryable: true,
          userMessage: 'Too many requests. Please wait a moment and try again.',
          actionLabel: 'Try Again',
          actionType: 'retry',
        };
      
      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: 'server',
          message: 'Server error',
          originalError: new Error(`HTTP ${error.status}: ${error.statusText}`),
          context: errorContext,
          retryable: true,
          userMessage: 'The server is experiencing issues. Please try again in a moment.',
          actionLabel: 'Try Again',
          actionType: 'retry',
        };
      
      default:
        return {
          type: 'server',
          message: `HTTP error ${error.status}`,
          originalError: new Error(`HTTP ${error.status}: ${error.statusText}`),
          context: errorContext,
          retryable: error.status >= 500,
          userMessage: 'An unexpected error occurred. Please try again.',
          actionLabel: 'Try Again',
          actionType: 'retry',
        };
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return {
        type: 'network',
        message: 'Network error',
        originalError: error,
        context: errorContext,
        retryable: true,
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        actionLabel: 'Try Again',
        actionType: 'retry',
      };
    }
    
    // Authentication errors
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('session')) {
      return {
        type: 'auth',
        message: 'Authentication error',
        originalError: error,
        context: errorContext,
        retryable: false,
        userMessage: 'Your session has expired. Please log in again.',
        actionLabel: 'Log In',
        actionType: 'login',
      };
    }
    
    // Permission errors
    if (message.includes('permission') || message.includes('forbidden') || message.includes('access')) {
      return {
        type: 'permission',
        message: 'Permission error',
        originalError: error,
        context: errorContext,
        retryable: false,
        userMessage: 'You do not have permission to access these recipes.',
        actionLabel: 'Go Home',
        actionType: 'home',
      };
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        type: 'validation',
        message: 'Validation error',
        originalError: error,
        context: errorContext,
        retryable: false,
        userMessage: 'There was an issue with your request. Please try adjusting your search.',
        actionLabel: 'Refresh',
        actionType: 'refresh',
      };
    }
    
    // Generic error
    return {
      type: 'unknown',
      message: error.message,
      originalError: error,
      context: errorContext,
      retryable: true,
      userMessage: 'An unexpected error occurred. Please try again.',
      actionLabel: 'Try Again',
      actionType: 'retry',
    };
  }

  // Handle unknown error types
  return {
    type: 'unknown',
    message: 'Unknown error',
    originalError: error instanceof Error ? error : new Error(String(error)),
    context: errorContext,
    retryable: true,
    userMessage: 'An unexpected error occurred. Please try again.',
    actionLabel: 'Try Again',
    actionType: 'retry',
  };
}

/**
 * Implements exponential backoff retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: ErrorContext
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const categorizedError = categorizeError(error, context);
      if (!categorizedError.retryable || attempt === retryConfig.maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
        retryConfig.maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      console.warn(`Retry attempt ${attempt + 1}/${retryConfig.maxRetries} after ${jitteredDelay}ms`, {
        error: categorizedError,
        context,
      });
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  throw lastError;
}

/**
 * Enhanced fetch wrapper with automatic retry and error handling
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig?: Partial<RetryConfig>,
  context?: ErrorContext
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, {
      ...options,
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    if (!response.ok) {
      throw response;
    }
    
    return response;
  }, retryConfig, context);
}

/**
 * Logs errors for monitoring and debugging
 */
export function logError(error: MyRecipesError): void {
  const logData = {
    type: error.type,
    message: error.message,
    context: error.context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
  };
  
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('My Recipes Error:', logData, error.originalError);
  }
  
  // In production, you would send this to your error monitoring service
  // Example: Sentry, LogRocket, DataDog, etc.
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with error monitoring service
    console.error('Production error logged:', logData);
  }
}

/**
 * Checks if the current error indicates deleted or inaccessible recipes
 */
export function isRecipeAccessibilityError(error: MyRecipesError): boolean {
  return (
    error.type === 'validation' ||
    (error.type === 'server' && error.originalError?.message.includes('404')) ||
    error.message.toLowerCase().includes('not found') ||
    error.message.toLowerCase().includes('deleted') ||
    error.message.toLowerCase().includes('inaccessible')
  );
}

/**
 * Provides graceful degradation strategies for different error types
 */
export function getGracefulDegradationStrategy(error: MyRecipesError): {
  showPartialResults: boolean;
  disableFeatures: string[];
  fallbackMessage: string;
} {
  switch (error.type) {
    case 'network':
      return {
        showPartialResults: true,
        disableFeatures: ['search', 'pagination'],
        fallbackMessage: 'Some features are temporarily unavailable due to connection issues.',
      };
    
    case 'server':
      return {
        showPartialResults: true,
        disableFeatures: ['search'],
        fallbackMessage: 'Search is temporarily unavailable. Showing cached results.',
      };
    
    case 'validation':
      return {
        showPartialResults: true,
        disableFeatures: [],
        fallbackMessage: 'Some recipes may not be displayed due to data issues.',
      };
    
    default:
      return {
        showPartialResults: false,
        disableFeatures: [],
        fallbackMessage: 'Unable to load recipes at this time.',
      };
  }
}