/**
 * Position Validation Tests for Recipe API Endpoints
 * 
 * This test suite validates that position properties are properly validated
 * in both POST and PUT API endpoints for recipes.
 * 
 * Requirements tested:
 * - 7.1: Position included in POST /api/recipes
 * - 7.2: Position included in PUT /api/recipes/[id]
 * - 7.4: API validation checks position presence
 * - 7.4: Error messages for position validation failures
 * 
 * Related to explicit-position-persistence spec, Task 10
 */

import { describe, it, expect } from '@jest/globals';
import { v4 as uuidv4 } from 'uuid';
import { validateRecipeStrict } from '@/lib/validations/recipe-sections';

describe('API Position Validation', () => {
  // ============================================================================
  // POST /api/recipes - Position Validation (Requirement 7.1)
  // ============================================================================

  describe('POST /api/recipes - Position Validation', () => {
    describe('Requirement 7.1: Position included in POST requests', () => {
      it('should accept recipe with valid positions in flat ingredients', () => {
        const validRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 2, 
              unit: 'cups',
              position: 0  // Valid position
            },
            { 
              id: uuidv4(), 
              name: 'Sugar', 
              amount: 1, 
              unit: 'cup',
              position: 1  // Valid position
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients',
              position: 0  // Valid position
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(validRecipe);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.ingredients[0].position).toBe(0);
        expect(result.data.ingredients[1].position).toBe(1);
        expect(result.data.instructions[0].position).toBe(0);
      });

      it('should accept recipe with valid positions in sections', () => {
        const validRecipe = {
          title: 'Test Recipe',
          ingredients: [],
          instructions: [],
          ingredientSections: [
            {
              id: uuidv4(),
              name: 'Dry Ingredients',
              order: 0,
              items: [
                { 
                  id: uuidv4(), 
                  name: 'Flour', 
                  amount: 2, 
                  unit: 'cups',
                  position: 0  // Valid position
                },
                { 
                  id: uuidv4(), 
                  name: 'Sugar', 
                  amount: 1, 
                  unit: 'cup',
                  position: 1  // Valid position
                }
              ]
            }
          ],
          instructionSections: [
            {
              id: uuidv4(),
              name: 'Preparation',
              order: 0,
              items: [
                { 
                  id: uuidv4(), 
                  step: 1, 
                  content: 'Mix dry ingredients',
                  position: 0  // Valid position
                }
              ]
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(validRecipe);

        expect(result.success).toBe(true);
        expect(result.data.ingredientSections[0].items[0].position).toBe(0);
        expect(result.data.ingredientSections[0].items[1].position).toBe(1);
        expect(result.data.instructionSections[0].items[0].position).toBe(0);
      });
    });

    describe('Requirement 7.4: Position validation failures', () => {
      it('should reject recipe with missing position in ingredients', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 2, 
              unit: 'cups'
              // Missing position property
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients',
              position: 0
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.some(e => 
          e.path.includes('ingredients') && 
          e.path.includes('position')
        )).toBe(true);
      });

      it('should reject recipe with missing position in instructions', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 2, 
              unit: 'cups',
              position: 0
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients'
              // Missing position property
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.some(e => 
          e.path.includes('instructions') && 
          e.path.includes('position')
        )).toBe(true);
      });

      it('should reject recipe with negative position', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 2, 
              unit: 'cups',
              position: -1  // Negative position - invalid
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients',
              position: 0
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.some(e => 
          e.message.toLowerCase().includes('non-negative')
        )).toBe(true);
      });

      it('should reject recipe with non-integer position', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 2, 
              unit: 'cups',
              position: 1.5  // Non-integer position - invalid
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients',
              position: 0
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.some(e => 
          e.message.toLowerCase().includes('integer')
        )).toBe(true);
      });

      it('should reject recipe with missing position in section items', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [],
          instructions: [],
          ingredientSections: [
            {
              id: uuidv4(),
              name: 'Dry Ingredients',
              order: 0,
              items: [
                { 
                  id: uuidv4(), 
                  name: 'Flour', 
                  amount: 2, 
                  unit: 'cups'
                  // Missing position property
                }
              ]
            }
          ],
          instructionSections: [
            {
              id: uuidv4(),
              name: 'Preparation',
              order: 0,
              items: [
                { 
                  id: uuidv4(), 
                  step: 1, 
                  content: 'Mix ingredients',
                  position: 0
                }
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
          e.path.includes('ingredientSections') && 
          e.path.includes('position')
        )).toBe(true);
      });
    });

    describe('Requirement 7.4: Clear error messages', () => {
      it('should provide clear error message for missing position', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 2, 
              unit: 'cups'
              // Missing position
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients',
              position: 0
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        
        const positionError = result.errors!.find(e => 
          e.path.includes('ingredients') && 
          e.path.includes('position')
        );
        
        expect(positionError).toBeDefined();
        expect(positionError!.message).toBeTruthy();
        expect(positionError!.path).toContain('ingredients');
        expect(positionError!.path).toContain('position');
      });

      it('should provide clear error message for negative position', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 2, 
              unit: 'cups',
              position: -1
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients',
              position: 0
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        
        const positionError = result.errors!.find(e => 
          e.message.toLowerCase().includes('non-negative')
        );
        
        expect(positionError).toBeDefined();
        expect(positionError!.message).toContain('non-negative');
      });

      it('should provide clear error message for non-integer position', () => {
        const invalidRecipe = {
          title: 'Test Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 2, 
              unit: 'cups',
              position: 1.5
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients',
              position: 0
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        
        const positionError = result.errors!.find(e => 
          e.message.toLowerCase().includes('integer')
        );
        
        expect(positionError).toBeDefined();
        expect(positionError!.message).toContain('integer');
      });
    });
  });

  // ============================================================================
  // PUT /api/recipes/[id] - Position Validation (Requirement 7.2)
  // ============================================================================

  describe('PUT /api/recipes/[id] - Position Validation', () => {
    describe('Requirement 7.2: Position included in PUT requests', () => {
      it('should accept update with valid positions', () => {
        const validRecipe = {
          title: 'Updated Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 3, 
              unit: 'cups',
              position: 0  // Valid position
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients thoroughly',
              position: 0  // Valid position
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(validRecipe);

        expect(result.success).toBe(true);
        expect(result.data.ingredients[0].position).toBe(0);
        expect(result.data.instructions[0].position).toBe(0);
      });

      it('should accept update with positions in sections', () => {
        const validRecipe = {
          title: 'Updated Recipe',
          ingredients: [],
          instructions: [],
          ingredientSections: [
            {
              id: uuidv4(),
              name: 'Updated Section',
              order: 0,
              items: [
                { 
                  id: uuidv4(), 
                  name: 'Flour', 
                  amount: 3, 
                  unit: 'cups',
                  position: 0  // Valid position
                }
              ]
            }
          ],
          instructionSections: [
            {
              id: uuidv4(),
              name: 'Updated Steps',
              order: 0,
              items: [
                { 
                  id: uuidv4(), 
                  step: 1, 
                  content: 'Mix thoroughly',
                  position: 0  // Valid position
                }
              ]
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(validRecipe);

        expect(result.success).toBe(true);
        expect(result.data.ingredientSections[0].items[0].position).toBe(0);
        expect(result.data.instructionSections[0].items[0].position).toBe(0);
      });
    });

    describe('Requirement 7.4: Position validation on update', () => {
      it('should reject update with missing position', () => {
        const invalidRecipe = {
          title: 'Updated Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 3, 
              unit: 'cups'
              // Missing position
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients',
              position: 0
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.some(e => 
          e.path.includes('ingredients') && 
          e.path.includes('position')
        )).toBe(true);
      });

      it('should reject update with invalid position values', () => {
        const invalidRecipe = {
          title: 'Updated Recipe',
          ingredients: [
            { 
              id: uuidv4(), 
              name: 'Flour', 
              amount: 3, 
              unit: 'cups',
              position: -5  // Invalid negative position
            }
          ],
          instructions: [
            { 
              id: uuidv4(), 
              step: 1, 
              content: 'Mix ingredients',
              position: 0
            }
          ],
          tags: [],
          visibility: 'private' as const,
        };

        const result = validateRecipeStrict(invalidRecipe);

        expect(result.success).toBe(false);
        expect(result.errors!.some(e => 
          e.message.toLowerCase().includes('non-negative')
        )).toBe(true);
      });
    });
  });

  // ============================================================================
  // Position Validation Edge Cases
  // ============================================================================

  describe('Position Validation Edge Cases', () => {
    it('should accept position value of 0', () => {
      const validRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { 
            id: uuidv4(), 
            name: 'Flour', 
            amount: 2, 
            unit: 'cups',
            position: 0  // Zero is valid
          }
        ],
        instructions: [
          { 
            id: uuidv4(), 
            step: 1, 
            content: 'Mix ingredients',
            position: 0  // Zero is valid
          }
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(validRecipe);

      expect(result.success).toBe(true);
    });

    it('should accept large position values', () => {
      const validRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { 
            id: uuidv4(), 
            name: 'Flour', 
            amount: 2, 
            unit: 'cups',
            position: 999  // Large position is valid
          }
        ],
        instructions: [
          { 
            id: uuidv4(), 
            step: 1, 
            content: 'Mix ingredients',
            position: 0
          }
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(validRecipe);

      expect(result.success).toBe(true);
    });

    it('should reject string position values', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { 
            id: uuidv4(), 
            name: 'Flour', 
            amount: 2, 
            unit: 'cups',
            position: '0' as any  // String instead of number
          }
        ],
        instructions: [
          { 
            id: uuidv4(), 
            step: 1, 
            content: 'Mix ingredients',
            position: 0
          }
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(invalidRecipe);

      expect(result.success).toBe(false);
    });

    it('should reject null position values', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { 
            id: uuidv4(), 
            name: 'Flour', 
            amount: 2, 
            unit: 'cups',
            position: null as any  // Null is not valid
          }
        ],
        instructions: [
          { 
            id: uuidv4(), 
            step: 1, 
            content: 'Mix ingredients',
            position: 0
          }
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(invalidRecipe);

      expect(result.success).toBe(false);
    });

    it('should reject undefined position values', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { 
            id: uuidv4(), 
            name: 'Flour', 
            amount: 2, 
            unit: 'cups',
            position: undefined as any  // Undefined is not valid
          }
        ],
        instructions: [
          { 
            id: uuidv4(), 
            step: 1, 
            content: 'Mix ingredients',
            position: 0
          }
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(invalidRecipe);

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Multiple Position Errors
  // ============================================================================

  describe('Multiple Position Validation Errors', () => {
    it('should report all position errors in a recipe', () => {
      const invalidRecipe = {
        title: 'Test Recipe',
        ingredients: [
          { 
            id: uuidv4(), 
            name: 'Flour', 
            amount: 2, 
            unit: 'cups'
            // Missing position
          },
          { 
            id: uuidv4(), 
            name: 'Sugar', 
            amount: 1, 
            unit: 'cup',
            position: -1  // Negative position
          }
        ],
        instructions: [
          { 
            id: uuidv4(), 
            step: 1, 
            content: 'Mix ingredients',
            position: 1.5  // Non-integer position
          }
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeStrict(invalidRecipe);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThanOrEqual(3);
      
      // Should have errors for missing position, negative position, and non-integer position
      const errorMessages = result.errors!.map(e => e.message.toLowerCase());
      expect(errorMessages.some(msg => msg.includes('position'))).toBe(true);
    });
  });
});
