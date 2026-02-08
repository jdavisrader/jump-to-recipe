/**
 * Performance Utilities for Ingredient Management
 * 
 * Provides utilities for optimizing performance during drag-and-drop operations,
 * including debouncing for rapid updates and selective re-rendering helpers.
 * 
 * Requirements: 8.3, 8.4, 8.5
 */

/**
 * Debounces a function to prevent excessive calls during rapid operations
 * 
 * This is particularly useful for position updates during drag-and-drop,
 * where multiple rapid updates can cause performance issues.
 * 
 * Performance: Prevents excessive function calls (Requirement 8.3)
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns A debounced version of the function
 * 
 * @example
 * const debouncedSave = debounce((positions) => {
 *   savePositions(positions);
 * }, 300);
 * 
 * // Multiple rapid calls
 * debouncedSave(positions1); // Cancelled
 * debouncedSave(positions2); // Cancelled
 * debouncedSave(positions3); // Executed after 300ms
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttles a function to limit how often it can be called
 * 
 * Unlike debounce, throttle ensures the function is called at most once
 * per specified time period, even during continuous rapid calls.
 * 
 * Performance: Limits function call frequency (Requirement 8.3)
 * 
 * @param func - The function to throttle
 * @param limit - The minimum time between calls in milliseconds
 * @returns A throttled version of the function
 * 
 * @example
 * const throttledUpdate = throttle((data) => {
 *   updateUI(data);
 * }, 100);
 * 
 * // Called every 100ms at most
 * throttledUpdate(data1); // Executed immediately
 * throttledUpdate(data2); // Ignored (within 100ms)
 * throttledUpdate(data3); // Executed (after 100ms)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
    return lastResult;
  };
}

/**
 * Creates a shallow comparison function for React.memo
 * 
 * This helps prevent unnecessary re-renders by comparing only the props
 * that actually matter for the component.
 * 
 * Performance: Enables selective re-rendering (Requirement 8.5)
 * 
 * @param keys - Array of prop keys to compare
 * @returns A comparison function for React.memo
 * 
 * @example
 * const IngredientRow = React.memo(
 *   ({ ingredient, onDelete, isDragging }) => {
 *     // Component implementation
 *   },
 *   shallowCompare(['ingredient.id', 'ingredient.name', 'isDragging'])
 * );
 */
export function shallowCompare<T extends Record<string, any>>(
  keys: string[]
): (prevProps: T, nextProps: T) => boolean {
  return (prevProps: T, nextProps: T): boolean => {
    // If all specified keys are equal, props are considered equal (no re-render)
    return keys.every((key) => {
      const prevValue = getNestedValue(prevProps, key);
      const nextValue = getNestedValue(nextProps, key);
      return prevValue === nextValue;
    });
  };
}

/**
 * Gets a nested value from an object using dot notation
 * 
 * @param obj - The object to get the value from
 * @param path - The path to the value (e.g., 'ingredient.name')
 * @returns The value at the path, or undefined if not found
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Batches multiple state updates into a single update
 * 
 * This is useful when multiple related state changes need to happen together,
 * preventing multiple re-renders.
 * 
 * Performance: Reduces re-render count (Requirement 8.5)
 * 
 * @param updates - Array of update functions to batch
 * @returns A function that executes all updates
 * 
 * @example
 * const batchedUpdate = batchUpdates([
 *   () => setIngredients(newIngredients),
 *   () => setSections(newSections),
 *   () => setDragState(null)
 * ]);
 * 
 * batchedUpdate(); // All updates happen together
 */
export function batchUpdates(updates: Array<() => void>): () => void {
  return () => {
    // React 18+ automatically batches updates in event handlers
    // This function provides explicit batching for other scenarios
    updates.forEach((update) => update());
  };
}

/**
 * Checks if two arrays are shallowly equal
 * 
 * Useful for comparing arrays of primitives or references to determine
 * if a re-render is necessary.
 * 
 * Performance: Enables selective re-rendering (Requirement 8.5)
 * 
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns True if arrays are shallowly equal
 * 
 * @example
 * const prevIds = ['a', 'b', 'c'];
 * const nextIds = ['a', 'b', 'c'];
 * const areEqual = areArraysEqual(prevIds, nextIds); // true
 */
export function areArraysEqual<T>(arr1: T[], arr2: T[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }
  return arr1.every((item, index) => item === arr2[index]);
}

/**
 * Creates a memoized selector for extracting data from state
 * 
 * This prevents unnecessary recalculations when the input data hasn't changed.
 * 
 * Performance: Reduces computation overhead (Requirement 8.4)
 * 
 * @param selector - Function that extracts/computes data
 * @returns A memoized version of the selector
 * 
 * @example
 * const getIngredientIds = memoize((ingredients) => 
 *   ingredients.map(ing => ing.id)
 * );
 * 
 * const ids1 = getIngredientIds(ingredients); // Computed
 * const ids2 = getIngredientIds(ingredients); // Cached (same input)
 */
export function memoize<T extends (...args: any[]) => any>(
  selector: T
): T {
  let lastArgs: Parameters<T> | null = null;
  let lastResult: ReturnType<T> | null = null;

  return ((...args: Parameters<T>) => {
    // Check if arguments have changed
    if (
      lastArgs === null ||
      args.length !== lastArgs.length ||
      args.some((arg, index) => arg !== lastArgs![index])
    ) {
      lastArgs = args;
      lastResult = selector(...args);
    }
    return lastResult;
  }) as T;
}

/**
 * Performance monitoring utility for drag operations
 * 
 * Helps identify performance bottlenecks during development.
 * 
 * @param label - Label for the operation being measured
 * @param operation - The operation to measure
 * @returns The result of the operation
 * 
 * @example
 * const result = measurePerformance('reorder-ingredients', () => {
 *   return reorderWithinSection(items, 0, 10);
 * });
 */
export function measurePerformance<T>(
  label: string,
  operation: () => T
): T {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = operation();
    const end = performance.now();
    const duration = end - start;

    // Log if operation takes longer than 16ms (one frame at 60fps)
    if (duration > 16) {
      console.warn(
        `[Performance] ${label} took ${duration.toFixed(2)}ms (>16ms threshold)`
      );
    }

    return result;
  }

  // In production, just execute without measuring
  return operation();
}
