/**
 * Network connectivity utilities for enhanced error handling
 */

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'fast' | 'slow' | 'offline';
  lastChecked: number;
}

/**
 * Checks if the browser is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') {
    return true; // Assume online on server
  }
  return navigator.onLine;
}

/**
 * Estimates connection speed based on navigator.connection API
 */
export function getConnectionType(): 'fast' | 'slow' | 'offline' {
  if (typeof window === 'undefined') {
    return 'fast'; // Assume fast on server
  }

  if (!navigator.onLine) {
    return 'offline';
  }

  // Use Network Information API if available
  const connection = (navigator as { connection?: { effectiveType?: string; downlink?: number } }).connection || 
                    (navigator as { mozConnection?: { effectiveType?: string; downlink?: number } }).mozConnection || 
                    (navigator as { webkitConnection?: { effectiveType?: string; downlink?: number } }).webkitConnection;
  
  if (connection) {
    const { effectiveType, downlink } = connection;
    
    // Check downlink speed (Mbps)
    if (downlink && downlink < 1) {
      return 'slow';
    }
    
    // Check effective connection type
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      return 'slow';
    }
  }

  return 'fast';
}

/**
 * Gets current network status
 */
export function getNetworkStatus(): NetworkStatus {
  return {
    isOnline: isOnline(),
    connectionType: getConnectionType(),
    lastChecked: Date.now(),
  };
}

/**
 * Performs a lightweight connectivity test
 */
export async function testConnectivity(timeout = 5000): Promise<boolean> {
  if (typeof window === 'undefined') {
    return true; // Assume connected on server
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('/api/health', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-cache',
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Sets up network status monitoring
 */
export function setupNetworkMonitoring(
  onStatusChange: (status: NetworkStatus) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op on server
  }

  let currentStatus = getNetworkStatus();
  
  const handleOnline = () => {
    const newStatus = getNetworkStatus();
    if (newStatus.isOnline !== currentStatus.isOnline) {
      currentStatus = newStatus;
      onStatusChange(newStatus);
    }
  };

  const handleOffline = () => {
    const newStatus = getNetworkStatus();
    if (newStatus.isOnline !== currentStatus.isOnline) {
      currentStatus = newStatus;
      onStatusChange(newStatus);
    }
  };

  // Listen for online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Listen for connection changes if supported
  const connection = (navigator as { connection?: EventTarget & { effectiveType?: string; downlink?: number } }).connection || 
                    (navigator as { mozConnection?: EventTarget & { effectiveType?: string; downlink?: number } }).mozConnection || 
                    (navigator as { webkitConnection?: EventTarget & { effectiveType?: string; downlink?: number } }).webkitConnection;
  if (connection) {
    const handleConnectionChange = () => {
      const newStatus = getNetworkStatus();
      if (newStatus.connectionType !== currentStatus.connectionType) {
        currentStatus = newStatus;
        onStatusChange(newStatus);
      }
    };
    
    connection.addEventListener('change', handleConnectionChange);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      connection.removeEventListener('change', handleConnectionChange);
    };
  }

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Adjusts retry configuration based on network conditions
 */
export function getNetworkAwareRetryConfig(baseConfig: {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}) {
  const networkStatus = getNetworkStatus();
  
  if (!networkStatus.isOnline) {
    return {
      ...baseConfig,
      maxRetries: 0, // Don't retry if offline
    };
  }
  
  if (networkStatus.connectionType === 'slow') {
    return {
      ...baseConfig,
      maxRetries: Math.max(1, baseConfig.maxRetries - 1), // Fewer retries on slow connections
      baseDelay: baseConfig.baseDelay * 2, // Longer delays
      maxDelay: baseConfig.maxDelay * 2,
    };
  }
  
  return baseConfig;
}