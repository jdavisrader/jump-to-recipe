import { describe, it, expect } from '@jest/globals';
import { createRecipeSchema, updateRecipeSchema } from '../recipe';

describe('Recipe Schema Backward Compatibility', () => {
  const legacyRecipeData = {
    title: 'Classic Chocolate Cake',
    description: 'A delicious chocolate cake recipe',
    ingredients: [
      {
        id: '1',
        name: 'All-purpose flour',
        amount: 2,
        unit: 'cups',
      },
      {
        id: '2',
        name: 'Sugar',
        amount: 1.5,
        unit: 'cups',
      },
      {
        id: '3',
        name: 'Cocoa powder',
        amount: 0.75,
        unit: 'cups',
      },
    ],
    instructions: [
      {
        id: '1',
        step: 1,
        content: 'Preheat oven to 350°F (175°C).',
      },
      {
        id: '2',
        step: 2,
        content: 'In a large bowl, mix flour, sugar, and cocoa powder.',
      },
      {
        id: '3',
        step: 3,
        content: 'Bake for 30-35 minutes until a toothpick comes out clean.',
      },
    ],
    prepTime: 20,
    cookTime: 35,
    servings: 8,
    difficulty: 'medium' as const,
    tags: ['dessert', 'chocolate', 'cake'],
    notes: 'Best served with vanilla ice cream',
    visibility: 'public' as const,
    commentsEnabled: true,
    viewCount: 0,
    likeCount: 0,
  };

  describe('createRecipeSchema', () => {
    it('should validate legacy recipe data without sections', () => {
      const result = createRecipeSchema.safeParse(legacyRecipeData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.title).toBe('Classic Chocolate Cake');
        expect(result.data.ingredients).toHaveLength(3);
        expect(result.data.instructions).toHaveLength(3);
        expect(result.data.ingredientSections).toBeUndefined();
        expect(result.data.instructionSections).toBeUndefined();
      }
    });

    it('should validate recipe data with optional sections', () => {
      const recipeWithSections = {
        ...legacyRecipeData,
        ingredientSections: [
          {
            id: 'dry-ingredients',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              {
                id: '1',
                name: 'All-purpose flour',
                amount: 2,
                unit: 'cups',
              },
              {
                id: '3',
                name: 'Cocoa powder',
                amount: 0.75,
                unit: 'cups',
              },
            ],
          },
          {
            id: 'wet-ingredients',
            name: 'Wet Ingredients',
            order: 1,
            items: [
              {
                id: '2',
                name: 'Sugar',
                amount: 1.5,
                unit: 'cups',
              },
            ],
          },
        ],
        instructionSections: [
          {
            id: 'preparation',
            name: 'Preparation',
            order: 0,
            items: [
              {
                id: '1',
                step: 1,
                content: 'Preheat oven to 350°F (175°C).',
              },
              {
                id: '2',
                step: 2,
                content: 'In a large bowl, mix flour, sugar, and cocoa powder.',
              },
            ],
          },
          {
            id: 'baking',
            name: 'Baking',
            order: 1,
            items: [
              {
                id: '3',
                step: 3,
                content: 'Bake for 30-35 minutes until a toothpick comes out clean.',
              },
            ],
          },
        ],
      };

      const result = createRecipeSchema.safeParse(recipeWithSections);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.ingredientSections).toHaveLength(2);
        expect(result.data.instructionSections).toHaveLength(2);
        expect(result.data.ingredientSections![0].name).toBe('Dry Ingredients');
        expect(result.data.instructionSections![0].name).toBe('Preparation');
      }
    });

    it('should reject invalid recipe data', () => {
      const invalidRecipe = {
        title: '', // Invalid: empty title
        ingredients: [], // Invalid: no ingredients
        instructions: [], // Invalid: no instructions
      };

      const result = createRecipeSchema.safeParse(invalidRecipe);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => issue.message);
        expect(errors).toContain('Title is required');
        expect(errors).toContain('At least one ingredient is required');
        expect(errors).toContain('At least one instruction is required');
      }
    });
  });

  describe('updateRecipeSchema', () => {
    it('should validate partial recipe updates', () => {
      const partialUpdate = {
        title: 'Updated Chocolate Cake',
        prepTime: 25,
      };

      const result = updateRecipeSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.title).toBe('Updated Chocolate Cake');
        expect(result.data.prepTime).toBe(25);
      }
    });

    it('should validate updates with sections', () => {
      const updateWithSections = {
        ingredientSections: [
          {
            id: 'updated-section',
            name: 'Updated Ingredients',
            order: 0,
            items: [
              {
                id: '1',
                name: 'Updated flour',
                amount: 2.5,
                unit: 'cups',
              },
            ],
          },
        ],
      };

      const result = updateRecipeSchema.safeParse(updateWithSections);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.ingredientSections).toHaveLength(1);
        expect(result.data.ingredientSections![0].name).toBe('Updated Ingredients');
      }
    });

    it('should not allow authorId updates', () => {
      const updateWithAuthorId = {
        title: 'Updated Recipe',
        authorId: 'new-author-id', // Should be omitted
      };

      const result = updateRecipeSchema.safeParse(updateWithAuthorId);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.title).toBe('Updated Recipe');
        // authorId should be stripped out by the schema
        expect((result.data as any).authorId).toBeUndefined();
      }
    });
  });

  describe('Extended ingredient and instruction compatibility', () => {
    it('should handle ingredients with sectionId in legacy context', () => {
      const recipeWithSectionIds = {
        ...legacyRecipeData,
        ingredients: [
          {
            id: '1',
            name: 'Flour',
            amount: 2,
            unit: 'cups',
            sectionId: 'dry-ingredients', // Extended field
          },
          {
            id: '2',
            name: 'Sugar',
            amount: 1,
            unit: 'cup',
            // No sectionId - should still work
          },
        ],
      };

      const result = createRecipeSchema.safeParse(recipeWithSectionIds);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.ingredients[0].sectionId).toBe('dry-ingredients');
        expect(result.data.ingredients[1].sectionId).toBeUndefined();
      }
    });

    it('should handle instructions with sectionId in legacy context', () => {
      const recipeWithSectionIds = {
        ...legacyRecipeData,
        instructions: [
          {
            id: '1',
            step: 1,
            content: 'Preheat oven',
            sectionId: 'preparation', // Extended field
          },
          {
            id: '2',
            step: 2,
            content: 'Mix ingredients',
            // No sectionId - should still work
          },
        ],
      };

      const result = createRecipeSchema.safeParse(recipeWithSectionIds);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.instructions[0].sectionId).toBe('preparation');
        expect(result.data.instructions[1].sectionId).toBeUndefined();
      }
    });
  });
});