/**
 * Integration tests for cross-section drag-and-drop functionality
 * 
 * These tests verify that the moveBetweenSections utility works correctly
 * when integrated with the recipe ingredients component logic.
 */

import { moveBetweenSections, reorderWithinSection } from '../section-position-utils';

describe('Cross-Section Drag-and-Drop Integration', () => {
  describe('moveBetweenSections', () => {
    it('should move ingredient from one section to another', () => {
      // Simulate two sections with ingredients
      const sourceItems = [
        { id: 'ing1', name: 'Flour', amount: 2, unit: 'cups', position: 0 },
        { id: 'ing2', name: 'Sugar', amount: 1, unit: 'cup', position: 1 },
        { id: 'ing3', name: 'Salt', amount: 1, unit: 'tsp', position: 2 },
      ];

      const destItems = [
        { id: 'ing4', name: 'Butter', amount: 0.5, unit: 'cup', position: 0 },
        { id: 'ing5', name: 'Eggs', amount: 2, unit: '', position: 1 },
      ];

      // Move "Sugar" (index 1) from source to position 1 in destination
      const result = moveBetweenSections(sourceItems, destItems, 1, 1);

      // Verify source section
      expect(result.sourceItems).toHaveLength(2);
      expect(result.sourceItems[0].id).toBe('ing1');
      expect(result.sourceItems[1].id).toBe('ing3');
      expect(result.sourceItems[0].position).toBe(0);
      expect(result.sourceItems[1].position).toBe(1);

      // Verify destination section
      expect(result.destItems).toHaveLength(3);
      expect(result.destItems[0].id).toBe('ing4');
      expect(result.destItems[1].id).toBe('ing2'); // Sugar moved here
      expect(result.destItems[2].id).toBe('ing5');
      expect(result.destItems[0].position).toBe(0);
      expect(result.destItems[1].position).toBe(1);
      expect(result.destItems[2].position).toBe(2);
    });

    it('should preserve all ingredient data during cross-section move', () => {
      const sourceItems = [
        {
          id: 'ing1',
          name: 'Vanilla Extract',
          amount: 2,
          unit: 'tsp',
          displayAmount: '2 tsp',
          notes: 'Pure vanilla',
          position: 0,
        },
      ];

      const destItems = [
        { id: 'ing2', name: 'Milk', amount: 1, unit: 'cup', displayAmount: '1 cup', notes: '', position: 0 },
      ];

      const result = moveBetweenSections(sourceItems, destItems, 0, 0);

      // Verify all data is preserved
      const movedItem = result.destItems[0];
      expect(movedItem.id).toBe('ing1');
      expect(movedItem.name).toBe('Vanilla Extract');
      expect(movedItem.amount).toBe(2);
      expect(movedItem.unit).toBe('tsp');
      expect(movedItem.displayAmount).toBe('2 tsp');
      expect(movedItem.notes).toBe('Pure vanilla');
      expect(movedItem.position).toBe(0); // Position updated
    });

    it('should handle moving to empty destination section', () => {
      const sourceItems = [
        { id: 'ing1', name: 'Flour', amount: 2, unit: 'cups', displayAmount: '2 cups', notes: '', position: 0 },
        { id: 'ing2', name: 'Sugar', amount: 1, unit: 'cup', displayAmount: '1 cup', notes: '', position: 1 },
      ];

      const destItems: any[] = [];

      const result = moveBetweenSections(sourceItems, destItems, 0, 0);

      expect(result.sourceItems).toHaveLength(1);
      expect(result.destItems).toHaveLength(1);
      expect(result.destItems[0].id).toBe('ing1');
      expect(result.destItems[0].position).toBe(0);
    });

    it('should handle moving last item from source section', () => {
      const sourceItems = [
        { id: 'ing1', name: 'Flour', amount: 2, unit: 'cups', position: 0 },
      ];

      const destItems = [
        { id: 'ing2', name: 'Sugar', amount: 1, unit: 'cup', position: 0 },
      ];

      const result = moveBetweenSections(sourceItems, destItems, 0, 1);

      expect(result.sourceItems).toHaveLength(0);
      expect(result.destItems).toHaveLength(2);
      expect(result.destItems[1].id).toBe('ing1');
    });
  });

  describe('Integration with within-section reordering', () => {
    it('should work correctly when alternating between cross-section and within-section moves', () => {
      // Start with two sections
      let section1 = [
        { id: 'ing1', name: 'Flour', amount: 2, unit: 'cups', position: 0 },
        { id: 'ing2', name: 'Sugar', amount: 1, unit: 'cup', position: 1 },
      ];

      let section2 = [
        { id: 'ing3', name: 'Butter', amount: 0.5, unit: 'cup', position: 0 },
      ];

      // 1. Reorder within section1
      section1 = reorderWithinSection(section1, 0, 1);
      expect(section1[0].id).toBe('ing2');
      expect(section1[1].id).toBe('ing1');

      // 2. Move from section1 to section2
      const moveResult = moveBetweenSections(section1, section2, 0, 0);
      section1 = moveResult.sourceItems;
      section2 = moveResult.destItems;

      expect(section1).toHaveLength(1);
      expect(section2).toHaveLength(2);
      expect(section2[0].id).toBe('ing2'); // Sugar moved to section2

      // 3. Reorder within section2
      section2 = reorderWithinSection(section2, 0, 1);
      expect(section2[0].id).toBe('ing3');
      expect(section2[1].id).toBe('ing2');

      // Verify all positions are sequential
      section1.forEach((item, index) => {
        expect(item.position).toBe(index);
      });
      section2.forEach((item, index) => {
        expect(item.position).toBe(index);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle moving to the end of destination section', () => {
      const sourceItems = [
        { id: 'ing1', name: 'Flour', amount: 2, unit: 'cups', position: 0 },
      ];

      const destItems = [
        { id: 'ing2', name: 'Sugar', amount: 1, unit: 'cup', position: 0 },
        { id: 'ing3', name: 'Salt', amount: 1, unit: 'tsp', position: 1 },
      ];

      const result = moveBetweenSections(sourceItems, destItems, 0, 2);

      expect(result.destItems).toHaveLength(3);
      expect(result.destItems[2].id).toBe('ing1');
      expect(result.destItems[2].position).toBe(2);
    });

    it('should handle moving to the beginning of destination section', () => {
      const sourceItems = [
        { id: 'ing1', name: 'Flour', amount: 2, unit: 'cups', position: 0 },
      ];

      const destItems = [
        { id: 'ing2', name: 'Sugar', amount: 1, unit: 'cup', position: 0 },
        { id: 'ing3', name: 'Salt', amount: 1, unit: 'tsp', position: 1 },
      ];

      const result = moveBetweenSections(sourceItems, destItems, 0, 0);

      expect(result.destItems).toHaveLength(3);
      expect(result.destItems[0].id).toBe('ing1');
      expect(result.destItems[0].position).toBe(0);
      expect(result.destItems[1].position).toBe(1);
      expect(result.destItems[2].position).toBe(2);
    });
  });
});
