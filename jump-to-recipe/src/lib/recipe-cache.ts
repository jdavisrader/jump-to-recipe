/**
 * Recipe caching system for performance optimization
 * Implements intelligent caching with TTL, LRU eviction, and memory management
 */

import type { Recipe } from '@/types/recipe';
import type { SearchParams } from '@/components/recipes/recipe-search';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    totalSize: number;
    memoryUsage: number;
}

interface RecipeSearchResult {
    recipes: Recipe[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
    searchInfo: {
        query: string;
        hasQuery: boolean;
        sortBy: string;
        appliedFilters: Record<string, unknown>;
    };
}

class RecipeCache {
    private cache = new Map<string, CacheEntry<RecipeSearchResult>>();
    private maxSize: number;
    private defaultTTL: number;
    private stats: CacheStats;

    constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutes default TTL
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSize: 0,
            memoryUsage: 0,
        };

        // Clean up expired entries periodically
        if (typeof window !== 'undefined') {
            setInterval(() => this.cleanup(), 60000); // Clean every minute
        }
    }

    /**
     * Generate cache key from search parameters
     */
    private generateKey(userId: string, searchParams: SearchParams): string {
        const normalizedParams = { ...searchParams };

        // Sort arrays for consistent keys
        if (normalizedParams.tags) {
            normalizedParams.tags = [...normalizedParams.tags].sort();
        }

        // Remove undefined/null values
        Object.keys(normalizedParams).forEach(key => {
            if (normalizedParams[key as keyof SearchParams] == null) {
                delete normalizedParams[key as keyof SearchParams];
            }
        });

        return `${userId}:${JSON.stringify(normalizedParams)}`;
    }

    /**
     * Get cached data
     */
    get(userId: string, searchParams: SearchParams): RecipeSearchResult | null {
        const key = this.generateKey(userId, searchParams);
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check if entry has expired
        if (Date.now() - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            this.stats.misses++;
            this.updateStats();
            return null;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = Date.now();

        this.stats.hits++;
        return entry.data;
    }

    /**
     * Set cached data
     */
    set(
        userId: string,
        searchParams: SearchParams,
        data: RecipeSearchResult,
        ttl?: number
    ): void {
        const key = this.generateKey(userId, searchParams);
        const entryTTL = ttl || this.defaultTTL;

        // If cache is full, evict least recently used entry
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        const entry: CacheEntry<RecipeSearchResult> = {
            data,
            timestamp: Date.now(),
            ttl: entryTTL,
            accessCount: 1,
            lastAccessed: Date.now(),
        };

        this.cache.set(key, entry);
        this.updateStats();
    }

    /**
     * Evict least recently used entry
     */
    private evictLRU(): void {
        let oldestKey = '';
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
        }
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        const keysToDelete: string[] = [];

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));

        if (keysToDelete.length > 0) {
            this.updateStats();
        }
    }

    /**
     * Update cache statistics
     */
    private updateStats(): void {
        this.stats.totalSize = this.cache.size;

        // Estimate memory usage (rough calculation)
        let memoryUsage = 0;
        for (const entry of this.cache.values()) {
            memoryUsage += JSON.stringify(entry.data).length * 2; // Rough estimate
        }
        this.stats.memoryUsage = memoryUsage;
    }

    /**
     * Invalidate cache entries for a specific user
     */
    invalidateUser(userId: string): void {
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            if (key.startsWith(`${userId}:`)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
        this.updateStats();
    }

    /**
     * Invalidate cache entries matching a pattern
     */
    invalidatePattern(pattern: RegExp): void {
        const keysToDelete: string[] = [];

        for (const key of this.cache.keys()) {
            if (pattern.test(key)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.cache.delete(key));
        this.updateStats();
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSize: 0,
            memoryUsage: 0,
        };
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats & { hitRate: number } {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? this.stats.hits / total : 0;

        return {
            ...this.stats,
            hitRate,
        };
    }

    /**
     * Get cache size information
     */
    getSizeInfo(): {
        current: number;
        max: number;
        utilizationPercent: number;
    } {
        return {
            current: this.cache.size,
            max: this.maxSize,
            utilizationPercent: (this.cache.size / this.maxSize) * 100,
        };
    }

    /**
     * Prefetch data for likely next requests
     */
    async prefetch(
        userId: string,
        currentParams: SearchParams,
        fetchFunction: (params: SearchParams) => Promise<RecipeSearchResult>
    ): Promise<void> {
        // Prefetch next page if pagination exists
        if (currentParams.page && currentParams.page > 0) {
            const nextPageParams = { ...currentParams, page: currentParams.page + 1 };
            const nextPageKey = this.generateKey(userId, nextPageParams);

            if (!this.cache.has(nextPageKey)) {
                try {
                    const data = await fetchFunction(nextPageParams);
                    this.set(userId, nextPageParams, data, this.defaultTTL * 2); // Longer TTL for prefetched data
                } catch (error) {
                    // Silently fail prefetch attempts
                    console.debug('Prefetch failed:', error);
                }
            }
        }

        // Prefetch common sort variations
        const commonSorts: Array<SearchParams['sortBy']> = ['newest', 'oldest', 'popular', 'title', 'random'];
        const currentSort = currentParams.sortBy || 'random';

        for (const sortBy of commonSorts) {
            if (sortBy !== currentSort) {
                const sortParams: SearchParams = { ...currentParams, sortBy, page: 1 };
                const sortKey = this.generateKey(userId, sortParams);

                if (!this.cache.has(sortKey)) {
                    try {
                        const data = await fetchFunction(sortParams);
                        this.set(userId, sortParams, data, this.defaultTTL / 2); // Shorter TTL for speculative data
                        break; // Only prefetch one sort variation to avoid overwhelming
                    } catch (error) {
                        console.debug('Sort prefetch failed:', error);
                        break;
                    }
                }
            }
        }
    }

    /**
     * Optimize cache by removing low-value entries
     */
    optimize(): void {
        if (this.cache.size < this.maxSize * 0.8) {
            return; // No need to optimize if cache isn't nearly full
        }

        const entries = Array.from(this.cache.entries());

        // Sort by access count and recency
        entries.sort(([, a], [, b]) => {
            const aScore = a.accessCount * (1 / (Date.now() - a.lastAccessed));
            const bScore = b.accessCount * (1 / (Date.now() - b.lastAccessed));
            return bScore - aScore;
        });

        // Remove bottom 20% of entries
        const removeCount = Math.floor(entries.length * 0.2);
        const toRemove = entries.slice(-removeCount);

        toRemove.forEach(([key]) => {
            this.cache.delete(key);
            this.stats.evictions++;
        });

        this.updateStats();
    }

    /**
     * Export cache data for debugging
     */
    export(): Array<{
        key: string;
        data: RecipeSearchResult;
        metadata: Omit<CacheEntry<RecipeSearchResult>, 'data'>;
    }> {
        return Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            data: entry.data,
            metadata: {
                timestamp: entry.timestamp,
                ttl: entry.ttl,
                accessCount: entry.accessCount,
                lastAccessed: entry.lastAccessed,
            },
        }));
    }
}

