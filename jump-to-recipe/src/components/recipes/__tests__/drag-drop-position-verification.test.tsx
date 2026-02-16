/**
 * Drag-and-Drop Position Verification Tests
 * 
 * Task 8: Update drag-and-drop handlers
 * 
 * This test suite verifies that:
 * 1. Position is maintained during within-section reorder (Requirement 3.4)
 * 2. Position is recalculated during cross-section move (Requirement 4.3)
 * 3. Position is updated during flat list reorder (Requirement 3.4)
 * 4. Position conflict detection works correctly (Requirement 6.3, 6.4)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { reorderWithinSection, moveBetweenSections } from '@/lib/section-position-utils';
import { detectPositionConflicts, autoCorrectPositions } from '@/lib/drag-error-recovery';
import type { Ingredient } from '@/types/recipe';

describe('Drag-and-Drop Position Verification', () => {
  describe('Within-Section Reorder', () => {
    it('should maintain position property during reorder', () => {
      // Requirement 3.4: Position maintained during within-section reorder
      const items: Ingredient[] = [
        { id: 'a', name: 'Flour', amount: 2, unit: 'cups', position: 0 },
        { id: 'b', name: 'Sugar', amount: 1, unit: 'cup', position: 1 },
        { id: 'c', name: 'Salt', amount: 1, unit: 'tsp', position: 2 },
      ];

      const reordered = reorderWithinSection(items, 0, 2);

      // Verify all items have position property
      expect(reordered).toHaveLength(3);
      reordered.forEach((item) => {
        expect(item).toHaveProperty('position');
        expect(typeof item.position).toBe('number');
      });

      // Verify positions are sequential
      expect(reordered[0].position).toBe(0);
      expect(reordered[1].position).toBe(1);
      expect(reordered[2].position).toBe(2);

      // Verify order is correct
      expect(reordered[0].id).toBe('b'); // Sugar moved to first
      expect(reordered[1].id).toBe('c'); // Salt moved to second
      expect(reordered[2].id).toBe('a'); // Flour moved to last
    });

    it('should update positions when moving item forward', () => {
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
        { id: 'c', name: 'Item C', amount: 1, unit: 'cup', position: 2 },
        { id: 'd', name: 'Item D', amount: 1, unit: 'cup', position: 3 },
      ];

      const reordered = reorderWithinSection(items, 1, 3);

      // Item B moved from position 1 to position 3
      expect(reordered[0].id).toBe('a');
      expect(reordered[0].position).toBe(0);
      expect(reordered[1].id).toBe('c');
      expect(reordered[1].position).toBe(1);
      expect(reordered[2].id).toBe('d');
      expect(reordered[2].position).toBe(2);
      expect(reordered[3].id).toBe('b');
      expect(reordered[3].position).toBe(3);
    });

    it('should update positions when moving item backward', () => {
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
        { id: 'c', name: 'Item C', amount: 1, unit: 'cup', position: 2 },
        { id: 'd', name: 'Item D', amount: 1, unit: 'cup', position: 3 },
      ];

      const reordered = reorderWithinSection(items, 3, 1);

      // Item D moved from position 3 to position 1
      expect(reordered[0].id).toBe('a');
      expect(reordered[0].position).toBe(0);
      expect(reordered[1].id).toBe('d');
      expect(reordered[1].position).toBe(1);
      expect(reordered[2].id).toBe('b');
      expect(reordered[2].position).toBe(2);
      expect(reordered[3].id).toBe('c');
      expect(reordered[3].position).toBe(3);
    });

    it('should handle reordering with non-sequential initial positions', () => {
      // Items with gaps in positions (e.g., from legacy data)
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 5 },
        { id: 'c', name: 'Item C', amount: 1, unit: 'cup', position: 10 },
      ];

      const reordered = reorderWithinSection(items, 0, 2);

      // After reorder, positions should be sequential
      expect(reordered[0].position).toBe(0);
      expect(reordered[1].position).toBe(1);
      expect(reordered[2].position).toBe(2);
    });
  });

  describe('Cross-Section Move', () => {
    it('should recalculate position when moving between sections', () => {
      // Requirement 4.3: Position recalculated during cross-section move
      const sourceItems: Ingredient[] = [
        { id: 'a', name: 'Flour', amount: 2, unit: 'cups', position: 0 },
        { id: 'b', name: 'Sugar', amount: 1, unit: 'cup', position: 1 },
      ];

      const destItems: Ingredient[] = [
        { id: 'c', name: 'Milk', amount: 1, unit: 'cup', position: 0 },
        { id: 'd', name: 'Eggs', amount: 2, unit: 'whole', position: 1 },
      ];

      const result = moveBetweenSections(sourceItems, destItems, 0, 1);

      // Verify source items have updated positions
      expect(result.sourceItems).toHaveLength(1);
      expect(result.sourceItems[0].id).toBe('b');
      expect(result.sourceItems[0].position).toBe(0); // Reindexed

      // Verify dest items have updated positions
      expect(result.destItems).toHaveLength(3);
      expect(result.destItems[0].id).toBe('c');
      expect(result.destItems[0].position).toBe(0);
      expect(result.destItems[1].id).toBe('a'); // Moved item
      expect(result.destItems[1].position).toBe(1);
      expect(result.destItems[2].id).toBe('d');
      expect(result.destItems[2].position).toBe(2);
    });

    it('should handle moving to empty section', () => {
      const sourceItems: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
      ];

      const destItems: Ingredient[] = [];

      const result = moveBetweenSections(sourceItems, destItems, 0, 0);

      // Source should have one less item
      expect(result.sourceItems).toHaveLength(1);
      expect(result.sourceItems[0].id).toBe('b');
      expect(result.sourceItems[0].position).toBe(0);

      // Dest should have the moved item
      expect(result.destItems).toHaveLength(1);
      expect(result.destItems[0].id).toBe('a');
      expect(result.destItems[0].position).toBe(0);
    });

    it('should handle moving from section with one item', () => {
      const sourceItems: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
      ];

      const destItems: Ingredient[] = [
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 0 },
      ];

      const result = moveBetweenSections(sourceItems, destItems, 0, 1);

      // Source should be empty
      expect(result.sourceItems).toHaveLength(0);

      // Dest should have both items
      expect(result.destItems).toHaveLength(2);
      expect(result.destItems[0].id).toBe('b');
      expect(result.destItems[0].position).toBe(0);
      expect(result.destItems[1].id).toBe('a');
      expect(result.destItems[1].position).toBe(1);
    });

    it('should maintain position scope within each section', () => {
      // Requirement 4.1, 4.2: Position scoped to container
      const sourceItems: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
        { id: 'c', name: 'Item C', amount: 1, unit: 'cup', position: 2 },
      ];

      const destItems: Ingredient[] = [
        { id: 'd', name: 'Item D', amount: 1, unit: 'cup', position: 0 },
        { id: 'e', name: 'Item E', amount: 1, unit: 'cup', position: 1 },
      ];

      const result = moveBetweenSections(sourceItems, destItems, 1, 0);

      // Source positions should be 0, 1 (sequential within source)
      expect(result.sourceItems[0].position).toBe(0);
      expect(result.sourceItems[1].position).toBe(1);

      // Dest positions should be 0, 1, 2 (sequential within dest)
      expect(result.destItems[0].position).toBe(0);
      expect(result.destItems[1].position).toBe(1);
      expect(result.destItems[2].position).toBe(2);
    });
  });

  describe('Flat List Reorder', () => {
    it('should update position during flat list reorder', () => {
      // Requirement 3.4: Position updated during flat list reorder
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
        { id: 'c', name: 'Item C', amount: 1, unit: 'cup', position: 2 },
      ];

      const reordered = reorderWithinSection(items, 2, 0);

      // Item C moved from position 2 to position 0
      expect(reordered[0].id).toBe('c');
      expect(reordered[0].position).toBe(0);
      expect(reordered[1].id).toBe('a');
      expect(reordered[1].position).toBe(1);
      expect(reordered[2].id).toBe('b');
      expect(reordered[2].position).toBe(2);
    });

    it('should handle large flat list reordering', () => {
      const items: Ingredient[] = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        amount: 1,
        unit: 'cup',
        position: i,
      }));

      const reordered = reorderWithinSection(items, 0, 9);

      // First item moved to last position
      expect(reordered[0].id).toBe('item-1');
      expect(reordered[9].id).toBe('item-0');

      // All positions should be sequential
      reordered.forEach((item, index) => {
        expect(item.position).toBe(index);
      });
    });
  });

  describe('Position Conflict Detection', () => {
    it('should detect duplicate positions', () => {
      // Requirement 6.3: Reject duplicate values within same scope
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
        { id: 'c', name: 'Item C', amount: 1, unit: 'cup', position: 1 }, // Duplicate
      ];

      const conflicts = detectPositionConflicts(items);

      expect(conflicts.hasConflicts).toBe(true);
      expect(conflicts.conflicts).toHaveLength(1);
      expect(conflicts.conflicts[0].position).toBe(1);
      expect(conflicts.conflicts[0].ids).toContain('b');
      expect(conflicts.conflicts[0].ids).toContain('c');
    });

    it('should not detect conflicts when positions are unique', () => {
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
        { id: 'c', name: 'Item C', amount: 1, unit: 'cup', position: 2 },
      ];

      const conflicts = detectPositionConflicts(items);

      expect(conflicts.hasConflicts).toBe(false);
      expect(conflicts.conflicts).toHaveLength(0);
    });

    it('should handle items without position property', () => {
      const items: Array<{ id: string; name: string; amount: number; unit: string; position?: number }> = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup' }, // No position
      ];

      const conflicts = detectPositionConflicts(items);

      // Should not report conflicts for missing positions
      expect(conflicts.hasConflicts).toBe(false);
    });

    it('should auto-correct duplicate positions', () => {
      // Requirement 6.4: Auto-correct to sequential values
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
        { id: 'c', name: 'Item C', amount: 1, unit: 'cup', position: 1 }, // Duplicate
      ];

      const corrected = autoCorrectPositions(items);

      // All positions should be sequential
      expect(corrected[0].position).toBe(0);
      expect(corrected[1].position).toBe(1);
      expect(corrected[2].position).toBe(2);

      // No duplicates
      const positions = corrected.map((item) => item.position);
      const uniquePositions = new Set(positions);
      expect(positions.length).toBe(uniquePositions.size);
    });

    it('should auto-correct negative positions', () => {
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: -1 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 0 },
      ];

      const corrected = autoCorrectPositions(items);

      // All positions should be non-negative and sequential
      expect(corrected[0].position).toBe(0);
      expect(corrected[1].position).toBe(1);
    });

    it('should auto-correct position gaps', () => {
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 5 },
        { id: 'c', name: 'Item C', amount: 1, unit: 'cup', position: 10 },
      ];

      const corrected = autoCorrectPositions(items);

      // Positions should be sequential with no gaps
      expect(corrected[0].position).toBe(0);
      expect(corrected[1].position).toBe(1);
      expect(corrected[2].position).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays', () => {
      const items: Ingredient[] = [];
      const reordered = reorderWithinSection(items, 0, 0);
      expect(reordered).toEqual([]);
    });

    it('should handle single item array', () => {
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
      ];

      const reordered = reorderWithinSection(items, 0, 0);
      expect(reordered).toHaveLength(1);
      expect(reordered[0].position).toBe(0);
    });

    it('should throw error for invalid source index', () => {
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
      ];

      expect(() => {
        reorderWithinSection(items, 5, 0);
      }).toThrow();
    });

    it('should throw error for invalid destination index', () => {
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
      ];

      expect(() => {
        reorderWithinSection(items, 0, 5);
      }).toThrow();
    });

    it('should handle moving to same position', () => {
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
      ];

      const reordered = reorderWithinSection(items, 1, 1);

      // No change expected
      expect(reordered[0].id).toBe('a');
      expect(reordered[1].id).toBe('b');
    });
  });

  describe('Position Property Preservation', () => {
    it('should preserve position property throughout drag operation', () => {
      // Requirement 3.1, 3.2: Position kept in form state throughout lifecycle
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
      ];

      // Simulate drag operation
      const reordered = reorderWithinSection(items, 0, 1);

      // Position should be present in all items
      reordered.forEach((item) => {
        expect(item).toHaveProperty('position');
        expect(typeof item.position).toBe('number');
        expect(Number.isInteger(item.position)).toBe(true);
        expect(item.position).toBeGreaterThanOrEqual(0);
      });
    });

    it('should maintain position property after drag', () => {
      // Verify position is maintained throughout drag operations
      const items: Ingredient[] = [
        { id: 'a', name: 'Item A', amount: 1, unit: 'cup', position: 0 },
        { id: 'b', name: 'Item B', amount: 1, unit: 'cup', position: 1 },
      ];

      const reordered = reorderWithinSection(items, 1, 0);

      // Position should be present and updated
      expect(reordered[0]).toHaveProperty('position');
      expect(reordered[1]).toHaveProperty('position');
    });
  });
});
