import { SectionDataTransformer, sectionUtils } from '../section-utils';
import { 
  Ingredient, 
  Instruction 
} from '@/types/recipe';
import { 
  ExtendedIngredient, 
  ExtendedInstruction, 
  IngredientSection, 
  InstructionSection,
  Section 
} from '@/types/sections';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

describe('SectionDataTransformer', () => {
  describe('ingredientsToSections', () => {
    it('should convert flat ingredients to sections when sectionIds are present', () => {
      const ingredients: ExtendedIngredient[] = [
        {
          id: '1',
          name: 'Flour',
          amount: 2,
          unit: 'cup',
          sectionId: 'section-1'
        },
        {
          id: '2',
          name: 'Sugar',
          amount: 1,
          unit: 'cup',
          sectionId: 'section-1'
        },
        {
          id: '3',
          name: 'Butter',
          amount: 0.5,
          unit: 'cup',
          sectionId: 'section-2'
        }
      ];

      const sections = SectionDataTransformer.ingredientsToSections(ingredients);

      expect(sections).toHaveLength(2);
      expect(sections[0].id).toBe('section-1');
      expect(sections[0].items).toHaveLength(2);
      expect(sections[1].id).toBe('section-2');
      expect(sections[1].items).toHaveLength(1);
    });

    it('should create default section for ingredients without sectionId', () => {
      const ingredients: ExtendedIngredient[] = [
        {
          id: '1',
          name: 'Flour',
          amount: 2,
          unit: 'cup'
        },
        {
          id: '2',
          name: 'Sugar',
          amount: 1,
          unit: 'cup'
        }
      ];

      const sections = SectionDataTransformer.ingredientsToSections(ingredients);

      expect(sections).toHaveLength(1);
      expect(sections[0].name).toBe('Ingredients');
      expect(sections[0].items).toHaveLength(2);
      expect(sections[0].items[0].name).toBe('Flour');
      expect(sections[0].items[1].name).toBe('Sugar');
    });

    it('should handle mixed sectioned and unsectioned ingredients', () => {
      const ingredients: ExtendedIngredient[] = [
        {
          id: '1',
          name: 'Flour',
          amount: 2,
          unit: 'cup'
        },
        {
          id: '2',
          name: 'Sugar',
          amount: 1,
          unit: 'cup',
          sectionId: 'section-1'
        }
      ];

      const sections = SectionDataTransformer.ingredientsToSections(ingredients);

      expect(sections).toHaveLength(2);
      expect(sections[0].name).toBe('Ingredients');
      expect(sections[0].items).toHaveLength(1);
      expect(sections[1].id).toBe('section-1');
      expect(sections[1].items).toHaveLength(1);
    });

    it('should return empty array for empty ingredients', () => {
      const sections = SectionDataTransformer.ingredientsToSections([]);
      expect(sections).toHaveLength(0);
    });
  });

  describe('instructionsToSections', () => {
    it('should convert flat instructions to sections when sectionIds are present', () => {
      const instructions: ExtendedInstruction[] = [
        {
          id: '1',
          step: 1,
          content: 'Mix dry ingredients',
          sectionId: 'section-1'
        },
        {
          id: '2',
          step: 2,
          content: 'Add wet ingredients',
          sectionId: 'section-1'
        },
        {
          id: '3',
          step: 3,
          content: 'Bake for 30 minutes',
          sectionId: 'section-2'
        }
      ];

      const sections = SectionDataTransformer.instructionsToSections(instructions);

      expect(sections).toHaveLength(2);
      expect(sections[0].id).toBe('section-1');
      expect(sections[0].items).toHaveLength(2);
      expect(sections[1].id).toBe('section-2');
      expect(sections[1].items).toHaveLength(1);
    });

    it('should create default section for instructions without sectionId', () => {
      const instructions: ExtendedInstruction[] = [
        {
          id: '1',
          step: 1,
          content: 'Mix ingredients'
        },
        {
          id: '2',
          step: 2,
          content: 'Bake'
        }
      ];

      const sections = SectionDataTransformer.instructionsToSections(instructions);

      expect(sections).toHaveLength(1);
      expect(sections[0].name).toBe('Instructions');
      expect(sections[0].items).toHaveLength(2);
    });
  });

  describe('sectionsToIngredients', () => {
    it('should convert sections back to flat ingredients with sectionId', () => {
      const sections: IngredientSection[] = [
        {
          id: 'section-1',
          name: 'Dry Ingredients',
          order: 0,
          items: [
            {
              id: '1',
              name: 'Flour',
              amount: 2,
              unit: 'cup'
            }
          ]
        },
        {
          id: 'section-2',
          name: 'Wet Ingredients',
          order: 1,
          items: [
            {
              id: '2',
              name: 'Milk',
              amount: 1,
              unit: 'cup'
            }
          ]
        }
      ];

      const ingredients = SectionDataTransformer.sectionsToIngredients(sections);

      expect(ingredients).toHaveLength(2);
      expect(ingredients[0].sectionId).toBe('section-1');
      expect(ingredients[1].sectionId).toBe('section-2');
    });
  });

  describe('sectionsToInstructions', () => {
    it('should convert sections back to flat instructions with sectionId', () => {
      const sections: InstructionSection[] = [
        {
          id: 'section-1',
          name: 'Preparation',
          order: 0,
          items: [
            {
              id: '1',
              step: 1,
              content: 'Preheat oven'
            }
          ]
        }
      ];

      const instructions = SectionDataTransformer.sectionsToInstructions(sections);

      expect(instructions).toHaveLength(1);
      expect(instructions[0].sectionId).toBe('section-1');
    });
  });

  describe('sectionsToFlatIngredients', () => {
    it('should convert sections to flat ingredients without sectionId', () => {
      const sections: IngredientSection[] = [
        {
          id: 'section-1',
          name: 'Ingredients',
          order: 0,
          items: [
            {
              id: '1',
              name: 'Flour',
              amount: 2,
              unit: 'cup'
            }
          ]
        }
      ];

      const ingredients = SectionDataTransformer.sectionsToFlatIngredients(sections);

      expect(ingredients).toHaveLength(1);
      expect(ingredients[0]).not.toHaveProperty('sectionId');
      expect(ingredients[0].name).toBe('Flour');
    });
  });

  describe('migrateRecipeToSections', () => {
    it('should migrate existing recipe to support sections', () => {
      const recipe = {
        id: '1',
        title: 'Test Recipe',
        description: 'A test recipe',
        ingredients: [
          {
            id: '1',
            name: 'Flour',
            amount: 2,
            unit: 'cup' as const
          }
        ],
        instructions: [
          {
            id: '1',
            step: 1,
            content: 'Mix ingredients'
          }
        ],
        prepTime: null,
        cookTime: null,
        servings: null,
        difficulty: null,
        tags: [],
        notes: null,
        imageUrl: null,
        sourceUrl: null,
        authorId: null,
        visibility: 'public' as const,
        commentsEnabled: true,
        viewCount: 0,
        likeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const migratedRecipe = SectionDataTransformer.migrateRecipeToSections(recipe);

      expect(migratedRecipe.ingredients).toHaveLength(1);
      expect(migratedRecipe.ingredients[0].sectionId).toBeUndefined();
      expect(migratedRecipe.instructions).toHaveLength(1);
      expect(migratedRecipe.instructions[0].sectionId).toBeUndefined();
      expect(migratedRecipe.ingredientSections).toBeUndefined();
      expect(migratedRecipe.instructionSections).toBeUndefined();
    });
  });

  describe('hasSections', () => {
    it('should return true when recipe has ingredient sections', () => {
      const recipe = {
        ingredients: [],
        instructions: [],
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Test',
            order: 0,
            items: []
          }
        ]
      };

      expect(SectionDataTransformer.hasSections(recipe)).toBe(true);
    });

    it('should return true when recipe has instruction sections', () => {
      const recipe = {
        ingredients: [],
        instructions: [],
        instructionSections: [
          {
            id: 'section-1',
            name: 'Test',
            order: 0,
            items: []
          }
        ]
      };

      expect(SectionDataTransformer.hasSections(recipe)).toBe(true);
    });

    it('should return false when recipe has no sections', () => {
      const recipe = {
        ingredients: [],
        instructions: []
      };

      expect(SectionDataTransformer.hasSections(recipe)).toBe(false);
    });
  });

  describe('createEmptySection', () => {
    it('should create empty section with default values', () => {
      const section = SectionDataTransformer.createEmptySection();

      expect(section.id).toBe('mock-uuid-123');
      expect(section.name).toBe('Untitled Section');
      expect(section.order).toBe(0);
      expect(section.items).toHaveLength(0);
    });

    it('should create empty section with custom values', () => {
      const section = SectionDataTransformer.createEmptySection('Custom Name', 5);

      expect(section.name).toBe('Custom Name');
      expect(section.order).toBe(5);
    });
  });

  describe('reorderSections', () => {
    it('should reorder sections based on new order array', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Section A', order: 0, items: [] },
        { id: 'b', name: 'Section B', order: 1, items: [] },
        { id: 'c', name: 'Section C', order: 2, items: [] }
      ];

      const reordered = SectionDataTransformer.reorderSections(sections, ['c', 'a', 'b']);

      expect(reordered).toHaveLength(3);
      expect(reordered[0].id).toBe('c');
      expect(reordered[0].order).toBe(0);
      expect(reordered[1].id).toBe('a');
      expect(reordered[1].order).toBe(1);
      expect(reordered[2].id).toBe('b');
      expect(reordered[2].order).toBe(2);
    });

    it('should handle missing section IDs gracefully', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Section A', order: 0, items: [] }
      ];

      const reordered = SectionDataTransformer.reorderSections(sections, ['a', 'missing']);

      expect(reordered).toHaveLength(1);
      expect(reordered[0].id).toBe('a');
    });
  });

  describe('validateSections', () => {
    it('should validate sections successfully', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Section A', order: 0, items: [] },
        { id: 'b', name: 'Section B', order: 1, items: [] }
      ];

      const result = SectionDataTransformer.validateSections(sections);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate IDs', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Section A', order: 0, items: [] },
        { id: 'a', name: 'Section B', order: 1, items: [] }
      ];

      const result = SectionDataTransformer.validateSections(sections);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Duplicate section IDs');
    });

    it('should detect invalid order values', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Section A', order: -1, items: [] }
      ];

      const result = SectionDataTransformer.validateSections(sections);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Section orders must be non-negative integers');
    });

    it('should detect empty section names', () => {
      const sections: Section[] = [
        { id: 'a', name: '', order: 0, items: [] }
      ];

      const result = SectionDataTransformer.validateSections(sections);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('section(s) have empty names');
    });
  });
});

