/**
 * Unit tests for recipe normalization functions
 * 
 * Tests Requirements: 5.1, 5.2, 5.5
 */

import { normalizeRecipeData } from '../recipe-normalizer';

describe('recipe-normalizer', () => {
  describe('normalizeRecipeData', () => {
    it('should assign position to ingredients when missing (Req 5.1)', () => {
      const scrapedData = {
        recipe: {
          title: 'Test Recipe',
          ingredients: [
            { name: 'Flour', amount: 2, unit: 'cups' },
            { name: 'Sugar', amount: 1, unit: 'cup' },
          ],
        },
      };

      const result = normalizeRecipeData(scrapedData, 'user-123');

      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0].position).toBe(0);
      expect(result.ingredients[1].position).toBe(1);
    });

    it('should assign position to instructions when missing (Req 5.1)', () => {
      const scrapedData = {
        recipe: {
          title: 'Test Recipe',
          instructions: [
            { step: 1, content: 'Mix ingredients' },
            { step: 2, content: 'Bake for 30 minutes' },
          ],
        },
      };

      const result = normalizeRecipeData(scrapedData, 'user-123');

      expect(result.instructions).toHaveLength(2);
      expect(result.instructions[0].position).toBe(0);
      expect(result.instructions[1].position).toBe(1);
    });

    it('should preserve existing valid positions (Req 5.2)', () => {
      const scrapedData = {
        recipe: {
          title: 'Test Recipe',
          ingredients: [
            { name: 'Flour', amount: 2, unit: 'cups', position: 0 },
            { name: 'Sugar', amount: 1, unit: 'cup', position: 1 },
          ],
        },
      };

      const result = normalizeRecipeData(scrapedData, 'user-123');

      expect(result.ingredients[0].position).toBe(0);
      expect(result.ingredients[1].position).toBe(1);
    });

    it('should handle empty ingredient names by using default name (Req 5.5)', () => {
      const scrapedData = {
        recipe: {
          title: 'Test Recipe',
          ingredients: [
            { name: 'Flour', amount: 2, unit: 'cups', position: 0 },
            { name: '', amount: 1, unit: 'cup', position: 1 }, // Empty name becomes "Unknown ingredient"
            { name: 'Sugar', amount: 1, unit: 'cup', position: 2 },
          ],
        },
      };

      const result = normalizeRecipeData(scrapedData, 'user-123');

      // All three ingredients are kept, empty name becomes "Unknown ingredient"
      expect(result.ingredients).toHaveLength(3);
      expect(result.ingredients[0].position).toBe(0);
      expect(result.ingredients[0].name).toBe('flour');
      expect(result.ingredients[1].position).toBe(1);
      expect(result.ingredients[1].name).toBe('Unknown ingredient');
      expect(result.ingredients[2].position).toBe(2);
      expect(result.ingredients[2].name).toBe('sugar');
    });

    it('should handle string ingredients and assign positions (Req 5.1)', () => {
      const scrapedData = {
        recipe: {
          title: 'Test Recipe',
          ingredients: ['2 cups flour', '1 cup sugar'],
        },
      };

      const result = normalizeRecipeData(scrapedData, 'user-123');

      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0].position).toBe(0);
      expect(result.ingredients[1].position).toBe(1);
    });

    it('should handle string instructions and assign positions (Req 5.1)', () => {
      const scrapedData = {
        recipe: {
          title: 'Test Recipe',
          instructions: ['Mix ingredients', 'Bake for 30 minutes'],
        },
      };

      const result = normalizeRecipeData(scrapedData, 'user-123');

      expect(result.instructions).toHaveLength(2);
      expect(result.instructions[0].position).toBe(0);
      expect(result.instructions[1].position).toBe(1);
    });

    it('should assign positions to default items when arrays are empty (Req 5.1)', () => {
      const scrapedData = {
        recipe: {
          title: 'Test Recipe',
          ingredients: [],
          instructions: [],
        },
      };

      const result = normalizeRecipeData(scrapedData, 'user-123');

      // Default items should be added with positions
      expect(result.ingredients).toHaveLength(1);
      expect(result.ingredients[0].position).toBe(0);
      expect(result.instructions).toHaveLength(1);
      expect(result.instructions[0].position).toBe(0);
    });

    it('should handle mixed valid and invalid positions (Req 5.5)', () => {
      const scrapedData = {
        recipe: {
          title: 'Test Recipe',
          ingredients: [
            { name: 'Flour', amount: 2, unit: 'cups', position: 0 },
            { name: 'Sugar', amount: 1, unit: 'cup' }, // Missing position
            { name: 'Salt', amount: 1, unit: 'tsp', position: -1 }, // Invalid position
          ],
        },
      };

      const result = normalizeRecipeData(scrapedData, 'user-123');

      expect(result.ingredients).toHaveLength(3);
      // All positions should be reindexed to be sequential
      expect(result.ingredients[0].position).toBe(0);
      expect(result.ingredients[1].position).toBe(1);
      expect(result.ingredients[2].position).toBe(2);
    });

    it('should filter empty instructions and reindex positions (Req 5.5)', () => {
      const scrapedData = {
        recipe: {
          title: 'Test Recipe',
          instructions: [
            { step: 1, content: 'Mix ingredients', position: 0 },
            { step: 2, content: '', position: 1 }, // Empty content, will be filtered
            { step: 3, content: 'Bake', position: 2 },
          ],
        },
      };

      const result = normalizeRecipeData(scrapedData, 'user-123');

      expect(result.instructions).toHaveLength(2);
      expect(result.instructions[0].position).toBe(0);
      expect(result.instructions[1].position).toBe(1); // Reindexed from 2 to 1
    });
  });
});
