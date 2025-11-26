/**
 * Retry mechanism for photo uploads with exponential backoff
 * Handles network errors and provides user feedback
 */

import { retryRequest, NetworkError } from '@/lib/error-handling';
import { getNetworkStatus, testConnectivity } from '@/lib/network-utils';

export interface UploadRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  onRetry?: (attempt: number, error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  data?: unknown;
  error?: string;
  attempts: number;
}

const DEFAULT_RETRY_CONFIG: UploadRetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

/**
 * Uploads a photo with retry logic
 */
export async function uploadPhotoWithRetry(
  recipeId: string,
  file: File,
  config: Partial<UploadRetryConfig> = {}
): Promise<UploadResult> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let attempts = 0;

  const uploadFn = async () => {
    attempts++;

    // Check network connectivity before attempting upload
    const networkStatus = getNetworkStatus();
    if (!networkStatus.isOnline) {
      throw new NetworkError('No internet connection. Please check your network and try again.');
    }

    // Warn about slow connection
    if (networkStatus.connectionType === 'slow' && config.onRetry) {
      config.onRetry(attempts, new Error('Slow connection detected'));
    }

    const formData = new FormData();
    formData.append('photos', file);

    const response = await fetch(`/api/recipes/${recipeId}/photos`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      
      // Don't retry on client errors (except rate limiting)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new NetworkError(errorData.error || 'Upload failed', response.status);
      }

      throw new NetworkError(
        errorData.error || `Upload failed with status ${response.status}`,
        response.status
      );
    }

    return await response.json();
  };

  try {
    const result = await retryRequest(
      uploadFn,
      finalConfig.maxRetries,
      finalConfig.baseDelay
    );

    return {
      success: true,
      data: result,
      attempts,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      attempts,
    };
  }
}

/**
 * Uploads multiple photos with retry logic and progress tracking
 */
export async function uploadPhotosWithRetry(
  recipeId: string,
  files: File[],
  config: Partial<UploadRetryConfig> = {}
): Promise<{
  successful: Array<{ file: File; data: unknown }>;
  failed: Array<{ file: File; error: string }>;
  totalAttempts: number;
}> {
  const successful: Array<{ file: File; data: unknown }> = [];
  const failed: Array<{ file: File; error: string }> = [];
  let totalAttempts = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Report progress
    if (config.onProgress) {
      config.onProgress((i / files.length) * 100);
    }

    const result = await uploadPhotoWithRetry(recipeId, file, config);
    totalAttempts += result.attempts;

    if (result.success && result.data) {
      successful.push({ file, data: result.data });
    } else {
      failed.push({ file, error: result.error || 'Upload failed' });
    }
  }

  // Report completion
  if (config.onProgress) {
    config.onProgress(100);
  }

  return {
    successful,
    failed,
    totalAttempts,
  };
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof NetworkError) {
    const status = error.status;
    
    // Retry on server errors (5xx) and rate limiting (429)
    if (status && (status >= 500 || status === 429 || status === 408)) {
      return true;
    }
    
    // Retry on network errors (no status)
    if (!status) {
      return true;
    }
    
    return false;
  }

  // Retry on generic network errors
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return true;
  }

  return false;
}

/**
 * Gets retry delay based on attempt number and network conditions
 */
export function getRetryDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number
): number {
  const networkStatus = getNetworkStatus();
  
  // Calculate exponential backoff
  let delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  
  // Adjust for slow connections
  if (networkStatus.connectionType === 'slow') {
    delay *= 1.5;
  }
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  
  return Math.floor(delay + jitter);
}

/**
 * Pre-flight check before uploading photos
 */
export async function preflightPhotoUpload(): Promise<{
  canUpload: boolean;
  reason?: string;
}> {
  // Check network connectivity
  const networkStatus = getNetworkStatus();
  if (!networkStatus.isOnline) {
    return {
      canUpload: false,
      reason: 'No internet connection',
    };
  }

  // Test actual connectivity
  const isConnected = await testConnectivity(3000);
  if (!isConnected) {
    return {
      canUpload: false,
      reason: 'Cannot reach server. Please check your connection.',
    };
  }

  // Warn about slow connection but allow upload
  if (networkStatus.connectionType === 'slow') {
    return {
      canUpload: true,
      reason: 'Slow connection detected. Upload may take longer.',
    };
  }

  return {
    canUpload: true,
  };
}
