/**
 * Performance Optimization Tests
 * 
 * Tests for performance utilities and optimizations in ingredient management.
 * Validates Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */

import {
  debounce,
  throttle,
  shallowCompare,
  areArraysEqual,
  memoize,
  measurePerformance,
} from '../performance-utils';
import {
  reorderWithinSection,
  moveBetweenSections,
  getNextPosition,
  normalizePositions,
} from '../section-position-utils';

describe('Performance Utilities', () => {
  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const func = jest.fn();
      const debounced = debounce(func, 100);

      debounced();
      expect(func).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous calls on rapid invocations', () => {
      const func = jest.fn();
      const debounced = debounce(func, 100);

      debounced();
      debounced();
      debounced();

      jest.advanceTimersByTime(100);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to the debounced function', () => {
      const func = jest.fn();
      const debounced = debounce(func, 100);

      debounced('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    it('should execute immediately on first call', () => {
      const func = jest.fn();
      const throttled = throttle(func, 100);

      throttled();
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should ignore calls within the throttle period', () => {
      const func = jest.fn();
      const throttled = throttle(func, 100);

      throttled();
      throttled();
      throttled();

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should allow calls after the throttle period', () => {
      const func = jest.fn();
      const throttled = throttle(func, 100);

      throttled();
      jest.advanceTimersByTime(100);
      throttled();

      expect(func).toHaveBeenCalledTimes(2);
    });
  });

  describe('shallowCompare', () => {
    it('should return true when specified keys are equal', () => {
      const compare = shallowCompare(['id', 'name']);
      const prev = { id: '1', name: 'Test', other: 'value1' };
      const next = { id: '1', name: 'Test', other: 'value2' };

      expect(compare(prev, next)).toBe(true);
    });

    it('should return false when specified keys differ', () => {
      const compare = shallowCompare(['id', 'name']);
      const prev = { id: '1', name: 'Test' };
      const next = { id: '1', name: 'Changed' };

      expect(compare(prev, next)).toBe(false);
    });

    it('should handle nested keys', () => {
      const compare = shallowCompare(['ingredient.id', 'ingredient.name']);
      const prev = { ingredient: { id: '1', name: 'Test' } };
      const next = { ingredient: { id: '1', name: 'Test' } };

      expect(compare(prev, next)).toBe(true);
    });
  });

  describe('areArraysEqual', () => {
    it('should return true for equal arrays', () => {
      const arr1 = ['a', 'b', 'c'];
      const arr2 = ['a', 'b', 'c'];

      expect(areArraysEqual(arr1, arr2)).toBe(true);
    });

    it('should return false for different arrays', () => {
      const arr1 = ['a', 'b', 'c'];
      const arr2 = ['a', 'b', 'd'];

      expect(areArraysEqual(arr1, arr2)).toBe(false);
    });

    it('should return false for arrays of different lengths', () => {
      const arr1 = ['a', 'b'];
      const arr2 = ['a', 'b', 'c'];

      expect(areArraysEqual(arr1, arr2)).toBe(false);
    });
  });

  describe('memoize', () => {
    it('should cache results for same inputs', () => {
      const expensiveFunc = jest.fn((x: number) => x * 2);
      const memoized = memoize(expensiveFunc);

      const result1 = memoized(5);
      const result2 = memoized(5);

      expect(result1).toBe(10);
      expect(result2).toBe(10);
      expect(expensiveFunc).toHaveBeenCalledTimes(1);
    });

    it('should recompute for different inputs', () => {
      const expensiveFunc = jest.fn((x: number) => x * 2);
      const memoized = memoize(expensiveFunc);

      const result1 = memoized(5);
      const result2 = memoized(10);

      expect(result1).toBe(10);
      expect(result2).toBe(20);
      expect(expensiveFunc).toHaveBeenCalledTimes(2);
    });
  });

  describe('measurePerformance', () => {
    it('should execute the operation and return result', () => {
      const result = measurePerformance('test-operation', () => {
        return 42;
      });

      expect(result).toBe(42);
    });

    it('should handle operations that throw errors', () => {
      expect(() => {
        measurePerformance('error-operation', () => {
          throw new Error('Test error');
        });
      }).toThrow('Test error');
    });
  });
});

