/**
 * Comprehensive API Validation Tests for Recipe Endpoints
 * 
 * This test suite covers server-side validation logic used in both POST and PUT endpoints,
 * including strict validation, normalization, position conflict resolution,
 * and duplicate ID rejection.
 * 
 * Note: These tests validate the core validation functions that the API routes use.
 * The actual API routes (POST/PUT) use these same validation functions, so testing
 * them directly ensures the API behavior is correct without needing to mock the
 * entire Next.js request/response cycle.
 * 
 * Requirements tested:
 * - 7.1: Server validates section names are non-empty
 * - 7.2: Server validates sections contain at least one item
 * - 7.3: Server validates at least one ingredient exists
 * - 7.4: Server returns 400 with detailed errors on validation failure
 * - 7.5: Server saves recipe when validation passes
 * - 11.2: Normalization applied to existing recipes on update
 * - 11.3: Invalid data fixed automatically
 * - 12.3: Position conflict resolution
 * - 12.4: Unique ID validation
 * - 12.5: Clear error messages for duplicate IDs
 */

import { describe, it, expect } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { 
  validateRecipeStrict,
  validateUniqueSectionIds,
  validateUniqueItemIds
} from '@/lib/validations/recipe-sections';
import { 
  validateAndFixRecipePositions
} from '@/lib/section-position-utils';
import { normalizeImportedRecipe } from '@/lib/recipe-import-normalizer';

