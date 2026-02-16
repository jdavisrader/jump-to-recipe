/**
 * Position Persistence Tests
 * 
 * Tests for database persistence of ingredient positions
 * Validates Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { describe, it, expect } from '@jest/globals';
import { 
  normalizeExistingRecipe,
  createNormalizationSummary 
} from '../recipe-import-normalizer';

describe('Position Persistence', () => {
  describe('Position Assignment on Load', () => {
    it('should assign positions to ingredients without positions', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Main',
            order: 0,
            items: [
              { id: 'ing-1', name: 'Flour', amount: 2, unit: 'cup' } as any, // No position
              { id: 'ing-2', name: 'Sugar', amount: 1, unit: 'cup' } as any, // No position
              { id: 'ing-3', name: 'Eggs', amount: 3, unit: '' } as any, // No position
            ],
          },
        ],
      };

      const summary = createNormalizationSummary();
      const normalized = normalizeExistingRecipe(recipe, summary);

      // Verify positions were assigned
      expect(summary.positionsAssigned).toBeGreaterThan(0);
      expect(normalized.ingredientSections[0].items[0].position).toBe(0);
      expect(normalized.ingredientSections[0].items[1].position).toBe(1);
      expect(normalized.ingredientSections[0].items[2].position).toBe(2);
    });

    it('should sort ingredients by position when loading (Requirement 6.2)', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Main',
            order: 0,
            items: [
              { id: 'ing-1', name: 'Flour', amount: 2, unit: 'cup', position: 2 },
              { id: 'ing-2', name: 'Sugar', amount: 1, unit: 'cup', position: 0 },
              { id: 'ing-3', name: 'Eggs', amount: 3, unit: '', position: 1 },
            ],
          },
        ],
      };

      const normalized = normalizeExistingRecipe(recipe);

      // Verify ingredients are sorted by position
      expect(normalized.ingredientSections[0].items[0].name).toBe('Sugar');
      expect(normalized.ingredientSections[0].items[0].position).toBe(0);
      expect(normalized.ingredientSections[0].items[1].name).toBe('Eggs');
      expect(normalized.ingredientSections[0].items[1].position).toBe(1);
      expect(normalized.ingredientSections[0].items[2].name).toBe('Flour');
      expect(normalized.ingredientSections[0].items[2].position).toBe(2);
    });

    it('should handle mixed positioned and non-positioned ingredients', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Main',
            order: 0,
            items: [
              { id: 'ing-1', name: 'Flour', amount: 2, unit: 'cup', position: 0 },
              { id: 'ing-2', name: 'Sugar', amount: 1, unit: 'cup' } as any, // No position
              { id: 'ing-3', name: 'Eggs', amount: 3, unit: '', position: 2 },
            ],
          },
        ],
      };

      const summary = createNormalizationSummary();
      const normalized = normalizeExistingRecipe(recipe, summary);

      // Verify all items have positions
      expect(normalized.ingredientSections[0].items.every((item: any) => 
        typeof item.position === 'number'
      )).toBe(true);

      // Verify positions are sequential
      const positions = normalized.ingredientSections[0].items.map((item: any) => item.position);
      expect(positions).toEqual([0, 1, 2]);
    });
  });

  describe('Position Preservation', () => {
    it('should preserve existing positions', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Main',
            order: 0,
            items: [
              { id: 'ing-1', name: 'Flour', amount: 2, unit: 'cup', position: 0 },
              { id: 'ing-2', name: 'Sugar', amount: 1, unit: 'cup', position: 1 },
              { id: 'ing-3', name: 'Eggs', amount: 3, unit: '', position: 2 },
            ],
          },
        ],
      };

      const summary = createNormalizationSummary();
      const normalized = normalizeExistingRecipe(recipe, summary);

      // Verify positions were not reassigned (already valid)
      expect(summary.positionsAssigned).toBe(0);
      expect(normalized.ingredientSections[0].items[0].position).toBe(0);
      expect(normalized.ingredientSections[0].items[1].position).toBe(1);
      expect(normalized.ingredientSections[0].items[2].position).toBe(2);
    });
  });

  describe('Multiple Sections', () => {
    it('should handle positions across multiple sections', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              { id: 'ing-1', name: 'Flour', amount: 2, unit: 'cup', position: 1 },
              { id: 'ing-2', name: 'Sugar', amount: 1, unit: 'cup', position: 0 },
            ],
          },
          {
            id: 'section-2',
            name: 'Wet Ingredients',
            order: 1,
            items: [
              { id: 'ing-3', name: 'Milk', amount: 1, unit: 'cup', position: 1 },
              { id: 'ing-4', name: 'Eggs', amount: 2, unit: '', position: 0 },
            ],
          },
        ],
      };

      const normalized = normalizeExistingRecipe(recipe);

      // Verify each section's items are sorted independently
      expect(normalized.ingredientSections[0].items[0].name).toBe('Sugar');
      expect(normalized.ingredientSections[0].items[1].name).toBe('Flour');
      expect(normalized.ingredientSections[1].items[0].name).toBe('Eggs');
      expect(normalized.ingredientSections[1].items[1].name).toBe('Milk');
    });
  });

  describe('Empty Items Handling', () => {
    it('should drop empty ingredients and reindex positions', () => {
      const recipe = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Main',
            order: 0,
            items: [
              { id: 'ing-1', name: 'Flour', amount: 2, unit: 'cup', position: 0 },
              { id: 'ing-2', name: '', amount: 1, unit: 'cup', position: 1 }, // Empty name
              { id: 'ing-3', name: 'Eggs', amount: 3, unit: '', position: 2 },
            ],
          },
        ],
      };

      const summary = createNormalizationSummary();
      const normalized = normalizeExistingRecipe(recipe, summary);

      // Verify empty item was dropped
      expect(summary.itemsDropped).toBe(1);
      expect(normalized.ingredientSections[0].items.length).toBe(2);

      // Verify positions are sequential after dropping
      expect(normalized.ingredientSections[0].items[0].position).toBe(0);
      expect(normalized.ingredientSections[0].items[1].position).toBe(1);
    });
  });

  describe('Instruction Positions', () => {
    it('should handle instruction positions the same way', () => {
      const recipe = {
        title: 'Test Recipe',
        instructionSections: [
          {
            id: 'section-1',
            name: 'Preparation',
            order: 0,
            items: [
              { id: 'inst-1', step: 1, content: 'Mix dry ingredients', position: 2 },
              { id: 'inst-2', step: 2, content: 'Preheat oven', position: 0 },
              { id: 'inst-3', step: 3, content: 'Combine wet ingredients', position: 1 },
            ],
          },
        ],
      };

      const normalized = normalizeExistingRecipe(recipe);

      // Verify instructions are sorted by position
      expect(normalized.instructionSections[0].items[0].content).toBe('Preheat oven');
      expect(normalized.instructionSections[0].items[0].position).toBe(0);
      expect(normalized.instructionSections[0].items[1].content).toBe('Combine wet ingredients');
      expect(normalized.instructionSections[0].items[1].position).toBe(1);
      expect(normalized.instructionSections[0].items[2].content).toBe('Mix dry ingredients');
      expect(normalized.instructionSections[0].items[2].position).toBe(2);
    });
  });
});
