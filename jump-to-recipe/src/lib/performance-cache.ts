/**
 * Performance optimization utilities for caching and memoization
 */

import { unstable_cache } from 'next/cache';

/**
 * Cache configuration for different data types
 */
export const CACHE_CONFIG = {
  // Admin recipe list - updates frequently but can be cached briefly
  ADMIN_RECIPES: {
    revalidate: 60, // 1 minute
    tags: ['admin-recipes', 'recipes', 'users'] as string[],
  },
  
  // User list for admin operations - changes less frequently
  ADMIN_USERS: {
    revalidate: 300, // 5 minutes
    tags: ['admin-users', 'users'] as string[],
  },
  
  // Recipe details - can be cached longer
  RECIPE_DETAILS: {
    revalidate: 300, // 5 minutes
    tags: ['recipes'] as string[],
  },
  
  // Recipe photos - rarely change
  RECIPE_PHOTOS: {
    revalidate: 600, // 10 minutes
    tags: ['recipe-photos'] as string[],
  },
};

/**
 * Create a cached version of a database query function
 */
export function createCachedQuery<T extends any[], R>(
  queryFn: (...args: T) => Promise<R>,
  cacheKey: string,
  config: { revalidate: number; tags: string[] }
) {
  return unstable_cache(queryFn, [cacheKey], config);
}

/**
 * Cache invalidation utilities
 */
export const cacheInvalidation = {
  /**
   * Invalidate recipe-related caches when a recipe is updated
   */
  invalidateRecipeCaches: async (recipeId?: string) => {
    // In a real implementation, you would use revalidateTag from next/cache
    // For now, we document the tags that should be invalidated
    const tagsToInvalidate = [
      'recipes',
      'admin-recipes',
      ...(recipeId ? [`recipe-${recipeId}`] : []),
    ];
    
    console.log('Cache invalidation needed for tags:', tagsToInvalidate);
    // TODO: Implement actual cache invalidation when Next.js provides the API
  },
  
  /**
   * Invalidate user-related caches when a user is updated
   */
  invalidateUserCaches: async (userId?: string) => {
    const tagsToInvalidate = [
      'users',
      'admin-users',
      'admin-recipes', // Because recipes include author info
      ...(userId ? [`user-${userId}`] : []),
    ];
    
    console.log('Cache invalidation needed for tags:', tagsToInvalidate);
    // TODO: Implement actual cache invalidation when Next.js provides the API
  },
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  /**
   * Measure and log query performance
   */
  async measureQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log slow queries (> 1 second)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`);
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`Query ${queryName} completed in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`Query ${queryName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },
  
  /**
   * Create a performance-monitored version of a function
   */
  withMonitoring<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    name: string
  ) {
    return async (...args: T): Promise<R> => {
      return this.measureQuery(name, () => fn(...args));
    };
  },
};

/**
 * Client-side cache for component state
 */
export class ComponentCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;
  
  constructor(ttlMs: number = 5 * 60 * 1000) { // Default 5 minutes
    this.ttl = ttlMs;
  }
  
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
}

/**
 * Debounced function utility for client-side performance
 */
export function createDebouncedFunction<T extends any[]>(
  fn: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Memoization utility for expensive computations
 */
export function memoize<T extends any[], R>(
  fn: (...args: T) => R,
  keyFn?: (...args: T) => string
): (...args: T) => R {
  const cache = new Map<string, R>();
  
  return (...args: T): R => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}