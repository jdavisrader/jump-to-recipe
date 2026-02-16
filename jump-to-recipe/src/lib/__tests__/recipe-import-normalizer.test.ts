/**
 * Unit tests for recipe import normalization functions
 * 
 * Tests Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.2, 11.3, 11.4, 11.5
 */

import {
  normalizeImportedRecipe,
  normalizeExistingRecipe,
  createNormalizationSummary,
  formatNormalizationSummary,
  type NormalizationSummary,
} from '../recipe-import-normalizer';

describe('recipe-import-normalizer', () => {
  describe('normalizeImportedRecipe', () => {
    it('should assign "Imported Section" name when section name is missing (Req 6.1)', () => {
      const summary = createNormalizationSummary();
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            items: [{ name: 'Flour', amount: 2, unit: 'cups' , position: 0 }],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported, summary);

      expect(result.ingredientSections).toBeDefined();
      expect(result.ingredientSections[0].name).toBe('Imported Section');
      expect(summary.sectionsRenamed).toBe(1);
    });

    it('should assign "Imported Section" name when section name is empty string (Req 6.1)', () => {
      const summary = createNormalizationSummary();
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            name: '',
            items: [{ name: 'Sugar', amount: 1, unit: 'cup' , position: 0 }],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported, summary);

      expect(result.ingredientSections[0].name).toBe('Imported Section');
      expect(summary.sectionsRenamed).toBe(1);
    });

    it('should assign "Imported Section" name when section name is whitespace (Req 6.1)', () => {
      const summary = createNormalizationSummary();
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            name: '   ',
            items: [{ name: 'Salt', amount: 1, unit: 'tsp' , position: 0 }],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported, summary);

      expect(result.ingredientSections[0].name).toBe('Imported Section');
      expect(summary.sectionsRenamed).toBe(1);
    });

    it('should flatten empty sections (Req 6.2)', () => {
      const summary = createNormalizationSummary();
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            name: 'Valid Section',
            items: [{ name: 'Flour', amount: 2, unit: 'cups' , position: 0 }],
          },
          {
            name: 'Empty Section',
            items: [],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported, summary);

      expect(result.ingredientSections).toHaveLength(1);
      expect(result.ingredientSections[0].name).toBe('Valid Section');
      expect(summary.sectionsFlattened).toBe(1);
    });

    it('should auto-assign sequential positions when missing (Req 6.3)', () => {
      const summary = createNormalizationSummary();
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            name: 'Section 1',
            items: [{ name: 'Flour', amount: 2, unit: 'cups' , position: 0 }],
          },
          {
            name: 'Section 2',
            items: [{ name: 'Sugar', amount: 1, unit: 'cup' , position: 0 }],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported, summary);

      expect(result.ingredientSections[0].order).toBe(0);
      expect(result.ingredientSections[1].order).toBe(1);
      expect(summary.positionsAssigned).toBeGreaterThan(0);
    });

    it('should drop items with empty text (Req 6.4)', () => {
      const summary = createNormalizationSummary();
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            name: 'Ingredients',
            items: [
              { name: 'Flour', amount: 2, unit: 'cups' , position: 0 },
              { name: '', amount: 1, unit: 'cup' , position: 0 },
              { name: '   ', amount: 1, unit: 'tsp' , position: 0 },
            ],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported, summary);

      expect(result.ingredientSections[0].items).toHaveLength(1);
      expect(result.ingredientSections[0].items[0].name).toBe('Flour');
      expect(summary.itemsDropped).toBe(2);
    });

    it('should drop instruction items with empty content (Req 6.4)', () => {
      const summary = createNormalizationSummary();
      const imported = {
        title: 'Test Recipe',
        instructionSections: [
          {
            name: 'Steps',
            items: [
              { content: 'Mix ingredients' },
              { content: '' },
              { content: '   ' },
            ],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported, summary);

      expect(result.instructionSections[0].items).toHaveLength(1);
      expect(result.instructionSections[0].items[0].content).toBe('Mix ingredients');
      expect(summary.itemsDropped).toBe(2);
    });

    it('should generate UUIDs for items missing IDs (Req 6.5)', () => {
      const summary = createNormalizationSummary();
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            name: 'Ingredients',
            items: [
              { name: 'Flour', amount: 2, unit: 'cups' , position: 0 },
              { name: 'Sugar', amount: 1, unit: 'cup' , position: 0 },
            ],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported, summary);

      expect(result.ingredientSections[0].items[0].id).toBeDefined();
      expect(result.ingredientSections[0].items[1].id).toBeDefined();
      expect(summary.idsGenerated).toBeGreaterThan(0);
    });

    it('should handle recipes with no sections (Req 6.5)', () => {
      const imported = {
        title: 'Simple Recipe',
        ingredients: [],
        instructions: [],
      };

      const result = normalizeImportedRecipe(imported);

      expect(result.ingredientSections).toBeUndefined();
      expect(result.instructionSections).toBeUndefined();
      expect(result.ingredients).toEqual([]);
      expect(result.instructions).toEqual([]);
    });

    it('should build flat arrays from sections for backward compatibility', () => {
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            name: 'Dry Ingredients',
            items: [
              { name: 'Flour', amount: 2, unit: 'cups' , position: 0 },
              { name: 'Sugar', amount: 1, unit: 'cup' , position: 0 },
            ],
          },
          {
            name: 'Wet Ingredients',
            items: [
              { name: 'Milk', amount: 1, unit: 'cup' , position: 0 },
            ],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported);

      expect(result.ingredients).toHaveLength(3);
      expect(result.ingredients[0].name).toBe('Flour');
      expect(result.ingredients[1].name).toBe('Sugar');
      expect(result.ingredients[2].name).toBe('Milk');
      expect(result.ingredients[0].sectionId).toBeDefined();
    });

    it('should handle complex normalization scenario', () => {
      const summary = createNormalizationSummary();
      const imported = {
        title: 'Complex Recipe',
        ingredientSections: [
          {
            name: '',
            items: [{ name: 'Flour', amount: 2, unit: 'cups' , position: 0 }],
          },
          {
            name: 'Valid Section',
            items: [
              { name: 'Sugar', amount: 1, unit: 'cup' , position: 0 },
              { name: '', amount: 1, unit: 'tsp' , position: 0 },
            ],
          },
          {
            name: 'Empty Section',
            items: [],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported, summary);

      expect(result.ingredientSections).toHaveLength(2);
      expect(result.ingredientSections[0].name).toBe('Imported Section');
      expect(result.ingredientSections[1].name).toBe('Valid Section');
      expect(result.ingredientSections[1].items).toHaveLength(1);
      expect(summary.sectionsRenamed).toBe(1);
      expect(summary.sectionsFlattened).toBe(1);
      expect(summary.itemsDropped).toBe(1);
    });

    it('should preserve existing valid data', () => {
      const imported = {
        title: 'Valid Recipe',
        ingredientSections: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Ingredients',
            order: 0,
            items: [
              {
                id: '123e4567-e89b-12d3-a456-426614174001',
                name: 'Flour',
                amount: 2,
                unit: 'cups',
              },
            ],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported);

      expect(result.ingredientSections[0].id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.ingredientSections[0].name).toBe('Ingredients');
      expect(result.ingredientSections[0].items[0].id).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });

  describe('normalizeExistingRecipe', () => {
    it('should normalize existing recipe data (Req 11.1, 11.2, 11.3)', () => {
      const existing = {
        title: 'Existing Recipe',
        ingredientSections: [
          {
            name: '',
            items: [{ name: 'Flour', amount: 2, unit: 'cups' , position: 0 }],
          },
        ],
      };

      const result = normalizeExistingRecipe(existing);

      expect(result.ingredientSections[0].name).toBe('Imported Section');
    });

    it('should apply same normalization rules as imported recipes (Req 11.4, 11.5)', () => {
      const summary = createNormalizationSummary();
      const existing = {
        title: 'Legacy Recipe',
        ingredientSections: [
          {
            items: [
              { name: 'Flour', amount: 2, unit: 'cups' , position: 0 },
              { name: '', amount: 1, unit: 'cup' , position: 0 },
            ],
          },
          {
            name: 'Empty',
            items: [],
          },
        ],
      };

      const result = normalizeExistingRecipe(existing, summary);

      expect(result.ingredientSections).toHaveLength(1);
      expect(summary.sectionsRenamed).toBe(1);
      expect(summary.sectionsFlattened).toBe(1);
      expect(summary.itemsDropped).toBe(1);
    });
  });

  describe('createNormalizationSummary', () => {
    it('should create empty summary with default values', () => {
      const summary = createNormalizationSummary();

      expect(summary.sectionsRenamed).toBe(0);
      expect(summary.sectionsFlattened).toBe(0);
      expect(summary.itemsDropped).toBe(0);
      expect(summary.idsGenerated).toBe(0);
      expect(summary.positionsAssigned).toBe(0);
    });
  });

  describe('formatNormalizationSummary', () => {
    it('should format summary with no changes', () => {
      const summary = createNormalizationSummary();
      const message = formatNormalizationSummary(summary);

      expect(message).toBe('No changes needed');
    });

    it('should format summary with single change', () => {
      const summary: NormalizationSummary = {
        sectionsRenamed: 1,
        sectionsFlattened: 0,
        itemsDropped: 0,
        idsGenerated: 0,
        positionsAssigned: 0,
      };
      const message = formatNormalizationSummary(summary);

      expect(message).toBe('Fixed: renamed 1 section');
    });

    it('should format summary with multiple changes', () => {
      const summary: NormalizationSummary = {
        sectionsRenamed: 2,
        sectionsFlattened: 1,
        itemsDropped: 3,
        idsGenerated: 5,
        positionsAssigned: 4,
      };
      const message = formatNormalizationSummary(summary);

      expect(message).toContain('removed 1 empty section');
      expect(message).toContain('renamed 2 sections');
      expect(message).toContain('dropped 3 empty items');
      expect(message).toContain('generated 5 IDs');
      expect(message).toContain('assigned 4 positions');
    });

    it('should use correct pluralization', () => {
      const summary: NormalizationSummary = {
        sectionsRenamed: 1,
        sectionsFlattened: 2,
        itemsDropped: 1,
        idsGenerated: 1,
        positionsAssigned: 2,
      };
      const message = formatNormalizationSummary(summary);

      expect(message).toContain('removed 2 empty sections');
      expect(message).toContain('renamed 1 section');
      expect(message).toContain('dropped 1 empty item');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined sections', () => {
      const imported = {
        title: 'Test Recipe',
        ingredientSections: undefined,
        instructionSections: undefined,
      };

      const result = normalizeImportedRecipe(imported);

      expect(result.ingredientSections).toBeUndefined();
      expect(result.instructionSections).toBeUndefined();
    });

    it('should handle empty sections array', () => {
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [],
        instructionSections: [],
      };

      const result = normalizeImportedRecipe(imported);

      expect(result.ingredientSections).toBeUndefined();
      expect(result.instructionSections).toBeUndefined();
    });

    it('should handle sections with all empty items', () => {
      const summary = createNormalizationSummary();
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            name: 'Section',
            items: [
              { name: '', amount: 1, unit: 'cup' , position: 0 },
              { name: '   ', amount: 2, unit: 'tsp' , position: 0 },
            ],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported, summary);

      expect(result.ingredientSections).toBeUndefined();
      expect(summary.itemsDropped).toBe(2);
      expect(summary.sectionsFlattened).toBe(1);
    });

    it('should trim whitespace from item text', () => {
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            name: '  Ingredients  ',
            items: [
              { name: '  Flour  ', amount: 2, unit: 'cups' , position: 0 },
            ],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported);

      expect(result.ingredientSections[0].name).toBe('Ingredients');
      expect(result.ingredientSections[0].items[0].name).toBe('Flour');
    });

    it('should handle instruction items without step numbers', () => {
      const imported = {
        title: 'Test Recipe',
        instructionSections: [
          {
            name: 'Steps',
            items: [
              { content: 'First step' },
              { content: 'Second step' },
            ],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported);

      expect(result.instructionSections[0].items[0].step).toBe(1);
      expect(result.instructionSections[0].items[1].step).toBe(2);
    });

    it('should preserve optional fields', () => {
      const imported = {
        title: 'Test Recipe',
        ingredientSections: [
          {
            name: 'Ingredients',
            items: [
              {
                name: 'Flour',
                amount: 2,
                unit: 'cups',
                displayAmount: '2',
                notes: 'All-purpose',
                category: 'Dry',
              },
            ],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported);

      expect(result.ingredientSections[0].items[0].displayAmount).toBe('2');
      expect(result.ingredientSections[0].items[0].notes).toBe('All-purpose');
      expect(result.ingredientSections[0].items[0].category).toBe('Dry');
    });

    it('should NOT rebuild flat arrays when explicitly empty (sections-only mode)', () => {
      // This test verifies the bug fix for ingredient duplication
      // When using sections, flat arrays should remain empty
      const imported = {
        title: 'Sectioned Recipe',
        ingredients: [], // Explicitly empty - indicates sections-only mode
        instructions: [], // Explicitly empty - indicates sections-only mode
        ingredientSections: [
          {
            name: 'Section 1',
            items: [
              { name: 'Flour', amount: 2, unit: 'cups' , position: 0 },
              { name: 'Sugar', amount: 1, unit: 'cup' , position: 0 },
            ],
          },
        ],
        instructionSections: [
          {
            name: 'Preparation',
            items: [
              { content: 'Mix ingredients' },
            ],
          },
        ],
      };

      const result = normalizeImportedRecipe(imported);

      // Flat arrays should remain empty when explicitly provided as empty
      expect(result.ingredients).toEqual([]);
      expect(result.instructions).toEqual([]);

      // Sections should be normalized correctly
      expect(result.ingredientSections).toHaveLength(1);
      expect(result.ingredientSections![0].items).toHaveLength(2);
      expect(result.instructionSections).toHaveLength(1);
      expect(result.instructionSections![0].items).toHaveLength(1);
    });
  });
});
