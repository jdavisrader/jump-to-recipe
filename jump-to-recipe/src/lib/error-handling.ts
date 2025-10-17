import { toast } from "@/components/ui/use-toast";

export interface ApiError extends Error {
  status?: number;
  field?: string;
}

export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Retry a network request with exponential backoff
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) except for 408, 429
      if (error instanceof NetworkError) {
        const status = error.status;
        if (status && status >= 400 && status < 500 && status !== 408 && status !== 429) {
          throw error;
        }
      }

      // Don't retry on validation or authentication errors
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Enhanced fetch wrapper with error handling
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle different response statuses
    if (!response.ok) {
      let errorData: { error?: string; field?: string } = {};
      
      try {
        errorData = await response.json();
      } catch {
        // If response is not JSON, use status text
        errorData = { error: response.statusText };
      }

      // Create appropriate error types
      if (response.status === 401) {
        throw new AuthenticationError(errorData.error || 'Authentication required');
      }

      if (response.status === 400 && errorData.field) {
        throw new ValidationError(errorData.error || 'Validation failed', errorData.field);
      }

      throw new NetworkError(
        errorData.error || `Request failed with status ${response.status}`,
        response.status
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return {} as T;
  } catch (error) {
    // Network errors (no response received)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network error. Please check your connection and try again.');
    }

    // Re-throw our custom errors
    if (error instanceof NetworkError || error instanceof ValidationError || error instanceof AuthenticationError) {
      throw error;
    }

    // Unknown errors
    throw new NetworkError('An unexpected error occurred. Please try again.');
  }
}

/**
 * Handle API errors with appropriate user feedback
 */
export function handleApiError(error: Error, context?: string) {
  console.error(`API Error${context ? ` (${context})` : ''}:`, error);

  if (error instanceof AuthenticationError) {
    toast({
      title: "Authentication Required",
      description: "Please log in to continue.",
      variant: "destructive",
    });
    
    // Redirect to login page
    window.location.href = '/auth/login';
    return;
  }

  if (error instanceof ValidationError) {
    // Validation errors should be handled by the form component
    // This is a fallback for unhandled validation errors
    toast({
      title: "Validation Error",
      description: error.message,
      variant: "destructive",
    });
    return;
  }

  if (error instanceof NetworkError) {
    const isNetworkIssue = error.message.includes('Network error') || error.message.includes('fetch');
    
    toast({
      title: isNetworkIssue ? "Connection Error" : "Request Failed",
      description: error.message,
      variant: "destructive",
    });
    return;
  }

  // Fallback for unknown errors
  toast({
    title: "Unexpected Error",
    description: "Something went wrong. Please try again.",
    variant: "destructive",
  });
}

/**
 * Validate form field and return error message if invalid
 */
export function validateField(value: string, rules: {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
}): string | null {
  if (rules.required && (!value || value.trim().length === 0)) {
    return 'This field is required';
  }

  if (value && rules.minLength && value.length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`;
  }

  if (value && rules.maxLength && value.length > rules.maxLength) {
    return `Must be no more than ${rules.maxLength} characters`;
  }

  if (value && rules.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    return 'Please enter a valid value';
  }

  return null;
}

/**
 * Debounce function for input validation
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}