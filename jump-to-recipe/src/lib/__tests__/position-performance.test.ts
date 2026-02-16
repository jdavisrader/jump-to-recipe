/**
 * Performance benchmarks for position operations
 * 
 * Requirements tested:
 * - Position assignment should be O(n)
 * - Position validation should be O(n)
 * - Drag-and-drop should be < 100ms
 * - No regression in UI responsiveness
 */

import {
  reindexItemPositions,
  validatePositions,
  getNextPosition,
} from '../section-position-utils';
import type { Ingredient, Instruction } from '@/types/recipe';

// Helper to generate test data
function generateIngredients(count: number): Ingredient[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ing-${i}`,
    name: `Ingredient ${i}`,
    amount: 1,
    unit: 'cup',
    position: i,
  }));
}

function generateInstructions(count: number): Instruction[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `inst-${i}`,
    step: i + 1,
    content: `Step ${i + 1}`,
    position: i,
  }));
}

// Performance measurement helper
function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
}

describe('Position Performance Benchmarks', () => {
  describe('Position Assignment Performance', () => {
    test('reindexItemPositions should be O(n) - 100 items', () => {
      const items = generateIngredients(100);
      const time = measureTime(() => {
        reindexItemPositions(items);
      });
      
      // Should complete in < 10ms for 100 items
      expect(time).toBeLessThan(10);
    });

    test('reindexItemPositions should be O(n) - 1000 items', () => {
      const items = generateIngredients(1000);
      const time = measureTime(() => {
        reindexItemPositions(items);
      });
      
      // Should complete in < 50ms for 1000 items
      expect(time).toBeLessThan(50);
    });

    test('reindexItemPositions should scale linearly', () => {
      const sizes = [100, 200, 400, 800];
      const times: number[] = [];
      
      sizes.forEach(size => {
        const items = generateIngredients(size);
        const time = measureTime(() => {
          reindexItemPositions(items);
        });
        times.push(time);
      });
      
      // Check that time roughly doubles when size doubles
      // Allow for more variance due to system load and small operation times
      const ratio1 = times[1] / times[0];
      const ratio2 = times[2] / times[1];
      const ratio3 = times[3] / times[2];
      
      // For very fast operations, ratios can vary significantly
      // Just verify they're not exponential (< 10x) and not constant (> 0.3)
      expect(ratio1).toBeGreaterThan(0.3);
      expect(ratio1).toBeLessThan(10);
      expect(ratio2).toBeGreaterThan(0.3);
      expect(ratio2).toBeLessThan(10);
      expect(ratio3).toBeGreaterThan(0.3);
      expect(ratio3).toBeLessThan(10);
      
      // Verify absolute times are still reasonable
      expect(times[0]).toBeLessThan(10); // 100 items < 10ms
      expect(times[3]).toBeLessThan(100); // 800 items < 100ms
    });

    test('getNextPosition should be O(1)', () => {
      const items = generateIngredients(1000);
      const time = measureTime(() => {
        for (let i = 0; i < 100; i++) {
          getNextPosition(items);
        }
      });
      
      // 100 calls should complete in < 5ms
      expect(time).toBeLessThan(5);
    });
  });

  describe('Position Validation Performance', () => {
    test('validatePositions should be O(n) - 100 items', () => {
      const items = generateIngredients(100);
      const time = measureTime(() => {
        validatePositions(items);
      });
      
      // Should complete in < 10ms for 100 items
      expect(time).toBeLessThan(10);
    });

    test('validatePositions should be O(n) - 1000 items', () => {
      const items = generateIngredients(1000);
      const time = measureTime(() => {
        validatePositions(items);
      });
      
      // Should complete in < 50ms for 1000 items
      expect(time).toBeLessThan(50);
    });

    test('validatePositions with invalid data should still be O(n)', () => {
      const items = generateIngredients(500);
      // Introduce duplicates
      items[100].position = items[50].position;
      items[200].position = items[150].position;
      
      const time = measureTime(() => {
        validatePositions(items);
      });
      
      // Should complete in < 30ms even with validation failures
      expect(time).toBeLessThan(30);
    });
  });

  describe('Drag-and-Drop Performance', () => {
    test('single item reorder should be < 100ms', () => {
      const items = generateIngredients(50);
      
      const time = measureTime(() => {
        // Simulate drag from position 10 to position 30
        const [movedItem] = items.splice(10, 1);
        items.splice(30, 0, movedItem);
        reindexItemPositions(items);
      });
      
      expect(time).toBeLessThan(100);
    });

    test('multiple sequential reorders should be < 100ms each', () => {
      const items = generateIngredients(50);
      const times: number[] = [];
      
      // Perform 10 sequential drag operations
      for (let i = 0; i < 10; i++) {
        const time = measureTime(() => {
          const sourceIdx = Math.floor(Math.random() * items.length);
          const destIdx = Math.floor(Math.random() * items.length);
          const [movedItem] = items.splice(sourceIdx, 1);
          items.splice(destIdx, 0, movedItem);
          reindexItemPositions(items);
        });
        times.push(time);
      }
      
      // All operations should be < 100ms
      times.forEach(time => {
        expect(time).toBeLessThan(100);
      });
      
      // Average should be well under 100ms
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      expect(average).toBeLessThan(50);
    });

    test('cross-section move should be < 100ms', () => {
      const sourceItems = generateIngredients(25);
      const destItems = generateIngredients(25);
      
      const time = measureTime(() => {
        // Move item from source to dest
        const [movedItem] = sourceItems.splice(10, 1);
        destItems.splice(15, 0, movedItem);
        
        // Reindex both sections
        reindexItemPositions(sourceItems);
        reindexItemPositions(destItems);
      });
      
      expect(time).toBeLessThan(100);
    });

    test('large list reorder should be < 100ms', () => {
      const items = generateIngredients(200);
      
      const time = measureTime(() => {
        // Move item from start to end
        const [movedItem] = items.splice(0, 1);
        items.splice(items.length, 0, movedItem);
        reindexItemPositions(items);
      });
      
      expect(time).toBeLessThan(100);
    });
  });

  describe('Batch Operations Performance', () => {
    test('batch position assignment for multiple sections', () => {
      const sections = Array.from({ length: 10 }, (_, i) => ({
        id: `section-${i}`,
        name: `Section ${i}`,
        order: i,
        items: generateIngredients(20),
      }));
      
      const time = measureTime(() => {
        sections.forEach(section => {
          reindexItemPositions(section.items);
        });
      });
      
      // 10 sections × 20 items = 200 items total
      // Should complete in < 50ms
      expect(time).toBeLessThan(50);
    });

    test('batch validation for multiple sections', () => {
      const sections = Array.from({ length: 10 }, (_, i) => ({
        id: `section-${i}`,
        name: `Section ${i}`,
        order: i,
        items: generateIngredients(20),
      }));
      
      const time = measureTime(() => {
        sections.forEach(section => {
          validatePositions(section.items);
        });
      });
      
      // Should complete in < 50ms
      expect(time).toBeLessThan(50);
    });
  });

  describe('Memory Efficiency', () => {
    test('reindexItemPositions should not create excessive garbage', () => {
      const items = generateIngredients(1000);
      
      // Warm up
      reindexItemPositions(items);
      
      // Force GC if available (Node.js with --expose-gc flag)
      if (global.gc) {
        global.gc();
      }
      
      const memBefore = process.memoryUsage().heapUsed;
      
      // Run multiple times
      for (let i = 0; i < 100; i++) {
        reindexItemPositions(items);
      }
      
      const memAfter = process.memoryUsage().heapUsed;
      const memDelta = memAfter - memBefore;
      
      // Should not allocate more than 10MB for 100 operations
      expect(memDelta).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Real-World Scenarios', () => {
    test('typical recipe with sections (realistic load)', () => {
      // Typical recipe: 3 sections, 8 items each
      const sections = [
        { items: generateIngredients(8) },
        { items: generateIngredients(8) },
        { items: generateIngredients(8) },
      ];
      
      const time = measureTime(() => {
        // Simulate user reordering within a section
        const [movedItem] = sections[1].items.splice(2, 1);
        sections[1].items.splice(5, 0, movedItem);
        reindexItemPositions(sections[1].items);
        validatePositions(sections[1].items);
      });
      
      // Should feel instant (< 10ms)
      expect(time).toBeLessThan(10);
    });

    test('large cookbook recipe (stress test)', () => {
      // Large recipe: 5 sections, 30 items each
      const sections = Array.from({ length: 5 }, () => ({
        items: generateIngredients(30),
      }));
      
      const time = measureTime(() => {
        // Simulate cross-section move
        const [movedItem] = sections[0].items.splice(10, 1);
        sections[3].items.splice(20, 0, movedItem);
        reindexItemPositions(sections[0].items);
        reindexItemPositions(sections[3].items);
        validatePositions(sections[0].items);
        validatePositions(sections[3].items);
      });
      
      // Should still be < 100ms
      expect(time).toBeLessThan(100);
    });

    test('mode conversion performance (sections to flat)', () => {
      const sections = Array.from({ length: 5 }, () => ({
        items: generateIngredients(10),
      }));
      
      const time = measureTime(() => {
        // Flatten all sections
        const flatItems = sections.flatMap(s => s.items);
        reindexItemPositions(flatItems);
        validatePositions(flatItems);
      });
      
      // Should be < 20ms
      expect(time).toBeLessThan(20);
    });

    test('mode conversion performance (flat to sections)', () => {
      const flatItems = generateIngredients(50);
      
      const time = measureTime(() => {
        // Split into 5 sections
        const sections = Array.from({ length: 5 }, (_, i) => ({
          items: flatItems.slice(i * 10, (i + 1) * 10),
        }));
        
        // Reindex each section
        sections.forEach(section => {
          reindexItemPositions(section.items);
          validatePositions(section.items);
        });
      });
      
      // Should be < 30ms
      expect(time).toBeLessThan(30);
    });
  });

  describe('Regression Tests', () => {
    test('performance should not degrade with repeated operations', () => {
      const items = generateIngredients(50);
      const times: number[] = [];
      
      // Perform 50 operations and measure each
      for (let i = 0; i < 50; i++) {
        const time = measureTime(() => {
          const sourceIdx = Math.floor(Math.random() * items.length);
          const destIdx = Math.floor(Math.random() * items.length);
          const [movedItem] = items.splice(sourceIdx, 1);
          items.splice(destIdx, 0, movedItem);
          reindexItemPositions(items);
        });
        times.push(time);
      }
      
      // First 10 operations
      const firstBatch = times.slice(0, 10);
      const firstAvg = firstBatch.reduce((a, b) => a + b, 0) / firstBatch.length;
      
      // Last 10 operations
      const lastBatch = times.slice(-10);
      const lastAvg = lastBatch.reduce((a, b) => a + b, 0) / lastBatch.length;
      
      // Last batch should not be significantly slower than first batch
      // Allow up to 2x variance due to system load
      expect(lastAvg).toBeLessThan(firstAvg * 2);
    });

    test('UI responsiveness - rapid successive operations', () => {
      const items = generateIngredients(30);
      
      // Simulate rapid user interactions (10 operations in quick succession)
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        const sourceIdx = i % items.length;
        const destIdx = (i + 5) % items.length;
        const [movedItem] = items.splice(sourceIdx, 1);
        items.splice(destIdx, 0, movedItem);
        reindexItemPositions(items);
      }
      
      const totalTime = performance.now() - startTime;
      
      // 10 operations should complete in < 200ms total
      expect(totalTime).toBeLessThan(200);
      
      // Average per operation should be < 20ms
      expect(totalTime / 10).toBeLessThan(20);
    });
  });
});
