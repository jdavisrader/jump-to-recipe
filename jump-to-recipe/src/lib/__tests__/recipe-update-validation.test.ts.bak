/**
 * Tests for recipe update validation logic
 * 
 * Tests the strict validation and normalization that occurs during recipe updates.
 * This tests the validation logic independently of the API endpoint.
 */

import { describe, it, expect } from '@jest/globals';
import { strictRecipeWithSectionsSchema } from '@/lib/validations/recipe-sections';
import { normalizeExistingRecipe, createNormalizationSummary } from '@/lib/recipe-import-normalizer';

describe('Recipe Update Validation', () => {
  describe('Strict Validation Rules', () => {
    it('should reject recipe with empty section name', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: '',  // Empty name should fail
            order: 0,
            items: [
              { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
            ]
          }
        ]
      };

      const result = strictRecipeWithSectionsSchema.safeParse(invalidRecipe);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should reject recipe with empty section', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Dry Ingredients',
            order: 0,
            items: []  // Empty section should fail
          }
        ]
      };

      const result = strictRecipeWithSectionsSchema.safeParse(invalidRecipe);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessages = result.error.issues.map(i => i.message);
        expect(errorMessages.some(msg => 
          msg.includes('at least one ingredient') || msg.includes('must contain at least one')
        )).toBe(true);
      }
    });

    it('should reject recipe with no ingredients', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
      };

      const result = strictRecipeWithSectionsSchema.safeParse(invalidRecipe);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        // The error should be about missing ingredients
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });

    it('should reject recipe with invalid UUID format', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: 'invalid-uuid', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
      };

      const result = strictRecipeWithSectionsSchema.safeParse(invalidRecipe);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessages = result.error.issues.map(i => i.message);
        expect(errorMessages.some(msg => msg.includes('Invalid') && msg.includes('ID'))).toBe(true);
      }
    });

    it('should reject recipe with empty ingredient name', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: '', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
      };

      const result = strictRecipeWithSectionsSchema.safeParse(invalidRecipe);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessages = result.error.issues.map(i => i.message);
        expect(errorMessages.some(msg => msg.includes('cannot be empty'))).toBe(true);
      }
    });

    it('should reject recipe with whitespace-only ingredient name', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: '   ', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
      };

      const result = strictRecipeWithSectionsSchema.safeParse(invalidRecipe);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessages = result.error.issues.map(i => i.message);
        expect(errorMessages.some(msg => msg.includes('whitespace'))).toBe(true);
      }
    });

    it('should provide structured error details with path and message', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: '', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
      };

      const result = strictRecipeWithSectionsSchema.safeParse(invalidRecipe);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toHaveProperty('path');
        expect(errors[0]).toHaveProperty('message');
        expect(typeof errors[0].path).toBe('string');
        expect(typeof errors[0].message).toBe('string');
      }
    });
  });

  describe('Normalization for Existing Recipes', () => {
    it('should normalize recipe with missing section name', () => {
      const recipeWithMissingName = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: '',  // Will be normalized to "Imported Section"
            order: 0,
            items: [
              { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
            ]
          }
        ]
      };

      const summary = createNormalizationSummary();
      const normalized = normalizeExistingRecipe(recipeWithMissingName, summary);

      expect(summary.sectionsRenamed).toBe(1);
      expect(normalized.ingredientSections[0].name).toBe('Imported Section');
    });

    it('should flatten empty sections', () => {
      const recipeWithEmptySection = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Valid Section',
            order: 0,
            items: [
              { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
            ]
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            name: 'Empty Section',
            order: 1,
            items: []  // Empty section will be removed
          }
        ]
      };

      const summary = createNormalizationSummary();
      const normalized = normalizeExistingRecipe(recipeWithEmptySection, summary);

      expect(summary.sectionsFlattened).toBe(1);
      expect(normalized.ingredientSections.length).toBe(1);
      expect(normalized.ingredientSections[0].name).toBe('Valid Section');
    });

    it('should drop items with empty text', () => {
      const recipeWithEmptyItems = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' },
          { id: '123e4567-e89b-12d3-a456-426614174001', name: '', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174002', step: 1, content: 'Mix ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174003',
            name: 'Ingredients',
            order: 0,
            items: [
              { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' },
              { id: '123e4567-e89b-12d3-a456-426614174001', name: '', amount: 1, unit: 'cup' }
            ]
          }
        ]
      };

      const summary = createNormalizationSummary();
      const normalized = normalizeExistingRecipe(recipeWithEmptyItems, summary);

      expect(summary.itemsDropped).toBe(1);
      expect(normalized.ingredientSections[0].items.length).toBe(1);
      expect(normalized.ingredientSections[0].items[0].name).toBe('Flour');
    });

    it('should generate UUIDs for items missing IDs', () => {
      const recipeWithMissingIds = {
        title: 'Test Recipe',
        ingredients: [
          { name: 'Flour', amount: 1, unit: 'cup' }  // Missing ID
        ],
        instructions: [
          { step: 1, content: 'Mix ingredients' }  // Missing ID
        ],
        ingredientSections: [
          {
            name: 'Ingredients',
            order: 0,
            items: [
              { name: 'Flour', amount: 1, unit: 'cup' }  // Missing ID
            ]
          }
        ]
      };

      const summary = createNormalizationSummary();
      const normalized = normalizeExistingRecipe(recipeWithMissingIds, summary);

      expect(summary.idsGenerated).toBeGreaterThan(0);
      expect(normalized.ingredientSections[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(normalized.ingredientSections[0].items[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });

  describe('Valid Recipe Acceptance', () => {
    it('should accept valid recipe with sections', () => {
      const validRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
            ]
          }
        ]
      };

      const result = strictRecipeWithSectionsSchema.safeParse(validRecipe);
      
      expect(result.success).toBe(true);
    });

    it('should accept valid recipe without sections', () => {
      const validRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
      };

      const result = strictRecipeWithSectionsSchema.safeParse(validRecipe);
      
      expect(result.success).toBe(true);
    });

    it('should accept recipe with multiple sections', () => {
      const validRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' },
          { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Sugar', amount: 0.5, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174002', step: 1, content: 'Mix dry ingredients' },
          { id: '123e4567-e89b-12d3-a456-426614174003', step: 2, content: 'Add wet ingredients' }
        ],
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174004',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
            ]
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174005',
            name: 'Wet Ingredients',
            order: 1,
            items: [
              { id: '123e4567-e89b-12d3-a456-426614174001', name: 'Sugar', amount: 0.5, unit: 'cup' }
            ]
          }
        ]
      };

      const result = strictRecipeWithSectionsSchema.safeParse(validRecipe);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Backward Compatibility', () => {
    it('should handle recipes with legacy data structure', () => {
      const legacyRecipe = {
        title: 'Legacy Recipe',
        ingredients: [
          { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Flour', amount: 1, unit: 'cup' }
        ],
        instructions: [
          { id: '123e4567-e89b-12d3-a456-426614174001', step: 1, content: 'Mix ingredients' }
        ]
        // No sections - legacy format
      };

      const summary = createNormalizationSummary();
      const normalized = normalizeExistingRecipe(legacyRecipe, summary);
      
      // Normalized recipe should have the flat arrays populated
      expect(normalized.ingredients.length).toBeGreaterThan(0);
      expect(normalized.instructions.length).toBeGreaterThan(0);
      
      const result = strictRecipeWithSectionsSchema.safeParse(normalized);

      // Should succeed after normalization
      expect(result.success).toBe(true);
    });

    it('should normalize and validate recipe in one flow', () => {
      const recipeNeedingNormalization = {
        title: 'Test Recipe',
        ingredients: [
          { name: 'Flour', amount: 1, unit: 'cup' }  // Missing ID
        ],
        instructions: [
          { step: 1, content: 'Mix ingredients' }  // Missing ID
        ],
        ingredientSections: [
          {
            name: '',  // Empty name
            order: 0,
            items: [
              { name: 'Flour', amount: 1, unit: 'cup' }
            ]
          }
        ]
      };

      const summary = createNormalizationSummary();
      const normalized = normalizeExistingRecipe(recipeNeedingNormalization, summary);

      expect(summary.sectionsRenamed).toBe(1);
      expect(summary.idsGenerated).toBeGreaterThan(0);
      
      // Verify normalized data has required fields
      expect(normalized.ingredientSections[0].name).toBe('Imported Section');
      expect(normalized.ingredientSections[0].items[0].id).toBeDefined();
      
      const result = strictRecipeWithSectionsSchema.safeParse(normalized);

      // Should succeed after normalization
      expect(result.success).toBe(true);
    });
  });
});
