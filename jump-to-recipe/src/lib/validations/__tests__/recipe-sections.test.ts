import { describe, it, expect } from '@jest/globals';
import {
  recipeSchema,
  recipeWithSectionsSchema,
  ingredientSectionSchema,
  instructionSectionSchema,
  validateRecipeWithSections,
  validateSectionName,
  validateSectionOrder,
  validateRecipeStructure,
  extendedIngredientSchema,
  extendedInstructionSchema,
} from '../recipe';

describe('Recipe Sections Validation', () => {
  describe('Extended Ingredient Schema', () => {
    it('should validate basic ingredient without sectionId', () => {
      const ingredient = {
        id: '1',
        name: 'Flour',
        amount: 2,
        unit: 'cups',
        position: 0,
      };

      const result = extendedIngredientSchema.safeParse(ingredient);
      expect(result.success).toBe(true);
    });

    it('should validate ingredient with sectionId', () => {
      const ingredient = {
        id: '1',
        name: 'Flour',
        amount: 2,
        unit: 'cups',
        position: 0,
        sectionId: 'section-1',
      };

      const result = extendedIngredientSchema.safeParse(ingredient);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sectionId).toBe('section-1');
      }
    });
  });

  describe('Extended Instruction Schema', () => {
    it('should validate basic instruction without sectionId', () => {
      const instruction = {
        id: '1',
        step: 1,
        content: 'Mix ingredients',
        position: 0,
      };

      const result = extendedInstructionSchema.safeParse(instruction);
      expect(result.success).toBe(true);
    });

    it('should validate instruction with sectionId', () => {
      const instruction = {
        id: '1',
        step: 1,
        content: 'Mix ingredients',
        position: 0,
        sectionId: 'section-1',
      };

      const result = extendedInstructionSchema.safeParse(instruction);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sectionId).toBe('section-1');
      }
    });
  });

  describe('Ingredient Section Schema', () => {
    it('should validate valid ingredient section', () => {
      const section = {
        id: 'section-1',
        name: 'Cake Batter',
        order: 0,
        items: [
          {
            id: '1',
            name: 'Flour',
            amount: 2,
            unit: 'cups',
            position: 0,
          },
        ],
      };

      const result = ingredientSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });

    it('should use default name for empty section name', () => {
      const section = {
        id: 'section-1',
        name: '',
        order: 0,
        items: [],
      };

      const result = ingredientSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Untitled Section');
      }
    });

    it('should reject negative order', () => {
      const section = {
        id: 'section-1',
        name: 'Test Section',
        order: -1,
        items: [],
      };

      const result = ingredientSectionSchema.safeParse(section);
      expect(result.success).toBe(false);
    });
  });

  describe('Instruction Section Schema', () => {
    it('should validate valid instruction section', () => {
      const section = {
        id: 'section-1',
        name: 'Preparation',
        order: 0,
        items: [
          {
            id: '1',
            step: 1,
            content: 'Preheat oven',
            position: 0,
          },
        ],
      };

      const result = instructionSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
    });

    it('should use default name for empty section name', () => {
      const section = {
        id: 'section-1',
        name: '',
        order: 0,
        items: [],
      };

      const result = instructionSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Untitled Section');
      }
    });
  });

  describe('Recipe with Sections Schema', () => {
    const baseRecipe = {
      title: 'Test Recipe',
      description: 'A test recipe',
      ingredients: [
        {
          id: '1',
          name: 'Flour',
          amount: 2,
          unit: 'cups',
          position: 0,
        },
      ],
      instructions: [
        {
          id: '1',
          step: 1,
          content: 'Mix ingredients',
          position: 0,
        },
      ],
      tags: [],
      visibility: 'private' as const,
      commentsEnabled: true,
      viewCount: 0,
      likeCount: 0,
    };

    it('should validate recipe without sections (backward compatibility)', () => {
      const result = recipeSchema.safeParse(baseRecipe);
      expect(result.success).toBe(true);
    });

    it('should validate recipe with ingredient sections', () => {
      const recipeWithSections = {
        ...baseRecipe,
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              {
                id: '1',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
                position: 0,
              },
            ],
          },
        ],
      };

      const result = recipeSchema.safeParse(recipeWithSections);
      expect(result.success).toBe(true);
    });

    it('should validate recipe with instruction sections', () => {
      const recipeWithSections = {
        ...baseRecipe,
        instructionSections: [
          {
            id: 'section-1',
            name: 'Preparation',
            order: 0,
            items: [
              {
                id: '1',
                step: 1,
                content: 'Preheat oven',
                position: 0,
              },
            ],
          },
        ],
      };

      const result = recipeSchema.safeParse(recipeWithSections);
      expect(result.success).toBe(true);
    });

    it('should validate recipe with both ingredient and instruction sections', () => {
      const recipeWithSections = {
        ...baseRecipe,
        ingredientSections: [
          {
            id: 'ing-section-1',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              {
                id: '1',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
                position: 0,
              },
            ],
          },
        ],
        instructionSections: [
          {
            id: 'inst-section-1',
            name: 'Preparation',
            order: 0,
            items: [
              {
                id: '1',
                step: 1,
                content: 'Preheat oven',
                position: 0,
              },
            ],
          },
        ],
      };

      const result = recipeSchema.safeParse(recipeWithSections);
      expect(result.success).toBe(true);
    });
  });

  describe('validateRecipeWithSections', () => {
    const baseRecipe = {
      title: 'Test Recipe',
      description: 'A test recipe',
      ingredients: [
        {
          id: '1',
          name: 'Flour',
          amount: 2,
          unit: 'cups',
          position: 0,
        },
      ],
      instructions: [
        {
          id: '1',
          step: 1,
          content: 'Mix ingredients',
          position: 0,
        },
      ],
      tags: [],
      visibility: 'private' as const,
      commentsEnabled: true,
      viewCount: 0,
      likeCount: 0,
    };

    it('should validate recipe without warnings', () => {
      const result = validateRecipeWithSections(baseRecipe);
      expect(result.isValid).toBe(true);
      expect(result.warnings.emptySections).toHaveLength(0);
    });

    it('should detect empty ingredient sections', () => {
      const recipeWithEmptySection = {
        ...baseRecipe,
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Empty Section',
            order: 0,
            items: [],
          },
          {
            id: 'section-2',
            name: 'Non-empty Section',
            order: 1,
            items: [
              {
                id: '1',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
                position: 0,
              },
            ],
          },
        ],
      };

      const result = validateRecipeWithSections(recipeWithEmptySection);
      expect(result.isValid).toBe(true);
      expect(result.warnings.emptySections).toHaveLength(1);
      expect(result.warnings.emptySections[0]).toEqual({
        sectionId: 'section-1',
        sectionName: 'Empty Section',
        type: 'ingredient',
      });
    });

    it('should detect empty instruction sections', () => {
      const recipeWithEmptySection = {
        ...baseRecipe,
        instructionSections: [
          {
            id: 'section-1',
            name: 'Empty Instructions',
            order: 0,
            items: [],
          },
        ],
      };

      const result = validateRecipeWithSections(recipeWithEmptySection);
      expect(result.isValid).toBe(true);
      expect(result.warnings.emptySections).toHaveLength(1);
      expect(result.warnings.emptySections[0]).toEqual({
        sectionId: 'section-1',
        sectionName: 'Empty Instructions',
        type: 'instruction',
      });
    });

    it('should detect multiple empty sections', () => {
      const recipeWithEmptySections = {
        ...baseRecipe,
        ingredientSections: [
          {
            id: 'ing-section-1',
            name: 'Empty Ingredients',
            order: 0,
            items: [],
          },
        ],
        instructionSections: [
          {
            id: 'inst-section-1',
            name: 'Empty Instructions',
            order: 0,
            items: [],
          },
        ],
      };

      const result = validateRecipeWithSections(recipeWithEmptySections);
      expect(result.isValid).toBe(true);
      expect(result.warnings.emptySections).toHaveLength(2);
    });

    it('should return validation errors for invalid recipe', () => {
      const invalidRecipe = {
        title: '', // Invalid: empty title
        ingredients: [], // Invalid: no ingredients
        instructions: [], // Invalid: no instructions
      };

      const result = validateRecipeWithSections(invalidRecipe);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateSectionName', () => {
    it('should return trimmed name for valid input', () => {
      expect(validateSectionName('  Valid Name  ')).toBe('Valid Name');
    });

    it('should return fallback for empty name', () => {
      expect(validateSectionName('')).toBe('Untitled Section');
      expect(validateSectionName('   ')).toBe('Untitled Section');
    });

    it('should handle normal names', () => {
      expect(validateSectionName('Cake Batter')).toBe('Cake Batter');
    });
  });

  describe('validateSectionOrder', () => {
    it('should validate unique positive orders', () => {
      const sections = [
        { id: '1', order: 0 },
        { id: '2', order: 1 },
        { id: '3', order: 2 },
      ];
      expect(validateSectionOrder(sections)).toBe(true);
    });

    it('should reject duplicate orders', () => {
      const sections = [
        { id: '1', order: 0 },
        { id: '2', order: 1 },
        { id: '3', order: 1 }, // Duplicate
      ];
      expect(validateSectionOrder(sections)).toBe(false);
    });

    it('should reject negative orders', () => {
      const sections = [
        { id: '1', order: -1 }, // Negative
        { id: '2', order: 0 },
      ];
      expect(validateSectionOrder(sections)).toBe(false);
    });

    it('should handle empty array', () => {
      expect(validateSectionOrder([])).toBe(true);
    });
  });

  describe('validateRecipeStructure', () => {
    it('should validate recipe without sections', () => {
      const recipe = {
        ingredients: [{ id: '1', name: 'Flour', amount: 2, unit: 'cups' , position: 0 }],
        instructions: [{ id: '1', step: 1, content: 'Mix' , position: 0 }],
      };

      const result = validateRecipeStructure(recipe);
      expect(result.isValid).toBe(true);
    });

    it('should validate recipe with consistent sections', () => {
      const recipe = {
        ingredients: [{ id: '1', name: 'Flour', amount: 2, unit: 'cups' , position: 0 }],
        instructions: [{ id: '1', step: 1, content: 'Mix' , position: 0 }],
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Dry',
            order: 0,
            items: [{ id: '1', name: 'Flour', amount: 2, unit: 'cups' , position: 0 }],
          },
        ],
        instructionSections: [
          {
            id: 'section-1',
            name: 'Prep',
            order: 0,
            items: [{ id: '1', step: 1, content: 'Mix' , position: 0 }],
          },
        ],
      };

      const result = validateRecipeStructure(recipe);
      expect(result.isValid).toBe(true);
    });

    it('should reject inconsistent ingredient counts', () => {
      const recipe = {
        ingredients: [
          { id: '1', name: 'Flour', amount: 2, unit: 'cups' , position: 0 },
          { id: '2', name: 'Sugar', amount: 1, unit: 'cup' , position: 0 },
        ],
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Dry',
            order: 0,
            items: [{ id: '1', name: 'Flour', amount: 2, unit: 'cups' , position: 0 }], // Only 1 item
          },
        ],
      };

      const result = validateRecipeStructure(recipe);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Ingredient sections and flat ingredients array are inconsistent');
    });

    it('should reject inconsistent instruction counts', () => {
      const recipe = {
        instructions: [
          { id: '1', step: 1, content: 'Mix' , position: 0 },
          { id: '2', step: 2, content: 'Bake' , position: 0 },
        ],
        instructionSections: [
          {
            id: 'section-1',
            name: 'Prep',
            order: 0,
            items: [{ id: '1', step: 1, content: 'Mix' , position: 0 }], // Only 1 item
          },
        ],
      };

      const result = validateRecipeStructure(recipe);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Instruction sections and flat instructions array are inconsistent');
    });

    it('should allow empty flat arrays when using sections', () => {
      const recipe = {
        ingredients: [],
        instructions: [],
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Dry',
            order: 0,
            items: [{ id: '1', name: 'Flour', amount: 2, unit: 'cups' , position: 0 }],
          },
        ],
        instructionSections: [
          {
            id: 'section-1',
            name: 'Prep',
            order: 0,
            items: [{ id: '1', step: 1, content: 'Mix' , position: 0 }],
          },
        ],
      };

      const result = validateRecipeStructure(recipe);
      expect(result.isValid).toBe(true);
    });
  });
});