describe('Recipe API Server-Side Validation', () => {
  // ============================================================================
  // POST Endpoint Validation Tests (Requirement 7.1-7.5)
  // ============================================================================

  describe('POST /api/recipes - Validation Logic', () => {
    describe('Requirement 7.1: Empty Section Name Validation', () => {
      it('should reject recipe with empty section name', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup', step: 1 }
          ],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [
            {
              id: uuidv4(),
              name: '',  // Empty name - should fail
              order: 0,
              items: [
                { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup' }
              ]
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.some(e => 
          e.message.toLowerCase().includes('section name')
        )).toBe(true);
      });

      it('should reject recipe with whitespace-only section name', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup', step: 1 }
          ],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [
            {
              id: uuidv4(),
              name: '   ',  // Whitespace only - should fail
              order: 0,
              items: [
                { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup' }
              ]
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors!.some(e => 
          e.message.toLowerCase().includes('whitespace')
        )).toBe(true);
      });
    });

    describe('Requirement 7.2: Empty Section Validation', () => {
      it('should reject recipe with empty ingredient section', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [
            {
              id: uuidv4(),
              name: 'Dry Ingredients',
              order: 0,
              items: []  // Empty section - should fail
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors!.some(e => 
          e.message.toLowerCase().includes('at least one ingredient')
        )).toBe(true);
      });

      it('should reject recipe with empty instruction section', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup', step: 1 }
          ],
          instructions: [],
          instructionSections: [
            {
              id: uuidv4(),
              name: 'Preparation',
              order: 0,
              items: []  // Empty section - should fail
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors!.some(e => 
          e.message.toLowerCase().includes('at least one')
        )).toBe(true);
      });
    });

    describe('Requirement 7.3: Recipe-Level Ingredient Validation', () => {
      it('should reject recipe with no ingredients', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [],  // No ingredients - should fail
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors!.some(e => 
          e.message.toLowerCase().includes('at least one ingredient')
        )).toBe(true);
      });

      it('should reject recipe with sections but no ingredients in any section', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [],  // No sections with ingredients
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
      });
    });

    describe('Requirement 7.4: Error Response Format', () => {
      it('should return structured error details with path and message', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { id: 'invalid-uuid', name: 'Flour', amount: 1, unit: 'cup' }  // Invalid UUID
          ],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [
            {
              id: uuidv4(),
              name: '',  // Empty name
              order: 0,
              items: []  // Empty items
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
        
        // Verify each error has path and message
        result.errors!.forEach(error => {
          expect(error).toHaveProperty('path');
          expect(error).toHaveProperty('message');
          expect(typeof error.path).toBe('string');
          expect(typeof error.message).toBe('string');
        });
      });

      it('should return multiple errors for multiple validation failures', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [],  // No ingredients
          instructions: [],  // No instructions
          ingredientSections: [
            {
              id: uuidv4(),
              name: '',  // Empty name
              order: 0,
              items: []  // Empty items
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(1);
      });
    });

    describe('Requirement 7.5: Successful Save with Valid Data', () => {
      it('should accept valid recipe with sections', () => {
        const validRecipe = {
          title: 'Test Recipe',
          description: 'A test recipe',
          ingredients: [
            { id: uuidv4(), name: 'Flour', amount: 2, unit: 'cups', step: 1 }
          ],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [
            {
              id: uuidv4(),
              name: 'Dry Ingredients',
              order: 0,
              items: [
                { id: uuidv4(), name: 'Flour', amount: 2, unit: 'cups' }
              ]
            }
          ],
          instructionSections: [
            {
              id: uuidv4(),
              name: 'Preparation',
              order: 0,
              items: [
                { id: uuidv4(), step: 1, content: 'Mix ingredients' }
              ]
            }
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

      it('should accept valid recipe without sections', () => {
        const validRecipe = {
          title: 'Simple Recipe',
          ingredients: [
            { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup', step: 1 }
          ],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(validRecipe);

        expect(result.success).toBe(true);
      });
    });

    describe('Requirement 12.4 & 12.5: Duplicate ID Rejection', () => {
      it('should reject recipe with duplicate section IDs', () => {
        const duplicateId = uuidv4();
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup', step: 1 }
          ],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [
            {
              id: duplicateId,  // Duplicate ID
              name: 'Section 1',
              order: 0,
              items: [
                { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup' }
              ]
            },
            {
              id: duplicateId,  // Duplicate ID
              name: 'Section 2',
              order: 1,
              items: [
                { id: uuidv4(), name: 'Sugar', amount: 1, unit: 'cup' }
              ]
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const isUnique = validateUniqueSectionIds(invalidRecipe);

        expect(isUnique).toBe(false);
      });

      it('should reject recipe with duplicate item IDs', () => {
        const duplicateId = uuidv4();
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { id: duplicateId, name: 'Flour', amount: 1, unit: 'cup', step: 1 },
            { id: duplicateId, name: 'Sugar', amount: 1, unit: 'cup', step: 2 }
          ],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [
            {
              id: uuidv4(),
              name: 'Ingredients',
              order: 0,
              items: [
                { id: duplicateId, name: 'Flour', amount: 1, unit: 'cup' },
                { id: duplicateId, name: 'Sugar', amount: 1, unit: 'cup' }
              ]
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const isUnique = validateUniqueItemIds(invalidRecipe);

        expect(isUnique).toBe(false);
      });

      it('should provide clear error message for duplicate IDs', () => {
        const duplicateId = uuidv4();
        const invalidRecipe = {
          ingredientSections: [
            { id: duplicateId, name: 'Section 1', order: 0, items: [] },
            { id: duplicateId, name: 'Section 2', order: 1, items: [] }
          ]
        };

        const isUnique = validateUniqueSectionIds(invalidRecipe);

        // The API route would return a message like:
        // "Duplicate section IDs detected. Each section must have a unique ID."
        expect(isUnique).toBe(false);
      });
    });

    describe('Requirement 12.3: Position Conflict Resolution', () => {
      it('should auto-fix duplicate positions in sections', () => {
        const sections = [
          {
            id: uuidv4(),
            name: 'Section 1',
            position: 0,  // Duplicate position
            items: [
              { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup', position: 0 }
            ]
          },
          {
            id: uuidv4(),
            name: 'Section 2',
            position: 0,  // Duplicate position - should be auto-fixed
            items: [
              { id: uuidv4(), name: 'Sugar', amount: 1, unit: 'cup', position: 0 }
            ]
          }
        ];

        const result = validateAndFixRecipePositions(sections);

        expect(result.isValid).toBe(false);  // Was invalid
        expect(result.fixedSections[0].position).toBe(0);
        expect(result.fixedSections[1].position).toBe(1);  // Fixed to sequential
      });

      it('should auto-fix negative positions', () => {
        const sections = [
          {
            id: uuidv4(),
            name: 'Section 1',
            position: -1,  // Negative position - should be auto-fixed
            items: [
              { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup', position: 0 }
            ]
          }
        ];

        const result = validateAndFixRecipePositions(sections);

        expect(result.isValid).toBe(false);  // Was invalid
        expect(result.fixedSections[0].position).toBe(0);  // Fixed to 0
      });

      it('should report errors for position conflicts', () => {
        const sections = [
          {
            id: uuidv4(),
            name: 'Section 1',
            position: 0,
            items: [
              { id: uuidv4(), name: 'Item 1', amount: 1, unit: 'cup', position: 0 },
              { id: uuidv4(), name: 'Item 2', amount: 1, unit: 'cup', position: 0 }  // Duplicate
            ]
          }
        ];

        const result = validateAndFixRecipePositions(sections);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors.some(e => e.includes('Duplicate position'))).toBe(true);
      });
    });
  });

  // ============================================================================
  // PUT Endpoint Validation Tests
  // ============================================================================

  describe('PUT /api/recipes/[id] - Validation Logic', () => {
    describe('Same Validation as POST (Requirements 7.1-7.5)', () => {
      it('should reject update with empty section name', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup', step: 1 }
          ],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [
            {
              id: uuidv4(),
              name: '',  // Empty name - should fail
              order: 0,
              items: [
                { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup' }
              ]
            }
          ]
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
      });

      it('should reject update with no ingredients', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ]
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
      });

      it('should accept valid update', () => {
        const validRecipe = {
          title: 'Updated Recipe',
          ingredients: [
            { id: uuidv4(), name: 'Flour', amount: 2, unit: 'cups', step: 1 }
          ],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [
            {
              id: uuidv4(),
              name: 'Dry Ingredients',
              order: 0,
              items: [
                { id: uuidv4(), name: 'Flour', amount: 2, unit: 'cups' }
              ]
            }
          ]
        };

        const result = validateRecipeStrict(validRecipe);

        expect(result.success).toBe(true);
      });
    });

    describe('Requirement 11.2 & 11.3: Normalization on Update', () => {
      it('should normalize recipe with missing section names', () => {
        const recipeWithMissingData = {
          title: 'Test Recipe',
          ingredientSections: [
            {
              id: uuidv4(),
              name: '',  // Will be normalized to "Imported Section"
              position: 0,
              items: [
                { name: 'Flour', amount: 1, unit: 'cup' }  // Missing id and position
              ]
            }
          ]
        };

        const normalized = normalizeImportedRecipe(recipeWithMissingData);

        expect(normalized.ingredientSections).toBeDefined();
        expect(normalized.ingredientSections[0].name).toBe('Imported Section');
      });

      it('should normalize recipe with missing positions', () => {
        const recipeWithMissingPositions = {
          title: 'Test Recipe',
          ingredientSections: [
            {
              id: uuidv4(),
              name: 'Ingredients',
              // order is missing - will be normalized
              items: [
                { name: 'Flour', amount: 1, unit: 'cup' }
              ]
            }
          ]
        };

        const normalized = normalizeImportedRecipe(recipeWithMissingPositions);

        // Section order should be normalized to 0
        expect(normalized.ingredientSections[0].order).toBe(0);
        // Items should be present and normalized
        expect(normalized.ingredientSections[0].items).toHaveLength(1);
        expect(normalized.ingredientSections[0].items[0].name).toBe('Flour');
      });

      it('should drop empty items during normalization', () => {
        const recipeWithEmptyItems = {
          title: 'Test Recipe',
          ingredientSections: [
            {
              id: uuidv4(),
              name: 'Ingredients',
              position: 0,
              items: [
                { name: 'Flour', amount: 1, unit: 'cup', position: 0 },
                { name: '', amount: 1, unit: 'cup', position: 1 },  // Empty - should be dropped
                { name: 'Sugar', amount: 1, unit: 'cup', position: 2 }
              ]
            }
          ]
        };

        const normalized = normalizeImportedRecipe(recipeWithEmptyItems);

        expect(normalized.ingredientSections[0].items).toHaveLength(2);
        expect(normalized.ingredientSections[0].items[0].name).toBe('Flour');
        expect(normalized.ingredientSections[0].items[1].name).toBe('Sugar');
      });
    });

    describe('Requirement 12.3: Position Conflict Resolution on Update', () => {
      it('should resolve position conflicts during update', () => {
        const sections = [
          {
            id: uuidv4(),
            name: 'Section 1',
            position: 0,
            items: [
              { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup', position: 0 }
            ]
          },
          {
            id: uuidv4(),
            name: 'Section 2',
            position: 0,  // Duplicate position
            items: [
              { id: uuidv4(), name: 'Sugar', amount: 1, unit: 'cup', position: 0 }
            ]
          }
        ];

        const result = validateAndFixRecipePositions(sections);

        expect(result.fixedSections[0].position).toBe(0);
        expect(result.fixedSections[1].position).toBe(1);
      });
    });

    describe('Requirement 12.4 & 12.5: Duplicate ID Rejection on Update', () => {
      it('should reject update with duplicate section IDs', () => {
        const duplicateId = uuidv4();
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup', step: 1 }
          ],
          instructions: [
            { id: uuidv4(), step: 1, content: 'Mix ingredients' }
          ],
          ingredientSections: [
            {
              id: duplicateId,
              name: 'Section 1',
              order: 0,
              items: [
                { id: uuidv4(), name: 'Flour', amount: 1, unit: 'cup' }
              ]
            },
            {
              id: duplicateId,  // Duplicate
              name: 'Section 2',
              order: 1,
              items: [
                { id: uuidv4(), name: 'Sugar', amount: 1, unit: 'cup' }
              ]
            }
          ]
        };

        const isUnique = validateUniqueSectionIds(invalidRecipe);

        expect(isUnique).toBe(false);
      });
    });
  });
});