// Singleton instance
export const recipeCache = new RecipeCache();

/**
 * React hook for recipe caching
 */
export function useRecipeCache() {
    const get = (userId: string, searchParams: SearchParams) => {
        return recipeCache.get(userId, searchParams);
    };

    const set = (
        userId: string,
        searchParams: SearchParams,
        data: RecipeSearchResult,
        ttl?: number
    ) => {
        recipeCache.set(userId, searchParams, data, ttl);
    };

    const invalidateUser = (userId: string) => {
        recipeCache.invalidateUser(userId);
    };

    const getStats = () => {
        return recipeCache.getStats();
    };

    const prefetch = async (
        userId: string,
        currentParams: SearchParams,
        fetchFunction: (params: SearchParams) => Promise<RecipeSearchResult>
    ) => {
        return recipeCache.prefetch(userId, currentParams, fetchFunction);
    };

    return {
        get,
        set,
        invalidateUser,
        getStats,
        prefetch,
        cache: recipeCache,
    };
}

/**
 * Cache-aware fetch wrapper
 */
export async function fetchWithCache(
    userId: string,
    searchParams: SearchParams,
    fetchFunction: (params: SearchParams) => Promise<RecipeSearchResult>,
    options: {
        useCache?: boolean;
        ttl?: number;
        prefetch?: boolean;
    } = {}
): Promise<RecipeSearchResult> {
    const { useCache = true, ttl, prefetch = false } = options;

    // Try cache first
    if (useCache) {
        const cached = recipeCache.get(userId, searchParams);
        if (cached) {
            // Trigger prefetch in background if enabled
            if (prefetch) {
                setTimeout(() => {
                    recipeCache.prefetch(userId, searchParams, fetchFunction);
                }, 0);
            }

            return cached;
        }
    }

    // Fetch fresh data
    const data = await fetchFunction(searchParams);

    // Cache the result
    if (useCache) {
        recipeCache.set(userId, searchParams, data, ttl);

        // Trigger prefetch in background if enabled
        if (prefetch) {
            setTimeout(() => {
                recipeCache.prefetch(userId, searchParams, fetchFunction);
            }, 0);
        }
    }

    return data;
}

/**
 * Cache warming utility for common queries
 */
export async function warmCache(
    userId: string,
    fetchFunction: (params: SearchParams) => Promise<RecipeSearchResult>
): Promise<void> {
    const commonQueries: SearchParams[] = [
        {}, // Default query
        { sortBy: 'popular' as const },
        { sortBy: 'newest' as const },
        { tags: ['dinner'] },
        { tags: ['easy'] },
        { difficulty: 'easy' as const },
    ];

    // Warm cache with common queries
    const promises = commonQueries.map(async (params) => {
        try {
            const data = await fetchFunction(params);
            recipeCache.set(userId, params, data, recipeCache['defaultTTL'] * 2);
        } catch (error) {
            console.debug('Cache warming failed for params:', params, error);
        }
    });

    await Promise.allSettled(promises);
}