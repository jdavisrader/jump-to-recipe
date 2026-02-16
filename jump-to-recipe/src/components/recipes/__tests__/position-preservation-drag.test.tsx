/**
 * Position Preservation in Drag-and-Drop Tests
 * 
 * Tests that position property is maintained throughout drag-and-drop operations
 * Validates Requirements 3.1, 3.2, 3.4
 */

import { describe, it, expect } from '@jest/globals';
import type { Ingredient } from '@/types/recipe';
import type { IngredientSection } from '@/types/sections';
import { reorderWithinSection, moveBetweenSections } from '@/lib/section-position-utils';

describe('Position Preservation in Drag-and-Drop', () => {
  describe('Flat List Reordering', () => {
    it('should maintain position property after reordering', () => {
      const ingredients: (Ingredient & { position: number })[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 1 },
        { id: '3', name: 'Eggs', amount: 3, unit: '', displayAmount: '3', notes: '', position: 2 },
      ];

      // Reorder: move item from index 0 to index 2
      const reordered = reorderWithinSection(ingredients, 0, 2);

      // Verify all items have position property
      expect(reordered.every(item => typeof item.position === 'number')).toBe(true);

      // Verify positions are sequential
      expect(reordered[0].position).toBe(0);
      expect(reordered[1].position).toBe(1);
      expect(reordered[2].position).toBe(2);

      // Verify order changed correctly
      expect(reordered[0].name).toBe('Sugar');
      expect(reordered[1].name).toBe('Eggs');
      expect(reordered[2].name).toBe('Flour');
    });

    it('should preserve position property when no reordering occurs', () => {
      const ingredients: (Ingredient & { position: number })[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 1 },
      ];

      // No movement: same source and destination
      const reordered = reorderWithinSection(ingredients, 0, 0);

      // Verify position property is maintained
      expect(reordered[0].position).toBe(0);
      expect(reordered[1].position).toBe(1);
    });
  });

  describe('Within-Section Reordering', () => {
    it('should maintain position property when reordering within a section', () => {
      const items: (Ingredient & { position: number })[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 1 },
        { id: '3', name: 'Salt', amount: 1, unit: 'tsp', displayAmount: '1', notes: '', position: 2 },
      ];

      // Reorder: move item from index 2 to index 0
      const reordered = reorderWithinSection(items, 2, 0);

      // Verify all items have position property
      expect(reordered.every(item => typeof item.position === 'number')).toBe(true);

      // Verify positions are sequential
      expect(reordered[0].position).toBe(0);
      expect(reordered[1].position).toBe(1);
      expect(reordered[2].position).toBe(2);

      // Verify order changed correctly
      expect(reordered[0].name).toBe('Salt');
      expect(reordered[1].name).toBe('Flour');
      expect(reordered[2].name).toBe('Sugar');
    });
  });

  describe('Cross-Section Movement', () => {
    it('should maintain position property when moving between sections', () => {
      const sourceItems: (Ingredient & { position: number })[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 1 },
      ];

      const destItems: (Ingredient & { position: number })[] = [
        { id: '3', name: 'Milk', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
      ];

      // Move item from source index 0 to dest index 1
      const result = moveBetweenSections(sourceItems, destItems, 0, 1);

      // Verify all items in both sections have position property
      expect(result.sourceItems.every(item => typeof item.position === 'number')).toBe(true);
      expect(result.destItems.every(item => typeof item.position === 'number')).toBe(true);

      // Verify source positions are sequential
      expect(result.sourceItems[0].position).toBe(0);

      // Verify dest positions are sequential
      expect(result.destItems[0].position).toBe(0);
      expect(result.destItems[1].position).toBe(1);

      // Verify the moved item is in destination
      expect(result.destItems[1].name).toBe('Flour');
    });

    it('should recalculate positions correctly for both sections', () => {
      const sourceItems: (Ingredient & { position: number })[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 1 },
        { id: '3', name: 'Salt', amount: 1, unit: 'tsp', displayAmount: '1', notes: '', position: 2 },
      ];

      const destItems: (Ingredient & { position: number })[] = [
        { id: '4', name: 'Milk', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 0 },
        { id: '5', name: 'Eggs', amount: 2, unit: '', displayAmount: '2', notes: '', position: 1 },
      ];

      // Move item from source index 1 to dest index 0
      const result = moveBetweenSections(sourceItems, destItems, 1, 0);

      // Verify source has 2 items with sequential positions
      expect(result.sourceItems.length).toBe(2);
      expect(result.sourceItems[0].position).toBe(0);
      expect(result.sourceItems[1].position).toBe(1);

      // Verify dest has 3 items with sequential positions
      expect(result.destItems.length).toBe(3);
      expect(result.destItems[0].position).toBe(0);
      expect(result.destItems[1].position).toBe(1);
      expect(result.destItems[2].position).toBe(2);

      // Verify the moved item is at the correct position
      expect(result.destItems[0].name).toBe('Sugar');
    });
  });

  describe('Position Property Type Safety', () => {
    it('should ensure position is always a number', () => {
      const items: (Ingredient & { position: number })[] = [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup', displayAmount: '2', notes: '', position: 0 },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1', notes: '', position: 1 },
      ];

      const reordered = reorderWithinSection(items, 0, 1);

      // Verify position is a number (not undefined, null, or string)
      reordered.forEach(item => {
        expect(typeof item.position).toBe('number');
        expect(Number.isInteger(item.position)).toBe(true);
        expect(item.position).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
