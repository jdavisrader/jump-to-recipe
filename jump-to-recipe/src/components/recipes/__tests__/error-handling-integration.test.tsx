/**
 * Integration Tests for Error Handling in Drag-and-Drop
 * 
 * Tests error scenarios, recovery mechanisms, and user feedback
 * for drag-and-drop operations in the recipe ingredients component.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Ingredient } from '@/types/recipe';
import type { IngredientSection } from '@/types/sections';
import * as errorRecovery from '@/lib/drag-error-recovery';

describe('Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Invalid Drop Destinations', () => {
    it('should handle drop outside valid area', () => {
      const dragResult = {
        draggableId: '1',
        type: 'DEFAULT',
        source: { droppableId: 'flat-ingredients-list', index: 0 },
        destination: null,
        reason: 'DROP' as const,
        mode: 'FLUID' as const,
        combine: null,
      };

      // The component should handle this gracefully
      const validation = errorRecovery.validateDragDestination(dragResult.destination);
      expect(validation.isValid).toBe(false);
      expect(validation.error?.type).toBe(errorRecovery.DragErrorType.INVALID_DESTINATION);
    });

    it('should handle invalid section destination', () => {
      const sections: IngredientSection[] = [
        {
          id: 'section-1',
          name: 'Dry Ingredients',
          order: 0,
          items: [
            { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
          ],
        },
      ];

      const validation = errorRecovery.validateDragDestination(
        { droppableId: 'section-nonexistent', index: 0 },
        sections
      );

      expect(validation.isValid).toBe(false);
      expect(validation.error?.type).toBe(errorRecovery.DragErrorType.MISSING_SECTION);
    });
  });

  describe('Position Conflicts', () => {
    it('should detect position conflicts', () => {
      const items = [
        { id: '1', name: 'Flour', position: 0 },
        { id: '2', name: 'Sugar', position: 0 }, // duplicate position
        { id: '3', name: 'Salt', position: 1 },
      ];

      const conflicts = errorRecovery.detectPositionConflicts(items);

      expect(conflicts.hasConflicts).toBe(true);
      expect(conflicts.conflicts).toHaveLength(1);
      expect(conflicts.conflicts[0].position).toBe(0);
      expect(conflicts.conflicts[0].ids).toContain('1');
      expect(conflicts.conflicts[0].ids).toContain('2');
    });

    it('should auto-correct position conflicts', () => {
      const items = [
        { id: '1', name: 'Flour', position: 0 },
        { id: '2', name: 'Sugar', position: 0 },
        { id: '3', name: 'Salt', position: 1 },
      ];

      const corrected = errorRecovery.autoCorrectPositions(items);

      // All positions should be sequential
      expect(corrected[0].position).toBe(0);
      expect(corrected[1].position).toBe(1);
      expect(corrected[2].position).toBe(2);

      // Data should be preserved
      expect(corrected.map((i) => i.name)).toContain('Flour');
      expect(corrected.map((i) => i.name)).toContain('Sugar');
      expect(corrected.map((i) => i.name)).toContain('Salt');
    });
  });

  describe('Data Validation', () => {
    it('should validate ingredient data', () => {
      const validIngredients: Ingredient[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
      ];

      const result = errorRecovery.validateIngredientData(validIngredients);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid ingredient data', () => {
      const invalidIngredients: Ingredient[] = [
        { id: '1', name: 'Flour', amount: -2, unit: 'cup', displayAmount: '-2', notes: '', position: 0 },
        { id: '', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
      ];

      const result = errorRecovery.validateIngredientData(invalidIngredients);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes('negative amount'))).toBe(true);
      expect(result.errors.some((e) => e.includes('missing an ID'))).toBe(true);
    });

    it('should validate section data', () => {
      const validSections: IngredientSection[] = [
        {
          id: 'section-1',
          name: 'Dry Ingredients',
          order: 0,
          items: [
            { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
          ],
        },
      ];

      const result = errorRecovery.validateSectionData(validSections);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid section data', () => {
      const invalidSections: IngredientSection[] = [
        {
          id: '',
          name: '',
          order: 0,
          items: [
            { id: '1', name: 'Flour', amount: -2, unit: 'cup', displayAmount: '-2', notes: '', position: 0 },
          ],
        },
      ];

      const result = errorRecovery.validateSectionData(invalidSections);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Snapshot Management', () => {
    it('should create and retrieve snapshots', () => {
      const manager = new errorRecovery.SnapshotManager();

      const ingredients: Ingredient[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
      ];

      const snapshot = manager.createSnapshot(ingredients, undefined, 'flat');

      expect(snapshot).toBeDefined();
      expect(snapshot.ingredients).toHaveLength(1);
      expect(snapshot.mode).toBe('flat');

      const retrieved = manager.getLatestSnapshot();
      expect(retrieved).toEqual(snapshot);
    });

    it('should maintain snapshot history', () => {
      const manager = new errorRecovery.SnapshotManager();

      const ingredients1: Ingredient[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
      ];
      const ingredients2: Ingredient[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
      ];

      manager.createSnapshot(ingredients1, undefined, 'flat');
      manager.createSnapshot(ingredients2, undefined, 'flat');

      expect(manager.getSnapshotCount()).toBe(2);

      const latest = manager.getLatestSnapshot();
      expect(latest?.ingredients).toHaveLength(2);
    });

    it('should limit snapshot count', () => {
      const manager = new errorRecovery.SnapshotManager();

      // Create more than the limit (10)
      for (let i = 0; i < 15; i++) {
        manager.createSnapshot(
          [{ id: `${i}`, name: `Item ${i}`, amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 }],
          undefined,
          'flat'
        );
      }

      expect(manager.getSnapshotCount()).toBe(10);
    });
  });

  describe('Error Recovery', () => {
    it('should revert to snapshot on error', () => {
      const manager = new errorRecovery.SnapshotManager();

      const originalIngredients: Ingredient[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
      ];

      const snapshot = manager.createSnapshot(originalIngredients, undefined, 'flat');

      // Simulate an error and recovery
      const error = new errorRecovery.DragOperationError(
        errorRecovery.DragErrorType.DATA_CORRUPTION,
        'Test error'
      );

      let reverted = false;
      const onRevert = (snap: errorRecovery.IngredientSnapshot) => {
        reverted = true;
        expect(snap).toEqual(snapshot);
      };

      errorRecovery.recoverFromDragError(error, snapshot, onRevert);

      expect(reverted).toBe(true);
    });
  });

  describe('Error Messages', () => {
    it('should create appropriate error messages for different error types', () => {
      const errorTypes = [
        errorRecovery.DragErrorType.INVALID_DESTINATION,
        errorRecovery.DragErrorType.POSITION_CONFLICT,
        errorRecovery.DragErrorType.MISSING_SECTION,
        errorRecovery.DragErrorType.INVALID_INDEX,
        errorRecovery.DragErrorType.DATA_CORRUPTION,
        errorRecovery.DragErrorType.SAVE_FAILURE,
      ];

      errorTypes.forEach((type) => {
        const error = new errorRecovery.DragOperationError(type, 'Test error');
        
        // Should create error without throwing
        expect(error.type).toBe(type);
        expect(error.message).toBe('Test error');
      });
    });
  });
});