describe('Position Calculation Performance', () => {
  describe('reorderWithinSection with large lists', () => {
    it('should handle 20+ items efficiently (Requirement 8.1)', () => {
      // Create a list of 25 items
      const items = Array.from({ length: 25 }, (_, i) => ({
        id: `item-${i}`,
        position: i,
        name: `Item ${i}`,
      }));

      const start = performance.now();
      const result = reorderWithinSection(items, 0, 24);
      const duration = performance.now() - start;

      // Should complete in less than 16ms (one frame at 60fps)
      expect(duration).toBeLessThan(16);
      expect(result).toHaveLength(25);
      expect(result[24].id).toBe('item-0');
    });

    it('should handle 50+ items efficiently', () => {
      // Create a list of 50 items
      const items = Array.from({ length: 50 }, (_, i) => ({
        id: `item-${i}`,
        position: i,
        name: `Item ${i}`,
      }));

      const start = performance.now();
      const result = reorderWithinSection(items, 10, 40);
      const duration = performance.now() - start;

      // Should still be fast even with larger lists
      expect(duration).toBeLessThan(16);
      expect(result).toHaveLength(50);
    });
  });

  describe('moveBetweenSections with large lists', () => {
    it('should handle cross-section moves efficiently (Requirement 8.2)', () => {
      const sourceItems = Array.from({ length: 20 }, (_, i) => ({
        id: `source-${i}`,
        position: i,
        name: `Source ${i}`,
      }));

      const destItems = Array.from({ length: 20 }, (_, i) => ({
        id: `dest-${i}`,
        position: i,
        name: `Dest ${i}`,
      }));

      const start = performance.now();
      const result = moveBetweenSections(sourceItems, destItems, 5, 10);
      const duration = performance.now() - start;

      // Should complete quickly
      expect(duration).toBeLessThan(16);
      expect(result.sourceItems).toHaveLength(19);
      expect(result.destItems).toHaveLength(21);
    });
  });

  describe('normalizePositions performance', () => {
    it('should normalize large lists efficiently (Requirement 8.4)', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        position: i * 10, // Non-sequential positions
        name: `Item ${i}`,
      }));

      const start = performance.now();
      const result = normalizePositions(items);
      const duration = performance.now() - start;

      // Should be fast even with 100 items
      expect(duration).toBeLessThan(16);
      expect(result).toHaveLength(100);
      expect(result[0].position).toBe(0);
      expect(result[99].position).toBe(99);
    });
  });

  describe('getNextPosition performance', () => {
    it('should calculate next position efficiently for large lists', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        position: i,
        name: `Item ${i}`,
      }));

      const start = performance.now();
      const nextPos = getNextPosition(items);
      const duration = performance.now() - start;

      // Should be very fast (O(n) operation)
      expect(duration).toBeLessThan(5);
      expect(nextPos).toBe(100);
    });
  });

  describe('rapid operations data integrity (Requirement 8.3)', () => {
    it('should maintain data integrity during multiple rapid reorders', () => {
      let items = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        position: i,
        name: `Item ${i}`,
      }));

      // Perform 10 rapid reorder operations
      for (let i = 0; i < 10; i++) {
        const sourceIndex = Math.floor(Math.random() * items.length);
        const destIndex = Math.floor(Math.random() * items.length);
        items = reorderWithinSection(items, sourceIndex, destIndex);
      }

      // Verify data integrity
      expect(items).toHaveLength(10);
      
      // All items should still exist
      const ids = items.map((item) => item.id).sort();
      const expectedIds = Array.from({ length: 10 }, (_, i) => `item-${i}`).sort();
      expect(ids).toEqual(expectedIds);

      // Positions should be sequential
      const positions = items.map((item) => item.position).sort((a, b) => a - b);
      expect(positions).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should maintain data integrity during rapid cross-section moves', () => {
      let sourceItems = Array.from({ length: 5 }, (_, i) => ({
        id: `source-${i}`,
        position: i,
        name: `Source ${i}`,
      }));

      let destItems = Array.from({ length: 5 }, (_, i) => ({
        id: `dest-${i}`,
        position: i,
        name: `Dest ${i}`,
      }));

      // Perform 5 rapid cross-section moves
      for (let i = 0; i < 5; i++) {
        if (sourceItems.length > 0) {
          const sourceIndex = Math.floor(Math.random() * sourceItems.length);
          const destIndex = Math.floor(Math.random() * (destItems.length + 1));
          const result = moveBetweenSections(sourceItems, destItems, sourceIndex, destIndex);
          sourceItems = result.sourceItems;
          destItems = result.destItems;
        }
      }

      // Verify data integrity
      const totalItems = sourceItems.length + destItems.length;
      expect(totalItems).toBe(10); // No items lost

      // All positions should be sequential within each section
      const sourcePositions = sourceItems.map((item) => item.position);
      const destPositions = destItems.map((item) => item.position);

      expect(sourcePositions).toEqual(
        Array.from({ length: sourceItems.length }, (_, i) => i)
      );
      expect(destPositions).toEqual(
        Array.from({ length: destItems.length }, (_, i) => i)
      );
    });
  });
});

describe('Early Return Optimizations', () => {
  it('should return immediately for empty arrays', () => {
    const start = performance.now();
    const result = reorderWithinSection([], 0, 0);
    const duration = performance.now() - start;

    // Should be nearly instant
    expect(duration).toBeLessThan(1);
    expect(result).toEqual([]);
  });

  it('should return immediately when source equals destination', () => {
    const items = [
      { id: '1', position: 0, name: 'Item 1' },
      { id: '2', position: 1, name: 'Item 2' },
    ];

    const start = performance.now();
    const result = reorderWithinSection(items, 0, 0);
    const duration = performance.now() - start;

    // Should be nearly instant
    expect(duration).toBeLessThan(1);
    expect(result).toEqual(items);
  });

  it('should return immediately for getNextPosition with empty array', () => {
    const start = performance.now();
    const nextPos = getNextPosition([]);
    const duration = performance.now() - start;

    // Should be nearly instant
    expect(duration).toBeLessThan(1);
    expect(nextPos).toBe(0);
  });
});
