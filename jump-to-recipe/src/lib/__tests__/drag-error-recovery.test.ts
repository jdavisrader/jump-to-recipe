/**
 * Tests for Drag Error Recovery Utilities
 * 
 * Tests error detection, recovery mechanisms, and data validation
 * for drag-and-drop operations.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  SnapshotManager,
  validateDragDestination,
  detectPositionConflicts,
  autoCorrectPositions,
  validateIngredientData,
  validateSectionData,
  DragOperationError,
  DragErrorType,
  type IngredientSnapshot,
} from '../drag-error-recovery';
import type { Ingredient } from '@/types/recipe';
import type { IngredientSection } from '@/types/sections';

describe('SnapshotManager', () => {
  let manager: SnapshotManager;

  beforeEach(() => {
    manager = new SnapshotManager();
  });

  it('should create and store snapshots', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
      { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
    ];

    const snapshot = manager.createSnapshot(ingredients, undefined, 'flat');

    expect(snapshot).toBeDefined();
    expect(snapshot.mode).toBe('flat');
    expect(snapshot.ingredients).toHaveLength(2);
    expect(snapshot.timestamp).toBeGreaterThan(0);
  });

  it('should retrieve the latest snapshot', () => {
    const ingredients1: Ingredient[] = [
      { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
    ];
    const ingredients2: Ingredient[] = [
      { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
      { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
    ];

    manager.createSnapshot(ingredients1, undefined, 'flat');
    const snapshot2 = manager.createSnapshot(ingredients2, undefined, 'flat');

    const latest = manager.getLatestSnapshot();
    expect(latest).toEqual(snapshot2);
    expect(latest?.ingredients).toHaveLength(2);
  });

  it('should limit the number of stored snapshots', () => {
    // Create more than maxSnapshots (10)
    for (let i = 0; i < 15; i++) {
      manager.createSnapshot(
        [{ id: `${i}`, name: `Item ${i}`, amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 }],
        undefined,
        'flat'
      );
    }

    expect(manager.getSnapshotCount()).toBe(10);
  });

  it('should create deep copies of data', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
    ];

    const snapshot = manager.createSnapshot(ingredients, undefined, 'flat');

    // Modify original
    ingredients[0].name = 'Modified';

    // Snapshot should be unchanged
    expect(snapshot.ingredients![0].name).toBe('Flour');
  });

  it('should clear all snapshots', () => {
    manager.createSnapshot(
      [{ id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 }],
      undefined,
      'flat'
    );

    expect(manager.getSnapshotCount()).toBe(1);

    manager.clearSnapshots();

    expect(manager.getSnapshotCount()).toBe(0);
    expect(manager.getLatestSnapshot()).toBeNull();
  });
});

describe('validateDragDestination', () => {
  it('should reject null destination', () => {
    const result = validateDragDestination(null);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe(DragErrorType.INVALID_DESTINATION);
  });

  it('should reject undefined destination', () => {
    const result = validateDragDestination(undefined);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject negative index', () => {
    const result = validateDragDestination({ droppableId: 'flat-ingredients-list', index: -1 });

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe(DragErrorType.INVALID_INDEX);
  });

  it('should reject missing section', () => {
    const sections: IngredientSection[] = [
      { id: 'section-1', name: 'Section 1', order: 0, items: [] },
    ];

    const result = validateDragDestination(
      { droppableId: 'section-nonexistent', index: 0 },
      sections
    );

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe(DragErrorType.MISSING_SECTION);
  });

  it('should reject index exceeding section length', () => {
    const sections: IngredientSection[] = [
      {
        id: 'section-1',
        name: 'Section 1',
        order: 0,
        items: [
          { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        ],
      },
    ];

    const result = validateDragDestination(
      { droppableId: 'section-section-1', index: 5 },
      sections
    );

    expect(result.isValid).toBe(false);
    expect(result.error?.type).toBe(DragErrorType.INVALID_INDEX);
  });

  it('should accept valid flat list destination', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
      { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
    ];

    const result = validateDragDestination(
      { droppableId: 'flat-ingredients-list', index: 1 },
      undefined,
      ingredients
    );

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept valid section destination', () => {
    const sections: IngredientSection[] = [
      {
        id: 'section-1',
        name: 'Section 1',
        order: 0,
        items: [
          { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        ],
      },
    ];

    const result = validateDragDestination(
      { droppableId: 'section-section-1', index: 1 },
      sections
    );

    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('detectPositionConflicts', () => {
  it('should detect duplicate positions', () => {
    const items = [
      { id: '1', position: 0 },
      { id: '2', position: 0 }, // duplicate
      { id: '3', position: 1 },
    ];

    const result = detectPositionConflicts(items);

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].position).toBe(0);
    expect(result.conflicts[0].ids).toEqual(['1', '2']);
  });

  it('should detect multiple conflicts', () => {
    const items = [
      { id: '1', position: 0 },
      { id: '2', position: 0 },
      { id: '3', position: 1 },
      { id: '4', position: 1 },
    ];

    const result = detectPositionConflicts(items);

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toHaveLength(2);
  });

  it('should return no conflicts for valid positions', () => {
    const items = [
      { id: '1', position: 0 },
      { id: '2', position: 1 },
      { id: '3', position: 2 },
    ];

    const result = detectPositionConflicts(items);

    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts).toHaveLength(0);
  });

  it('should handle items without positions', () => {
    const items = [
      { id: '1' },
      { id: '2', position: 0 },
      { id: '3' },
    ];

    const result = detectPositionConflicts(items);

    expect(result.hasConflicts).toBe(false);
  });
});

describe('autoCorrectPositions', () => {
  it('should fix duplicate positions', () => {
    const items = [
      { id: '1', name: 'A', position: 0 },
      { id: '2', name: 'B', position: 0 },
      { id: '3', name: 'C', position: 1 },
    ];

    const corrected = autoCorrectPositions(items);

    expect(corrected).toHaveLength(3);
    expect(corrected[0]).toHaveProperty('position', 0);
    expect(corrected[1]).toHaveProperty('position', 1);
    expect(corrected[2]).toHaveProperty('position', 2);
  });

  it('should add missing positions', () => {
    const items = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];

    const corrected = autoCorrectPositions(items);

    expect(corrected[0]).toHaveProperty('position', 0);
    expect(corrected[1]).toHaveProperty('position', 1);
  });

  it('should normalize non-sequential positions', () => {
    const items = [
      { id: '1', name: 'A', position: 5 },
      { id: '2', name: 'B', position: 10 },
      { id: '3', name: 'C', position: 2 },
    ];

    const corrected = autoCorrectPositions(items);

    // Should be sorted by position and reindexed
    expect(corrected[0].id).toBe('3'); // was position 2
    expect(corrected[0]).toHaveProperty('position', 0);
    expect(corrected[1].id).toBe('1'); // was position 5
    expect(corrected[1]).toHaveProperty('position', 1);
    expect(corrected[2].id).toBe('2'); // was position 10
    expect(corrected[2]).toHaveProperty('position', 2);
  });

  it('should preserve other properties', () => {
    const items = [
      { id: '1', name: 'Flour', amount: 2, position: 1 },
      { id: '2', name: 'Sugar', amount: 1, position: 0 },
    ];

    const corrected = autoCorrectPositions(items);

    expect(corrected[0].name).toBe('Sugar');
    expect(corrected[0].amount).toBe(1);
    expect(corrected[1].name).toBe('Flour');
    expect(corrected[1].amount).toBe(2);
  });
});

describe('validateIngredientData', () => {
  it('should validate correct ingredient data', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
      { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
    ];

    const result = validateIngredientData(ingredients);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing IDs', () => {
    const ingredients = [
      { id: '', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
    ] as Ingredient[];

    const result = validateIngredientData(ingredients);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing an ID'))).toBe(true);
  });

  it('should detect duplicate IDs', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
      { id: '1', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
    ];

    const result = validateIngredientData(ingredients);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate ingredient ID'))).toBe(true);
  });

  it('should detect negative amounts', () => {
    const ingredients: Ingredient[] = [
      { id: '1', name: 'Flour', amount: -2, unit: 'cup', displayAmount: '-2', notes: '', position: 0 },
    ];

    const result = validateIngredientData(ingredients);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('negative amount'))).toBe(true);
  });
});

describe('validateSectionData', () => {
  it('should validate correct section data', () => {
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

    const result = validateSectionData(sections);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing section IDs', () => {
    const sections = [
      {
        id: '',
        name: 'Dry Ingredients',
        order: 0,
        items: [],
      },
    ] as IngredientSection[];

    const result = validateSectionData(sections);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing an ID'))).toBe(true);
  });

  it('should detect duplicate section IDs', () => {
    const sections: IngredientSection[] = [
      { id: 'section-1', name: 'Section 1', order: 0, items: [] },
      { id: 'section-1', name: 'Section 2', order: 1, items: [] },
    ];

    const result = validateSectionData(sections);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate section ID'))).toBe(true);
  });

  it('should detect empty section names', () => {
    const sections: IngredientSection[] = [
      { id: 'section-1', name: '', order: 0, items: [] },
    ];

    const result = validateSectionData(sections);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('empty name'))).toBe(true);
  });

  it('should validate items within sections', () => {
    const sections: IngredientSection[] = [
      {
        id: 'section-1',
        name: 'Ingredients',
        order: 0,
        items: [
          { id: '1', name: 'Flour', amount: -2, unit: 'cup', displayAmount: '-2', notes: '', position: 0 },
        ],
      },
    ];

    const result = validateSectionData(sections);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('negative amount'))).toBe(true);
  });
});

describe('DragOperationError', () => {
  it('should create error with type and message', () => {
    const error = new DragOperationError(
      DragErrorType.INVALID_DESTINATION,
      'Test error message'
    );

    expect(error.type).toBe(DragErrorType.INVALID_DESTINATION);
    expect(error.message).toBe('Test error message');
    expect(error.name).toBe('DragOperationError');
  });

  it('should include context data', () => {
    const context = { index: 5, sectionId: 'test' };
    const error = new DragOperationError(
      DragErrorType.INVALID_INDEX,
      'Invalid index',
      context
    );

    expect(error.context).toEqual(context);
  });
});
