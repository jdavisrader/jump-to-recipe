import { validateRecipeWithSections, validateSectionName, validateSectionOrder } from '../recipe';

describe('Empty Section Validation', () => {
  describe('validateRecipeWithSections', () => {
    const baseRecipe = {
      title: 'Test Recipe',
      description: 'A test recipe',
      ingredients: [
        { id: '1', name: 'Flour', amount: 2, unit: 'cups' , position: 0 },
      ],
      instructions: [
        { id: '1', step: 1, content: 'Mix ingredients' , position: 0 },
      ],
      tags: [],
      visibility: 'private' as const,
    };

    it('validates recipe without sections successfully', () => {
      const result = validateRecipeWithSections(baseRecipe);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings.emptySections).toHaveLength(0);
    });

    it('validates recipe with non-empty sections successfully', () => {
      const recipeWithSections = {
        ...baseRecipe,
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Dry Ingredients',
            order: 0,
            items: [
              { id: '1', name: 'Flour', amount: 2, unit: 'cups' , position: 0 },
            ],
          },
        ],
        instructionSections: [
          {
            id: 'section-2',
            name: 'Mixing',
            order: 0,
            items: [
              { id: '1', step: 1, content: 'Mix ingredients' , position: 0 },
            ],
          },
        ],
      };

      const result = validateRecipeWithSections(recipeWithSections);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings.emptySections).toHaveLength(0);
    });

    it('detects empty ingredient sections', () => {
      const recipeWithEmptyIngredientSection = {
        ...baseRecipe,
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Dry Ingredients',
            order: 0,
            items: [],
          },
          {
            id: 'section-2',
            name: 'Wet Ingredients',
            order: 1,
            items: [
              { id: '1', name: 'Milk', amount: 1, unit: 'cup' , position: 0 },
            ],
          },
        ],
      };

      const result = validateRecipeWithSections(recipeWithEmptyIngredientSection);

      expect(result.isValid).toBe(true);
      expect(result.warnings.emptySections).toHaveLength(1);
      expect(result.warnings.emptySections[0]).toEqual({
        sectionId: 'section-1',
        sectionName: 'Dry Ingredients',
        type: 'ingredient',
      });
    });

    it('detects empty instruction sections', () => {
      const recipeWithEmptyInstructionSection = {
        ...baseRecipe,
        instructionSections: [
          {
            id: 'section-1',
            name: 'Preparation',
            order: 0,
            items: [],
          },
          {
            id: 'section-2',
            name: 'Cooking',
            order: 1,
            items: [
              { id: '1', step: 1, content: 'Cook for 30 minutes' , position: 0 },
            ],
          },
        ],
      };

      const result = validateRecipeWithSections(recipeWithEmptyInstructionSection);

      expect(result.isValid).toBe(true);
      expect(result.warnings.emptySections).toHaveLength(1);
      expect(result.warnings.emptySections[0]).toEqual({
        sectionId: 'section-1',
        sectionName: 'Preparation',
        type: 'instruction',
      });
    });

    it('detects multiple empty sections', () => {
      const recipeWithMultipleEmptySections = {
        ...baseRecipe,
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Dry Ingredients',
            order: 0,
            items: [],
          },
          {
            id: 'section-2',
            name: 'Wet Ingredients',
            order: 1,
            items: [],
          },
        ],
        instructionSections: [
          {
            id: 'section-3',
            name: 'Preparation',
            order: 0,
            items: [],
          },
        ],
      };

      const result = validateRecipeWithSections(recipeWithMultipleEmptySections);

      expect(result.isValid).toBe(true);
      expect(result.warnings.emptySections).toHaveLength(3);
      
      const emptySectionIds = result.warnings.emptySections.map(s => s.sectionId);
      expect(emptySectionIds).toContain('section-1');
      expect(emptySectionIds).toContain('section-2');
      expect(emptySectionIds).toContain('section-3');
    });

    it('returns validation errors for invalid recipe data', () => {
      const invalidRecipe = {
        title: '', // Invalid: empty title
        ingredients: [], // Invalid: no ingredients
        instructions: [], // Invalid: no instructions
      };

      const result = validateRecipeWithSections(invalidRecipe);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.emptySections).toHaveLength(0);
    });

    it('handles recipe with both validation errors and empty sections', () => {
      const invalidRecipeWithEmptySections = {
        title: '', // Invalid: empty title
        ingredients: [
          { id: '1', name: 'Flour', amount: 2, unit: 'cups' , position: 0 },
        ],
        instructions: [
          { id: '1', step: 1, content: 'Mix ingredients' , position: 0 },
        ],
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Empty Section',
            order: 0,
            items: [],
          },
        ],
        tags: [],
        visibility: 'private' as const,
      };

      const result = validateRecipeWithSections(invalidRecipeWithEmptySections);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Empty sections should not be checked if validation fails
      expect(result.warnings.emptySections).toHaveLength(0);
    });
  });

  describe('validateSectionName', () => {
    it('returns trimmed name for valid input', () => {
      expect(validateSectionName('  Dry Ingredients  ')).toBe('Dry Ingredients');
      expect(validateSectionName('Wet Ingredients')).toBe('Wet Ingredients');
    });

    it('returns fallback for empty or whitespace-only input', () => {
      expect(validateSectionName('')).toBe('Untitled Section');
      expect(validateSectionName('   ')).toBe('Untitled Section');
      expect(validateSectionName('\t\n')).toBe('Untitled Section');
    });
  });

  describe('validateSectionOrder', () => {
    it('validates sections with unique, non-negative orders', () => {
      const sections = [
        { id: '1', order: 0 },
        { id: '2', order: 1 },
        { id: '3', order: 2 },
      ];

      expect(validateSectionOrder(sections)).toBe(true);
    });

    it('rejects sections with duplicate orders', () => {
      const sections = [
        { id: '1', order: 0 },
        { id: '2', order: 1 },
        { id: '3', order: 1 }, // Duplicate order
      ];

      expect(validateSectionOrder(sections)).toBe(false);
    });

    it('rejects sections with negative orders', () => {
      const sections = [
        { id: '1', order: -1 }, // Negative order
        { id: '2', order: 0 },
        { id: '3', order: 1 },
      ];

      expect(validateSectionOrder(sections)).toBe(false);
    });

    it('validates empty sections array', () => {
      expect(validateSectionOrder([])).toBe(true);
    });

    it('validates single section', () => {
      const sections = [{ id: '1', order: 0 }];
      expect(validateSectionOrder(sections)).toBe(true);
    });
  });
});