describe('sectionUtils', () => {
  describe('generateSectionName', () => {
    it('should generate unique section name', () => {
      const existingNames = ['Section', 'Section 1', 'Section 3'];
      const name = sectionUtils.generateSectionName(existingNames);

      expect(name).toBe('Section 2');
    });

    it('should use base name when no conflicts', () => {
      const existingNames = ['Other Section'];
      const name = sectionUtils.generateSectionName(existingNames, 'New Section');

      expect(name).toBe('New Section');
    });
  });

  describe('isSectionEmpty', () => {
    it('should return true for empty section', () => {
      const section: Section = {
        id: 'a',
        name: 'Empty Section',
        order: 0,
        items: []
      };

      expect(sectionUtils.isSectionEmpty(section)).toBe(true);
    });

    it('should return false for non-empty section', () => {
      const section: Section = {
        id: 'a',
        name: 'Non-empty Section',
        order: 0,
        items: [{ id: '1', name: 'Item' }]
      };

      expect(sectionUtils.isSectionEmpty(section)).toBe(false);
    });
  });

  describe('getEmptySections', () => {
    it('should return only empty sections', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Empty', order: 0, items: [] },
        { id: 'b', name: 'Not Empty', order: 1, items: [{ id: '1' }] },
        { id: 'c', name: 'Also Empty', order: 2, items: [] }
      ];

      const emptySections = sectionUtils.getEmptySections(sections);

      expect(emptySections).toHaveLength(2);
      expect(emptySections[0].id).toBe('a');
      expect(emptySections[1].id).toBe('c');
    });
  });

  describe('removeEmptySections', () => {
    it('should remove empty sections', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Empty', order: 0, items: [] },
        { id: 'b', name: 'Not Empty', order: 1, items: [{ id: '1' }] }
      ];

      const nonEmptySections = sectionUtils.removeEmptySections(sections);

      expect(nonEmptySections).toHaveLength(1);
      expect(nonEmptySections[0].id).toBe('b');
    });
  });

  describe('findSectionById', () => {
    it('should find section by ID', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Section A', order: 0, items: [] },
        { id: 'b', name: 'Section B', order: 1, items: [] }
      ];

      const found = sectionUtils.findSectionById(sections, 'b');

      expect(found).toBeDefined();
      expect(found!.name).toBe('Section B');
    });

    it('should return undefined for non-existent ID', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Section A', order: 0, items: [] }
      ];

      const found = sectionUtils.findSectionById(sections, 'missing');

      expect(found).toBeUndefined();
    });
  });

  describe('updateSection', () => {
    it('should update section in array', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Section A', order: 0, items: [] },
        { id: 'b', name: 'Section B', order: 1, items: [] }
      ];

      const updatedSection = { id: 'a', name: 'Updated Section A', order: 0, items: [] };
      const result = sectionUtils.updateSection(sections, updatedSection);

      expect(result[0].name).toBe('Updated Section A');
      expect(result[1].name).toBe('Section B');
    });
  });

  describe('removeSection', () => {
    it('should remove section from array', () => {
      const sections: Section[] = [
        { id: 'a', name: 'Section A', order: 0, items: [] },
        { id: 'b', name: 'Section B', order: 1, items: [] }
      ];

      const result = sectionUtils.removeSection(sections, 'a');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b');
    });
  });
});