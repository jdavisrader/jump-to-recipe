import { 
  RecipeMigrationUtils, 
  RecipeCompatibilityLayer, 
  RecipeConversionUtils 
} from '../recipe-migration';
import { Recipe, Ingredient, Instruction } from '@/types/recipe';
import { RecipeWithSections, IngredientSection, InstructionSection } from '@/types/sections';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123')
}));

describe('RecipeMigrationUtils', () => {
  const mockRecipe: Recipe = {
    id: '1',
    title: 'Test Recipe',
    description: 'A test recipe',
    ingredients: [
      {
        id: '1',
        name: 'Flour',
        amount: 2,
        unit: 'cup'
      , position: 0 },
      {
        id: '2',
        name: 'Sugar',
        amount: 1,
        unit: 'cup'
      , position: 0 }
    ],
    instructions: [
      {
        id: '1',
        step: 1,
        content: 'Mix ingredients'
      , position: 0 },
      {
        id: '2',
        step: 2,
        content: 'Bake for 30 minutes'
      , position: 0 }
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'easy',
    tags: ['dessert'],
    notes: 'Test notes',
    imageUrl: null,
    sourceUrl: null,
    authorId: 'user-1',
    visibility: 'public',
    commentsEnabled: true,
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  };

  describe('convertFlatRecipeToSections', () => {
    it('should convert flat recipe to sectioned format', () => {
      const result = RecipeMigrationUtils.convertFlatRecipeToSections(mockRecipe);

      expect(result.ingredients).toHaveLength(2);
      expect(result.instructions).toHaveLength(2);
      expect(result.ingredientSections).toHaveLength(1);
      expect(result.instructionSections).toHaveLength(1);
      
      expect(result.ingredientSections![0].name).toBe('Ingredients');
      expect(result.ingredientSections![0].items).toHaveLength(2);
      expect(result.instructionSections![0].name).toBe('Instructions');
      expect(result.instructionSections![0].items).toHaveLength(2);
    });

    it('should handle recipe with empty ingredients', () => {
      const emptyIngredientsRecipe = {
        ...mockRecipe,
        ingredients: []
      };

      const result = RecipeMigrationUtils.convertFlatRecipeToSections(emptyIngredientsRecipe);

      expect(result.ingredients).toHaveLength(0);
      expect(result.ingredientSections).toBeUndefined();
      expect(result.instructionSections).toHaveLength(1);
    });

    it('should handle recipe with empty instructions', () => {
      const emptyInstructionsRecipe = {
        ...mockRecipe,
        instructions: []
      };

      const result = RecipeMigrationUtils.convertFlatRecipeToSections(emptyInstructionsRecipe);

      expect(result.instructions).toHaveLength(0);
      expect(result.instructionSections).toBeUndefined();
      expect(result.ingredientSections).toHaveLength(1);
    });

    it('should handle completely empty recipe', () => {
      const emptyRecipe = {
        ...mockRecipe,
        ingredients: [],
        instructions: []
      };

      const result = RecipeMigrationUtils.convertFlatRecipeToSections(emptyRecipe);

      expect(result.ingredients).toHaveLength(0);
      expect(result.instructions).toHaveLength(0);
      expect(result.ingredientSections).toBeUndefined();
      expect(result.instructionSections).toBeUndefined();
    });
  });

  describe('convertSectionedRecipeToFlat', () => {
    it('should convert sectioned recipe back to flat format', () => {
      const sectionedRecipe: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        ingredientSections: [{
          id: 'section-1',
          name: 'Ingredients',
          order: 0,
          items: [
            {
              id: '1',
              name: 'Flour',
              amount: 2,
              unit: 'cup'
            , position: 0 }
          ]
        }],
        instructionSections: [{
          id: 'section-2',
          name: 'Instructions',
          order: 0,
          items: [
            {
              id: '1',
              step: 1,
              content: 'Mix ingredients'
            , position: 0 }
          ]
        }]
      };

      const result = RecipeMigrationUtils.convertSectionedRecipeToFlat(sectionedRecipe);

      expect(result.ingredients).toHaveLength(1);
      expect(result.instructions).toHaveLength(1);
      expect(result.ingredients[0].name).toBe('Flour');
      expect(result.instructions[0].content).toBe('Mix ingredients');
      expect(result.ingredientSections).toBeUndefined();
      expect(result.instructionSections).toBeUndefined();
    });

    it('should handle recipe without sections', () => {
      const recipeWithoutSections: RecipeWithSections = {
        ingredients: [{
          id: '1',
          name: 'Flour',
          amount: 2,
          unit: 'cup'
        , position: 0 }],
        instructions: [{
          id: '1',
          step: 1,
          content: 'Mix ingredients'
        , position: 0 }]
      };

      const result = RecipeMigrationUtils.convertSectionedRecipeToFlat(recipeWithoutSections);

      expect(result.ingredients).toHaveLength(1);
      expect(result.instructions).toHaveLength(1);
      expect(result.ingredients[0].name).toBe('Flour');
    });
  });

  describe('needsMigration', () => {
    it('should return true for flat recipe with ingredients', () => {
      expect(RecipeMigrationUtils.needsMigration(mockRecipe)).toBe(true);
    });

    it('should return false for recipe with sections', () => {
      const sectionedRecipe: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        ingredientSections: [{
          id: 'section-1',
          name: 'Test',
          order: 0,
          items: []
        }]
      };

      expect(RecipeMigrationUtils.needsMigration(sectionedRecipe as any)).toBe(false);
    });

    it('should return false for empty recipe', () => {
      const emptyRecipe = {
        ...mockRecipe,
        ingredients: [],
        instructions: []
      };

      expect(RecipeMigrationUtils.needsMigration(emptyRecipe)).toBe(false);
    });
  });

  describe('safeMigrateRecipe', () => {
    it('should safely migrate valid recipe', () => {
      const result = RecipeMigrationUtils.safeMigrateRecipe(mockRecipe);

      expect(result.ingredients).toHaveLength(2);
      expect(result.instructions).toHaveLength(2);
      expect(result.ingredientSections).toHaveLength(1);
      expect(result.instructionSections).toHaveLength(1);
    });

    it('should handle recipe with null ingredients/instructions', () => {
      const recipeWithNulls = {
        ...mockRecipe,
        ingredients: null as any,
        instructions: null as any
      };

      const result = RecipeMigrationUtils.safeMigrateRecipe(recipeWithNulls);

      expect(result.ingredients).toHaveLength(0);
      expect(result.instructions).toHaveLength(0);
      expect(result.ingredientSections).toBeUndefined();
      expect(result.instructionSections).toBeUndefined();
    });

    it('should return fallback structure on error', () => {
      // Mock console.error to avoid test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create an invalid recipe that will cause an error
      const invalidRecipe = {
        ...mockRecipe,
        ingredients: 'invalid' as any
      };

      const result = RecipeMigrationUtils.safeMigrateRecipe(invalidRecipe);

      expect(result.ingredients).toHaveLength(0);
      expect(result.instructions).toHaveLength(0);
      expect(result.ingredientSections).toBeUndefined();
      expect(result.instructionSections).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe('batchMigrateRecipes', () => {
    it('should migrate multiple recipes', () => {
      const recipes = [mockRecipe, { ...mockRecipe, id: '2' }];
      const results = RecipeMigrationUtils.batchMigrateRecipes(recipes);

      expect(results).toHaveLength(2);
      expect(results[0].ingredientSections).toHaveLength(1);
      expect(results[1].ingredientSections).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const results = RecipeMigrationUtils.batchMigrateRecipes([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('createMigrationPreview', () => {
    it('should create accurate migration preview', () => {
      const preview = RecipeMigrationUtils.createMigrationPreview(mockRecipe);

      expect(preview.original.ingredientCount).toBe(2);
      expect(preview.original.instructionCount).toBe(2);
      expect(preview.original.hasSections).toBe(false);
      expect(preview.migrated.ingredientSectionCount).toBe(1);
      expect(preview.migrated.instructionSectionCount).toBe(1);
      expect(preview.migrated.totalIngredients).toBe(2);
      expect(preview.migrated.totalInstructions).toBe(2);
    });

    it('should handle empty recipe', () => {
      const emptyRecipe = {
        ...mockRecipe,
        ingredients: [],
        instructions: []
      };

      const preview = RecipeMigrationUtils.createMigrationPreview(emptyRecipe);

      expect(preview.original.ingredientCount).toBe(0);
      expect(preview.original.instructionCount).toBe(0);
      expect(preview.migrated.ingredientSectionCount).toBe(0);
      expect(preview.migrated.instructionSectionCount).toBe(0);
    });
  });

  describe('validateMigration', () => {
    it('should validate successful migration', () => {
      const migrated = RecipeMigrationUtils.convertFlatRecipeToSections(mockRecipe);
      const validation = RecipeMigrationUtils.validateMigration(mockRecipe, migrated);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should detect ingredient count mismatch', () => {
      const migrated: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        ingredientSections: [{
          id: 'section-1',
          name: 'Test',
          order: 0,
          items: [] // Empty, but original had 2 ingredients
        }],
        instructionSections: [{
          id: 'section-2',
          name: 'Test',
          order: 0,
          items: mockRecipe.instructions
        }]
      };

      const validation = RecipeMigrationUtils.validateMigration(mockRecipe, migrated);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('Ingredient count mismatch');
    });

    it('should detect instruction count mismatch', () => {
      const migrated: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        ingredientSections: [{
          id: 'section-1',
          name: 'Test',
          order: 0,
          items: mockRecipe.ingredients
        }],
        instructionSections: [{
          id: 'section-2',
          name: 'Test',
          order: 0,
          items: [] // Empty, but original had 2 instructions
        }]
      };

      const validation = RecipeMigrationUtils.validateMigration(mockRecipe, migrated);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain('Instruction count mismatch');
    });

    it('should warn about empty sections', () => {
      const migrated: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        ingredientSections: [
          {
            id: 'section-1',
            name: 'Test',
            order: 0,
            items: mockRecipe.ingredients
          },
          {
            id: 'section-2',
            name: 'Empty',
            order: 1,
            items: [] // Empty section
          }
        ],
        instructionSections: [{
          id: 'section-3',
          name: 'Test',
          order: 0,
          items: mockRecipe.instructions
        }]
      };

      const validation = RecipeMigrationUtils.validateMigration(mockRecipe, migrated);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings[0]).toContain('1 empty ingredient section(s)');
    });
  });

  describe('createRollbackPlan', () => {
    it('should create rollback plan for migrated recipe', () => {
      const migrated = RecipeMigrationUtils.convertFlatRecipeToSections(mockRecipe);
      const rollback = RecipeMigrationUtils.createRollbackPlan(migrated);

      expect(rollback).toBeDefined();
      expect(rollback!.ingredients).toHaveLength(2);
      expect(rollback!.instructions).toHaveLength(2);
      expect(rollback!.ingredientSections).toBeUndefined();
      expect(rollback!.instructionSections).toBeUndefined();
    });

    it('should return null on error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Create invalid migrated recipe
      const invalidMigrated = {
        ingredients: 'invalid' as any,
        instructions: []
      };

      const rollback = RecipeMigrationUtils.createRollbackPlan(invalidMigrated);

      expect(rollback).toBeNull();
      consoleSpy.mockRestore();
    });
  });
});

describe('RecipeCompatibilityLayer', () => {
  const mockRecipe: Recipe = {
    id: '1',
    title: 'Test Recipe',
    description: 'A test recipe',
    ingredients: [
      {
        id: '1',
        name: 'Flour',
        amount: 2,
        unit: 'cup'
      , position: 0 }
    ],
    instructions: [
      {
        id: '1',
        step: 1,
        content: 'Mix ingredients'
      , position: 0 }
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'easy',
    tags: [],
    notes: null,
    imageUrl: null,
    sourceUrl: null,
    authorId: 'user-1',
    visibility: 'public',
    commentsEnabled: true,
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('normalizeRecipe', () => {
    it('should normalize flat recipe to sectioned format', () => {
      const result = RecipeCompatibilityLayer.normalizeRecipe(mockRecipe);

      expect(result.ingredients).toHaveLength(1);
      expect(result.instructions).toHaveLength(1);
      expect(result.ingredientSections).toHaveLength(1);
      expect(result.instructionSections).toHaveLength(1);
    });

    it('should return sectioned recipe as-is', () => {
      const sectionedRecipe: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        ingredientSections: [{
          id: 'section-1',
          name: 'Test',
          order: 0,
          items: []
        }]
      };

      const result = RecipeCompatibilityLayer.normalizeRecipe(sectionedRecipe);

      expect(result).toBe(sectionedRecipe);
    });
  });

  describe('isRecipeWithSections', () => {
    it('should identify sectioned recipe', () => {
      const sectionedRecipe: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        ingredientSections: []
      };

      expect(RecipeCompatibilityLayer.isRecipeWithSections(sectionedRecipe)).toBe(true);
    });

    it('should identify flat recipe', () => {
      expect(RecipeCompatibilityLayer.isRecipeWithSections(mockRecipe)).toBe(false);
    });

    it('should handle invalid input', () => {
      expect(RecipeCompatibilityLayer.isRecipeWithSections(null)).toBe(false);
      expect(RecipeCompatibilityLayer.isRecipeWithSections({})).toBe(false);
    });
  });

  describe('getIngredients', () => {
    it('should get ingredients from flat recipe', () => {
      const ingredients = RecipeCompatibilityLayer.getIngredients(mockRecipe);

      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].name).toBe('Flour');
      expect(ingredients[0]).not.toHaveProperty('sectionId');
    });

    it('should get ingredients from sectioned recipe', () => {
      const sectionedRecipe: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        ingredientSections: [{
          id: 'section-1',
          name: 'Test',
          order: 0,
          items: [{
            id: '1',
            name: 'Sugar',
            amount: 1,
            unit: 'cup'
          , position: 0 }]
        }]
      };

      const ingredients = RecipeCompatibilityLayer.getIngredients(sectionedRecipe);

      expect(ingredients).toHaveLength(1);
      expect(ingredients[0].name).toBe('Sugar');
    });
  });

  describe('getInstructions', () => {
    it('should get instructions from flat recipe', () => {
      const instructions = RecipeCompatibilityLayer.getInstructions(mockRecipe);

      expect(instructions).toHaveLength(1);
      expect(instructions[0].content).toBe('Mix ingredients');
      expect(instructions[0]).not.toHaveProperty('sectionId');
    });

    it('should get instructions from sectioned recipe', () => {
      const sectionedRecipe: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        instructionSections: [{
          id: 'section-1',
          name: 'Test',
          order: 0,
          items: [{
            id: '1',
            step: 1,
            content: 'Bake'
          , position: 0 }]
        }]
      };

      const instructions = RecipeCompatibilityLayer.getInstructions(sectionedRecipe);

      expect(instructions).toHaveLength(1);
      expect(instructions[0].content).toBe('Bake');
    });
  });

  describe('getIngredientSections', () => {
    it('should get existing ingredient sections', () => {
      const sectionedRecipe: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        ingredientSections: [{
          id: 'section-1',
          name: 'Test Section',
          order: 0,
          items: []
        }]
      };

      const sections = RecipeCompatibilityLayer.getIngredientSections(sectionedRecipe);

      expect(sections).toHaveLength(1);
      expect(sections[0].name).toBe('Test Section');
    });

    it('should create default section from flat ingredients', () => {
      const sections = RecipeCompatibilityLayer.getIngredientSections(mockRecipe);

      expect(sections).toHaveLength(1);
      expect(sections[0].name).toBe('Ingredients');
      expect(sections[0].items).toHaveLength(1);
    });

    it('should return empty array for recipe without ingredients', () => {
      const emptyRecipe = {
        ...mockRecipe,
        ingredients: []
      };

      const sections = RecipeCompatibilityLayer.getIngredientSections(emptyRecipe);

      expect(sections).toHaveLength(0);
    });
  });

  describe('getInstructionSections', () => {
    it('should get existing instruction sections', () => {
      const sectionedRecipe: RecipeWithSections = {
        ingredients: [],
        instructions: [],
        instructionSections: [{
          id: 'section-1',
          name: 'Test Section',
          order: 0,
          items: []
        }]
      };

      const sections = RecipeCompatibilityLayer.getInstructionSections(sectionedRecipe);

      expect(sections).toHaveLength(1);
      expect(sections[0].name).toBe('Test Section');
    });

    it('should create default section from flat instructions', () => {
      const sections = RecipeCompatibilityLayer.getInstructionSections(mockRecipe);

      expect(sections).toHaveLength(1);
      expect(sections[0].name).toBe('Instructions');
      expect(sections[0].items).toHaveLength(1);
    });

    it('should return empty array for recipe without instructions', () => {
      const emptyRecipe = {
        ...mockRecipe,
        instructions: []
      };

      const sections = RecipeCompatibilityLayer.getInstructionSections(emptyRecipe);

      expect(sections).toHaveLength(0);
    });
  });
});

