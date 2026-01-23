import { describe, it, expect } from '@jest/globals';
import {
  strictIngredientSectionSchema,
  strictInstructionSectionSchema,
  strictRecipeWithSectionsSchema,
  validateRecipeStrict,
} from '../recipe-sections';

describe('Duplicate Section Names Support', () => {
  describe('Ingredient Sections', () => {
    it('should allow duplicate section names in ingredient sections', () => {
      const sections = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Sauce',
          order: 0,
          items: [
            {
              id: '22222222-2222-2222-2222-222222222222',
              name: 'Tomato',
              amount: 2,
              unit: 'cups',
            },
          ],
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Sauce',
          order: 1,
          items: [
            {
              id: '44444444-4444-4444-4444-444444444444',
              name: 'Cream',
              amount: 1,
              unit: 'cup',
            },
          ],
        },
      ];

      const result1 = strictIngredientSectionSchema.safeParse(sections[0]);
      const result2 = strictIngredientSectionSchema.safeParse(sections[1]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should allow three or more sections with the same name', () => {
      const sections = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Toppings',
          order: 0,
          items: [
            {
              id: '22222222-2222-2222-2222-222222222222',
              name: 'Cheese',
              amount: 1,
              unit: 'cup',
            },
          ],
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Toppings',
          order: 1,
          items: [
            {
              id: '44444444-4444-4444-4444-444444444444',
              name: 'Pepperoni',
              amount: 10,
              unit: 'slices',
            },
          ],
        },
        {
          id: '55555555-5555-5555-5555-555555555555',
          name: 'Toppings',
          order: 2,
          items: [
            {
              id: '66666666-6666-6666-6666-666666666666',
              name: 'Mushrooms',
              amount: 0.5,
              unit: 'cup',
            },
          ],
        },
      ];

      sections.forEach((section) => {
        const result = strictIngredientSectionSchema.safeParse(section);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Instruction Sections', () => {
    it('should allow duplicate section names in instruction sections', () => {
      const sections = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Preparation',
          order: 0,
          items: [
            {
              id: '22222222-2222-2222-2222-222222222222',
              step: 1,
              content: 'Chop vegetables',
            },
          ],
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Preparation',
          order: 1,
          items: [
            {
              id: '44444444-4444-4444-4444-444444444444',
              step: 2,
              content: 'Prepare sauce',
            },
          ],
        },
      ];

      const result1 = strictInstructionSectionSchema.safeParse(sections[0]);
      const result2 = strictInstructionSectionSchema.safeParse(sections[1]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe('Full Recipe Validation', () => {
    it('should allow recipe with duplicate ingredient section names', () => {
      const recipe = {
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Flour',
            amount: 2,
            unit: 'cups',
            sectionId: '22222222-2222-2222-2222-222222222222',
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Sugar',
            amount: 1,
            unit: 'cup',
            sectionId: '44444444-4444-4444-4444-444444444444',
          },
        ],
        instructions: [
          {
            id: '55555555-5555-5555-5555-555555555555',
            step: 1,
            content: 'Mix ingredients',
          },
        ],
        ingredientSections: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
          {
            id: '44444444-4444-4444-4444-444444444444',
            name: 'Dry Ingredients',
            order: 1,
            items: [
              {
                id: '33333333-3333-3333-3333-333333333333',
                name: 'Sugar',
                amount: 1,
                unit: 'cup',
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

      const result = validateRecipeStrict(recipe);
      expect(result.success).toBe(true);
    });

    it('should allow recipe with duplicate instruction section names', () => {
      const recipe = {
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Flour',
            amount: 2,
            unit: 'cups',
          },
        ],
        instructions: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            step: 1,
            content: 'Mix dry ingredients',
            sectionId: '33333333-3333-3333-3333-333333333333',
          },
          {
            id: '44444444-4444-4444-4444-444444444444',
            step: 2,
            content: 'Mix wet ingredients',
            sectionId: '55555555-5555-5555-5555-555555555555',
          },
        ],
        instructionSections: [
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Mixing',
            order: 0,
            items: [
              {
                id: '22222222-2222-2222-2222-222222222222',
                step: 1,
                content: 'Mix dry ingredients',
              },
            ],
          },
          {
            id: '55555555-5555-5555-5555-555555555555',
            name: 'Mixing',
            order: 1,
            items: [
              {
                id: '44444444-4444-4444-4444-444444444444',
                step: 2,
                content: 'Mix wet ingredients',
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

      const result = validateRecipeStrict(recipe);
      expect(result.success).toBe(true);
    });

    it('should distinguish sections with duplicate names by position/order', () => {
      const recipe = {
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Item 1',
            amount: 1,
            unit: 'unit',
            sectionId: '22222222-2222-2222-2222-222222222222',
          },
          {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Item 2',
            amount: 1,
            unit: 'unit',
            sectionId: '44444444-4444-4444-4444-444444444444',
          },
        ],
        instructions: [
          {
            id: '55555555-5555-5555-5555-555555555555',
            step: 1,
            content: 'Step 1',
          },
        ],
        ingredientSections: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Section',
            order: 0,
            items: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                name: 'Item 1',
                amount: 1,
                unit: 'unit',
              },
            ],
          },
          {
            id: '44444444-4444-4444-4444-444444444444',
            name: 'Section',
            order: 1,
            items: [
              {
                id: '33333333-3333-3333-3333-333333333333',
                name: 'Item 2',
                amount: 1,
                unit: 'unit',
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

      const result = validateRecipeStrict(recipe);
      expect(result.success).toBe(true);

      if (result.success && result.data.ingredientSections) {
        // Verify sections are distinguished by order
        const sections = result.data.ingredientSections;
        expect(sections[0].order).toBe(0);
        expect(sections[1].order).toBe(1);
        expect(sections[0].name).toBe('Section');
        expect(sections[1].name).toBe('Section');
        expect(sections[0].id).not.toBe(sections[1].id);
      }
    });
  });

  describe('Validation Rules with Duplicate Names', () => {
    it('should apply all validation rules independently to sections with duplicate names', () => {
      // Test that empty section validation still applies
      const invalidSection = {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Duplicate Name',
        order: 0,
        items: [], // Empty items - should fail
      };

      const result = strictIngredientSectionSchema.safeParse(invalidSection);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one ingredient');
      }
    });

    it('should apply name validation independently to each section', () => {
      // Test that empty name validation still applies
      const invalidSection = {
        id: '11111111-1111-1111-1111-111111111111',
        name: '   ', // Whitespace only - should fail
        order: 0,
        items: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Item',
            amount: 1,
            unit: 'unit',
          },
        ],
      };

      const result = strictIngredientSectionSchema.safeParse(invalidSection);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('whitespace');
      }
    });
  });
});
