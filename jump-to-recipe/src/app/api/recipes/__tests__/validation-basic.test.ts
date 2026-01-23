/**
 * Basic validation tests for recipe API POST endpoint
 * These tests verify that the strict validation is working correctly
 */

import { validateRecipeStrict } from '@/lib/validations/recipe-sections';

describe('Recipe API POST Validation', () => {
  describe('Valid Recipe Data', () => {
    it('should accept a valid recipe with sections', () => {
      const validRecipe = {
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Flour',
            amount: 2,
            unit: 'cups',
            step: 1,
          },
        ],
        instructions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            step: 1,
            content: 'Mix ingredients',
          },
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
        instructionSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            name: 'Preparation',
            order: 0,
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174001',
                step: 1,
                content: 'Mix ingredients',
              },
            ],
          },
        ],
        tags: [],
        visibility: 'private' as const,
        commentsEnabled: true,
        viewCount: 0,
        likeCount: 0,
      };

      const result = validateRecipeStrict(validRecipe);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });
  });

  describe('Invalid Recipe Data', () => {
    it('should reject recipe with empty section name', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Flour',
            amount: 2,
            unit: 'cups',
          },
        ],
        instructions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            step: 1,
            content: 'Mix ingredients',
          },
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: '',  // Empty name - should fail
            order: 0,
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(invalidRecipe);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.includes('Section name'))).toBe(true);
    });

    it('should reject recipe with empty section', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Flour',
            amount: 2,
            unit: 'cups',
          },
        ],
        instructions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            step: 1,
            content: 'Mix ingredients',
          },
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Empty Section',
            order: 0,
            items: [],  // Empty items - should fail
          },
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(invalidRecipe);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.includes('at least one ingredient'))).toBe(true);
    });

    it('should reject recipe with no ingredients', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [],  // No ingredients - should fail
        instructions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            step: 1,
            content: 'Mix ingredients',
          },
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(invalidRecipe);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.includes('At least one ingredient'))).toBe(true);
    });

    it('should reject recipe with invalid UUID', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          {
            id: 'invalid-uuid',  // Invalid UUID - should fail
            name: 'Flour',
            amount: 2,
            unit: 'cups',
          },
        ],
        instructions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            step: 1,
            content: 'Mix ingredients',
          },
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(invalidRecipe);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.includes('Invalid') && e.message.includes('ID'))).toBe(true);
    });

    it('should reject recipe with whitespace-only ingredient name', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: '   ',  // Whitespace only - should fail
            amount: 2,
            unit: 'cups',
          },
        ],
        instructions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            step: 1,
            content: 'Mix ingredients',
          },
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(invalidRecipe);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.includes('whitespace'))).toBe(true);
    });
  });

  describe('Error Response Format', () => {
    it('should return structured errors with path and message', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [],
        instructions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            step: 1,
            content: 'Mix ingredients',
          },
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: '',
            order: 0,
            items: [],
          },
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(invalidRecipe);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      
      // Verify error structure
      result.errors?.forEach(error => {
        expect(error).toHaveProperty('path');
        expect(error).toHaveProperty('message');
        expect(typeof error.path).toBe('string');
        expect(typeof error.message).toBe('string');
      });
    });
  });
});
