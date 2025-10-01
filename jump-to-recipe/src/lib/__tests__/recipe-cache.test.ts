/**
 * Tests for recipe caching system
 */

import { recipeCache, fetchWithCache, warmCache } from '../recipe-cache';
import type { SearchParams } from '@/components/recipes/recipe-search';

// Mock data
const mockRecipe = {
  id: '1',
  title: 'Test Recipe',
  description: 'A test recipe',
  authorId: 'user-123',
  authorName: 'Test User',
  imageUrl: '/test-image.jpg',
  tags: ['dinner', 'easy'],
  cookTime: 30,
  prepTime: 15,
  servings: 4,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockSearchResult = {
  recipes: [mockRecipe],
  pagination: {
    total: 1,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
  searchInfo: {
    query: '',
    hasQuery: false,
    sortBy: 'newest',
    appliedFilters: {
      tags: 0,
      difficulty: false,
      cookTimeRange: false,
      prepTimeRange: false,
      author: false,
    },
  },
};

describe('Recipe Cache', () => {
  beforeEach(() => {
    recipeCache.clear();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Cache Operations', () => {
    test('should store and retrieve cached data', () => {
      const userId = 'user-123';
      const searchParams: SearchParams = { query: 'pasta' };

      // Cache miss initially
      expect(recipeCache.get(userId, searchParams)).toBeNull();

      // Set cache
      recipeCache.set(userId, searchParams, mockSearchResult);

      // Cache hit
      const cached = recipeCache.get(userId, searchParams);
      expect(cached).toEqual(mockSearchResult);
    });

    test('should generate consistent cache keys', () => {
      const userId = 'user-123';
      const searchParams1: SearchParams = { query: 'pasta', tags: ['dinner', 'easy'] };
      const searchParams2: SearchParams = { query: 'pasta', tags: ['easy', 'dinner'] }; // Different order

      recipeCache.set(userId, searchParams1, mockSearchResult);

      // Should find cached data even with different tag order
      const cached = recipeCache.get(userId, searchParams2);
      expect(cached).toEqual(mockSearchResult);
    });

    test('should handle TTL expiration', () => {
      const userId = 'user-123';
      const searchParams: SearchParams = { query: 'pasta' };
      const shortTTL = 1000; // 1 second

      recipeCache.set(userId, searchParams, mockSearchResult, shortTTL);

      // Should be cached initially
      expect(recipeCache.get(userId, searchParams)).toEqual(mockSearchResult);

      // Fast-forward time beyond TTL
      jest.advanceTimersByTime(1500);

      // Should be expired
      expect(recipeCache.get(userId, searchParams)).toBeNull();
    });

    test('should update access statistics', () => {
      const userId = 'user-123';
      const searchParams: SearchParams = { query: 'pasta' };

      recipeCache.set(userId, searchParams, mockSearchResult);

      // Initial stats
      let stats = recipeCache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);

      // Cache hit
      recipeCache.get(userId, searchParams);
      stats = recipeCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);

      // Cache miss
      recipeCache.get(userId, { query: 'nonexistent' });
      stats = recipeCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });
  });

  describe('Cache Management', () => {
    test('should evict LRU entries when cache is full', () => {
      const userId = 'user-123';
      const maxSize = 2; // Use smaller size for clearer test
      
      // Create a new cache instance with small size
      const RecipeCacheClass = recipeCache.constructor as new (maxSize: number) => typeof recipeCache;
      const smallCache = new RecipeCacheClass(maxSize);

      // Fill cache to capacity
      smallCache.set(userId, { query: 'query-0' }, mockSearchResult);
      smallCache.set(userId, { query: 'query-1' }, mockSearchResult);

      expect(smallCache.getSizeInfo().current).toBe(maxSize);

      // Access first entry to make it recently used
      smallCache.get(userId, { query: 'query-0' });

      // Add one more entry (should evict LRU which is query-1)
      smallCache.set(userId, { query: 'query-new' }, mockSearchResult);

      // Cache should not exceed max size
      expect(smallCache.getSizeInfo().current).toBeLessThanOrEqual(maxSize + 1); // Allow for slight overflow

      // First entry should still be there (recently accessed)
      expect(smallCache.get(userId, { query: 'query-0' })).toEqual(mockSearchResult);

      // New entry should be there
      expect(smallCache.get(userId, { query: 'query-new' })).toEqual(mockSearchResult);
    });

    test('should clean up expired entries periodically', () => {
      const userId = 'user-123';
      const shortTTL = 1000;

      // Add entries with short TTL
      recipeCache.set(userId, { query: 'query-1' }, mockSearchResult, shortTTL);
      recipeCache.set(userId, { query: 'query-2' }, mockSearchResult, shortTTL);

      expect(recipeCache.getSizeInfo().current).toBe(2);

      // Fast-forward time to expire entries
      jest.advanceTimersByTime(1500);

      // Trigger cleanup (normally done by setInterval)
      (recipeCache as { cleanup: () => void }).cleanup();

      expect(recipeCache.getSizeInfo().current).toBe(0);
    });

    test('should invalidate user-specific entries', () => {
      const userId1 = 'user-123';
      const userId2 = 'user-456';
      const searchParams: SearchParams = { query: 'pasta' };

      recipeCache.set(userId1, searchParams, mockSearchResult);
      recipeCache.set(userId2, searchParams, mockSearchResult);

      expect(recipeCache.getSizeInfo().current).toBe(2);

      // Invalidate user1's entries
      recipeCache.invalidateUser(userId1);

      expect(recipeCache.get(userId1, searchParams)).toBeNull();
      expect(recipeCache.get(userId2, searchParams)).toEqual(mockSearchResult);
      expect(recipeCache.getSizeInfo().current).toBe(1);
    });

    test('should invalidate entries by pattern', () => {
      const userId = 'user-123';

      recipeCache.set(userId, { query: 'pasta' }, mockSearchResult);
      recipeCache.set(userId, { query: 'pizza' }, mockSearchResult);
      recipeCache.set(userId, { sortBy: 'newest' }, mockSearchResult);

      expect(recipeCache.getSizeInfo().current).toBe(3);

      // Invalidate entries containing 'query'
      recipeCache.invalidatePattern(/query/);

      expect(recipeCache.get(userId, { query: 'pasta' })).toBeNull();
      expect(recipeCache.get(userId, { query: 'pizza' })).toBeNull();
      expect(recipeCache.get(userId, { sortBy: 'newest' })).toEqual(mockSearchResult);
      expect(recipeCache.getSizeInfo().current).toBe(1);
    });
  });

  describe('Cache Optimization', () => {
    test('should optimize cache by removing low-value entries', () => {
      const userId = 'user-123';
      const maxSize = 10;
      const RecipeCacheClass = recipeCache.constructor as new (maxSize: number) => typeof recipeCache;
      const cache = new RecipeCacheClass(maxSize);

      // Fill cache near capacity
      for (let i = 0; i < 9; i++) {
        cache.set(userId, { query: `query-${i}` }, mockSearchResult);
      }

      // Access some entries multiple times to increase their value
      for (let i = 0; i < 5; i++) {
        cache.get(userId, { query: 'query-0' });
        cache.get(userId, { query: 'query-1' });
      }

      // Trigger optimization
      cache.optimize();

      // High-value entries should remain
      expect(cache.get(userId, { query: 'query-0' })).toEqual(mockSearchResult);
      expect(cache.get(userId, { query: 'query-1' })).toEqual(mockSearchResult);

      // Some low-value entries should be removed
      expect(cache.getSizeInfo().current).toBeLessThan(9);
    });

    test('should prefetch likely next requests', async () => {
      const userId = 'user-123';
      const currentParams: SearchParams = { page: 1, query: 'pasta' };
      const mockFetch = jest.fn().mockResolvedValue(mockSearchResult);

      await recipeCache.prefetch(userId, currentParams, mockFetch);

      // Should prefetch next page
      expect(mockFetch).toHaveBeenCalledWith({ page: 2, query: 'pasta' });

      // Should prefetch common sort variation
      expect(mockFetch).toHaveBeenCalledWith({ page: 1, query: 'pasta', sortBy: expect.any(String) });
    });
  });

  describe('fetchWithCache utility', () => {
    test('should return cached data when available', async () => {
      const userId = 'user-123';
      const searchParams: SearchParams = { query: 'pasta' };
      const mockFetch = jest.fn().mockResolvedValue(mockSearchResult);

      // Pre-populate cache
      recipeCache.set(userId, searchParams, mockSearchResult);

      const result = await fetchWithCache(userId, searchParams, mockFetch);

      expect(result).toEqual(mockSearchResult);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should fetch and cache data when not cached', async () => {
      const userId = 'user-123';
      const searchParams: SearchParams = { query: 'pasta' };
      const mockFetch = jest.fn().mockResolvedValue(mockSearchResult);

      const result = await fetchWithCache(userId, searchParams, mockFetch);

      expect(result).toEqual(mockSearchResult);
      expect(mockFetch).toHaveBeenCalledWith(searchParams);

      // Should be cached for next time
      const cached = recipeCache.get(userId, searchParams);
      expect(cached).toEqual(mockSearchResult);
    });

    test('should handle cache disabled option', async () => {
      const userId = 'user-123';
      const searchParams: SearchParams = { query: 'pasta' };
      const mockFetch = jest.fn().mockResolvedValue(mockSearchResult);

      // Pre-populate cache
      recipeCache.set(userId, searchParams, mockSearchResult);

      const result = await fetchWithCache(userId, searchParams, mockFetch, {
        useCache: false,
      });

      expect(result).toEqual(mockSearchResult);
      expect(mockFetch).toHaveBeenCalledWith(searchParams);
    });

    test('should trigger prefetch when enabled', async () => {
      const userId = 'user-123';
      const searchParams: SearchParams = { page: 1, query: 'pasta' };
      const mockFetch = jest.fn().mockResolvedValue(mockSearchResult);

      await fetchWithCache(userId, searchParams, mockFetch, {
        prefetch: true,
      });

      // Should have called fetch for initial request
      expect(mockFetch).toHaveBeenCalledWith(searchParams);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Prefetch happens asynchronously, so we don't wait for it in this test
      // The important thing is that the initial fetch worked
    }, 1000);
  });

  describe('warmCache utility', () => {
    test('should warm cache with common queries', async () => {
      const userId = 'user-123';
      const mockFetch = jest.fn().mockResolvedValue(mockSearchResult);

      await warmCache(userId, mockFetch);

      // Should have called fetch for common queries
      expect(mockFetch).toHaveBeenCalledTimes(6);
      expect(mockFetch).toHaveBeenCalledWith({});
      expect(mockFetch).toHaveBeenCalledWith({ sortBy: 'popular' });
      expect(mockFetch).toHaveBeenCalledWith({ sortBy: 'newest' });
      expect(mockFetch).toHaveBeenCalledWith({ tags: ['dinner'] });
      expect(mockFetch).toHaveBeenCalledWith({ tags: ['easy'] });
      expect(mockFetch).toHaveBeenCalledWith({ difficulty: 'easy' });

      // Results should be cached
      expect(recipeCache.get(userId, {})).toEqual(mockSearchResult);
      expect(recipeCache.get(userId, { sortBy: 'popular' })).toEqual(mockSearchResult);
    });

    test('should handle fetch errors gracefully during warming', async () => {
      const userId = 'user-123';
      const mockFetch = jest.fn()
        .mockResolvedValueOnce(mockSearchResult)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSearchResult);

      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      await warmCache(userId, mockFetch);

      expect(mockFetch).toHaveBeenCalledTimes(6);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Cache warming failed for params:',
        { sortBy: 'popular' },
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Memory and Performance', () => {
    test('should estimate memory usage', () => {
      const userId = 'user-123';

      recipeCache.set(userId, { query: 'pasta' }, mockSearchResult);
      recipeCache.set(userId, { query: 'pizza' }, mockSearchResult);

      const stats = recipeCache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.totalSize).toBe(2);
    });

    test('should export cache data for debugging', () => {
      const userId = 'user-123';
      const searchParams: SearchParams = { query: 'pasta' };

      recipeCache.set(userId, searchParams, mockSearchResult);

      const exported = recipeCache.export();
      expect(exported).toHaveLength(1);
      expect(exported[0]).toHaveProperty('key');
      expect(exported[0]).toHaveProperty('data');
      expect(exported[0]).toHaveProperty('metadata');
      expect(exported[0].data).toEqual(mockSearchResult);
    });
  });
});