describe('RecipeConversionUtils', () => {
  const mockRecipe: Recipe = {
    id: '1',
    title: 'Test Recipe',
    description: 'A test recipe',
    ingredients: Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Ingredient ${i + 1}`,
      amount: 1,
      unit: 'cup' as const
    })),
    instructions: Array.from({ length: 8 }, (_, i) => ({
      id: `${i + 1}`,
      step: i + 1,
      content: `Step ${i + 1}`
    })),
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'easy',
    tags: [],
    notes: null,
    imageUrl: null,
    sourceUrl: null,
    authorId: 'user-1',
    visibility: 'public',
    commentsEnabled: true,
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('convertToSections', () => {
    it('should convert recipe to sections', () => {
      const result = RecipeConversionUtils.convertToSections(mockRecipe);

      expect(result.ingredientSections).toHaveLength(1);
      expect(result.instructionSections).toHaveLength(1);
    });
  });

  describe('convertToFlat', () => {
    it('should convert sectioned recipe to flat', () => {
      const sectioned = RecipeConversionUtils.convertToSections(mockRecipe);
      const flat = RecipeConversionUtils.convertToFlat(sectioned);

      expect(flat.ingredients).toHaveLength(10);
      expect(flat.instructions).toHaveLength(8);
      expect(flat.ingredientSections).toBeUndefined();
      expect(flat.instructionSections).toBeUndefined();
    });
  });

  describe('isConversionRecommended', () => {
    it('should recommend conversion for recipes with many ingredients', () => {
      expect(RecipeConversionUtils.isConversionRecommended(mockRecipe)).toBe(true);
    });

    it('should not recommend conversion for simple recipes', () => {
      const simpleRecipe = {
        ...mockRecipe,
        ingredients: mockRecipe.ingredients.slice(0, 3),
        instructions: mockRecipe.instructions.slice(0, 3)
      };

      expect(RecipeConversionUtils.isConversionRecommended(simpleRecipe)).toBe(false);
    });

    it('should recommend conversion for recipes with many instructions', () => {
      const manyInstructionsRecipe = {
        ...mockRecipe,
        ingredients: mockRecipe.ingredients.slice(0, 3),
        instructions: Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 1}`,
          step: i + 1,
          content: `Step ${i + 1}`
        }))
      };

      expect(RecipeConversionUtils.isConversionRecommended(manyInstructionsRecipe)).toBe(true);
    });
  });

  describe('getConversionBenefits', () => {
    it('should return benefits for complex recipe', () => {
      const benefits = RecipeConversionUtils.getConversionBenefits(mockRecipe);

      expect(benefits).toContain('Organize ingredients into logical groups (e.g., "Dry Ingredients", "Wet Ingredients")');
      expect(benefits).toContain('Break instructions into phases (e.g., "Preparation", "Cooking", "Assembly")');
      expect(benefits).toContain('Better organization for meal prep and cooking');
    });

    it('should return basic benefits for simple recipe', () => {
      const simpleRecipe = {
        ...mockRecipe,
        ingredients: mockRecipe.ingredients.slice(0, 3),
        instructions: mockRecipe.instructions.slice(0, 3)
      };

      const benefits = RecipeConversionUtils.getConversionBenefits(simpleRecipe);

      expect(benefits).toContain('Better organization for meal prep and cooking');
      expect(benefits).toContain('Easier to follow step-by-step process');
      expect(benefits).not.toContain('Organize ingredients into logical groups');
    });

    it('should include readability benefit for very complex recipes', () => {
      const veryComplexRecipe = {
        ...mockRecipe,
        ingredients: Array.from({ length: 20 }, (_, i) => ({
          id: `${i + 1}`,
          name: `Ingredient ${i + 1}`,
          amount: 1,
          unit: 'cup' as const
        })),
        instructions: Array.from({ length: 15 }, (_, i) => ({
          id: `${i + 1}`,
          step: i + 1,
          content: `Step ${i + 1}`
        }))
      };

      const benefits = RecipeConversionUtils.getConversionBenefits(veryComplexRecipe);

      expect(benefits).toContain('Improve readability for complex recipes');
    });
  });
});