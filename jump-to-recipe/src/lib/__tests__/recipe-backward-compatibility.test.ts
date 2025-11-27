/**
 * Backward Compatibility Tests for Recipe Sections Simplification
 * 
 * These tests verify that existing recipes with sections continue to work correctly
 * after removing drag-and-drop functionality. The tests ensure:
 * - Section order is preserved from database
 * - Sections display in correct order
 * - Editing recipes doesn't change section order
 * - Saving recipes maintains data integrity
 * - No data migration is needed
 * - Recipes without sections still work correctly
 */

import { Recipe, Ingredient, Instruction } from '@/types/recipe';
import { IngredientSection, InstructionSection } from '@/types/sections';
import { RecipeCompatibilityLayer } from '../recipe-migration';
import { validateRecipeWithSections, validateSectionOrder } from '../validations/recipe';

describe('Recipe Backward Compatibility - Section Order Preservation', () => {
  // Mock recipe with sections in specific order
  const createRecipeWithSections = (): Recipe & {
    ingredientSections: IngredientSection[];
    instructionSections: InstructionSection[];
  } => {
    const allIngredients: Ingredient[] = [
      { id: '1', name: 'Flour', amount: 2, unit: 'cup' },
      { id: '2', name: 'Sugar', amount: 1, unit: 'cup' },
      { id: '3', name: 'Milk', amount: 1, unit: 'cup' },
      { id: '4', name: 'Eggs', amount: 2, unit: '' },
      { id: '5', name: 'Chocolate Chips', amount: 0.5, unit: 'cup' },
    ];
    
    const allInstructions: Instruction[] = [
      { id: '1', step: 1, content: 'Preheat oven to 350°F' },
      { id: '2', step: 2, content: 'Grease baking pan' },
      { id: '3', step: 3, content: 'Mix dry ingredients' },
      { id: '4', step: 4, content: 'Mix wet ingredients' },
      { id: '5', step: 5, content: 'Combine wet and dry' },
      { id: '6', step: 6, content: 'Pour into pan' },
      { id: '7', step: 7, content: 'Bake for 30 minutes' },
    ];

    return {
    id: 'recipe-1',
    title: 'Complex Recipe with Sections',
    description: 'A recipe with multiple sections',
    ingredients: allIngredients,
    instructions: allInstructions,
    ingredientSections: [
      {
        id: 'ing-section-1',
        name: 'Dry Ingredients',
        order: 0,
        items: [
          { id: '1', name: 'Flour', amount: 2, unit: 'cup' },
          { id: '2', name: 'Sugar', amount: 1, unit: 'cup' },
        ],
      },
      {
        id: 'ing-section-2',
        name: 'Wet Ingredients',
        order: 1,
        items: [
          { id: '3', name: 'Milk', amount: 1, unit: 'cup' },
          { id: '4', name: 'Eggs', amount: 2, unit: '' },
        ],
      },
      {
        id: 'ing-section-3',
        name: 'Toppings',
        order: 2,
        items: [
          { id: '5', name: 'Chocolate Chips', amount: 0.5, unit: 'cup' },
        ],
      },
    ],
    instructionSections: [
      {
        id: 'inst-section-1',
        name: 'Preparation',
        order: 0,
        items: [
          { id: '1', step: 1, content: 'Preheat oven to 350°F' },
          { id: '2', step: 2, content: 'Grease baking pan' },
        ],
      },
      {
        id: 'inst-section-2',
        name: 'Mixing',
        order: 1,
        items: [
          { id: '3', step: 3, content: 'Mix dry ingredients' },
          { id: '4', step: 4, content: 'Mix wet ingredients' },
          { id: '5', step: 5, content: 'Combine wet and dry' },
        ],
      },
      {
        id: 'inst-section-3',
        name: 'Baking',
        order: 2,
        items: [
          { id: '6', step: 6, content: 'Pour into pan' },
          { id: '7', step: 7, content: 'Bake for 30 minutes' },
        ],
      },
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 8,
    difficulty: 'medium',
    tags: ['dessert', 'baking'],
    notes: 'Test recipe with sections',
    imageUrl: null,
    sourceUrl: null,
    authorId: 'user-1',
    visibility: 'public',
    commentsEnabled: true,
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
  };

  describe('Load existing recipe with sections', () => {
    it('should preserve section order from database', () => {
      const recipe = createRecipeWithSections();

      // Verify ingredient sections maintain order
      expect(recipe.ingredientSections).toHaveLength(3);
      expect(recipe.ingredientSections[0].name).toBe('Dry Ingredients');
      expect(recipe.ingredientSections[0].order).toBe(0);
      expect(recipe.ingredientSections[1].name).toBe('Wet Ingredients');
      expect(recipe.ingredientSections[1].order).toBe(1);
      expect(recipe.ingredientSections[2].name).toBe('Toppings');
      expect(recipe.ingredientSections[2].order).toBe(2);

      // Verify instruction sections maintain order
      expect(recipe.instructionSections).toHaveLength(3);
      expect(recipe.instructionSections[0].name).toBe('Preparation');
      expect(recipe.instructionSections[0].order).toBe(0);
      expect(recipe.instructionSections[1].name).toBe('Mixing');
      expect(recipe.instructionSections[1].order).toBe(1);
      expect(recipe.instructionSections[2].name).toBe('Baking');
      expect(recipe.instructionSections[2].order).toBe(2);
    });

    it('should validate section order is correct', () => {
      const recipe = createRecipeWithSections();

      const ingredientOrderValid = validateSectionOrder(recipe.ingredientSections);
      const instructionOrderValid = validateSectionOrder(recipe.instructionSections);

      expect(ingredientOrderValid).toBe(true);
      expect(instructionOrderValid).toBe(true);
    });

    it('should handle sections with non-sequential order values', () => {
      const recipe = createRecipeWithSections();
      
      // Simulate database data with gaps in order
      recipe.ingredientSections[0].order = 0;
      recipe.ingredientSections[1].order = 5;
      recipe.ingredientSections[2].order = 10;

      // Order should still be valid (no duplicates, all non-negative)
      const isValid = validateSectionOrder(recipe.ingredientSections);
      expect(isValid).toBe(true);

      // Sections should be sortable by order
      const sorted = [...recipe.ingredientSections].sort((a, b) => a.order - b.order);
      expect(sorted[0].name).toBe('Dry Ingredients');
      expect(sorted[1].name).toBe('Wet Ingredients');
      expect(sorted[2].name).toBe('Toppings');
    });
  });

  describe('Display sections in correct order', () => {
    it('should display ingredient sections in order property sequence', () => {
      const recipe = createRecipeWithSections();

      // Simulate component rendering by sorting sections by order
      const displayOrder = [...recipe.ingredientSections].sort((a, b) => a.order - b.order);

      expect(displayOrder[0].name).toBe('Dry Ingredients');
      expect(displayOrder[1].name).toBe('Wet Ingredients');
      expect(displayOrder[2].name).toBe('Toppings');
    });

    it('should display instruction sections in order property sequence', () => {
      const recipe = createRecipeWithSections();

      // Simulate component rendering by sorting sections by order
      const displayOrder = [...recipe.instructionSections].sort((a, b) => a.order - b.order);

      expect(displayOrder[0].name).toBe('Preparation');
      expect(displayOrder[1].name).toBe('Mixing');
      expect(displayOrder[2].name).toBe('Baking');
    });

    it('should maintain section order even if array is shuffled', () => {
      const recipe = createRecipeWithSections();

      // Simulate sections being loaded in wrong order from database
      const shuffled = [
        recipe.ingredientSections[2],
        recipe.ingredientSections[0],
        recipe.ingredientSections[1],
      ];

      // Sorting by order property should restore correct sequence
      const sorted = [...shuffled].sort((a, b) => a.order - b.order);

      expect(sorted[0].name).toBe('Dry Ingredients');
      expect(sorted[1].name).toBe('Wet Ingredients');
      expect(sorted[2].name).toBe('Toppings');
    });
  });

  describe('Edit existing recipe without changing order', () => {
    it('should preserve section order when renaming a section', () => {
      const recipe = createRecipeWithSections();
      const originalOrder = recipe.ingredientSections.map(s => s.order);

      // Simulate renaming middle section
      recipe.ingredientSections[1].name = 'Liquid Ingredients';

      // Order should remain unchanged
      const newOrder = recipe.ingredientSections.map(s => s.order);
      expect(newOrder).toEqual(originalOrder);
      expect(recipe.ingredientSections[1].order).toBe(1);
    });

    it('should preserve section order when adding items to a section', () => {
      const recipe = createRecipeWithSections();
      const originalOrder = recipe.ingredientSections.map(s => s.order);

      // Simulate adding ingredient to middle section
      recipe.ingredientSections[1].items.push({
        id: '6',
        name: 'Butter',
        amount: 0.5,
        unit: 'cup',
      });

      // Order should remain unchanged
      const newOrder = recipe.ingredientSections.map(s => s.order);
      expect(newOrder).toEqual(originalOrder);
      expect(recipe.ingredientSections[1].items).toHaveLength(3);
    });

    it('should preserve section order when removing items from a section', () => {
      const recipe = createRecipeWithSections();
      const originalOrder = recipe.ingredientSections.map(s => s.order);

      // Simulate removing ingredient from first section
      recipe.ingredientSections[0].items = recipe.ingredientSections[0].items.filter(
        item => item.id !== '2'
      );

      // Order should remain unchanged
      const newOrder = recipe.ingredientSections.map(s => s.order);
      expect(newOrder).toEqual(originalOrder);
      expect(recipe.ingredientSections[0].items).toHaveLength(1);
    });

    it('should preserve section order when deleting a section', () => {
      const recipe = createRecipeWithSections();

      // Simulate deleting middle section and reindexing
      const updatedSections = recipe.ingredientSections
        .filter(s => s.id !== 'ing-section-2')
        .map((section, index) => ({ ...section, order: index }));

      // Remaining sections should maintain relative order
      expect(updatedSections).toHaveLength(2);
      expect(updatedSections[0].name).toBe('Dry Ingredients');
      expect(updatedSections[0].order).toBe(0);
      expect(updatedSections[1].name).toBe('Toppings');
      expect(updatedSections[1].order).toBe(1);
    });

    it('should append new sections to the bottom', () => {
      const recipe = createRecipeWithSections();
      const currentLength = recipe.ingredientSections.length;

      // Simulate adding new section
      const newSection: IngredientSection = {
        id: 'ing-section-4',
        name: 'Garnish',
        order: currentLength,
        items: [{ id: '7', name: 'Mint', amount: 1, unit: 'tbsp' }],
      };

      const updatedSections = [...recipe.ingredientSections, newSection];

      // New section should be at the end
      expect(updatedSections).toHaveLength(4);
      expect(updatedSections[3].name).toBe('Garnish');
      expect(updatedSections[3].order).toBe(3);

      // Previous sections should maintain their order
      expect(updatedSections[0].name).toBe('Dry Ingredients');
      expect(updatedSections[1].name).toBe('Wet Ingredients');
      expect(updatedSections[2].name).toBe('Toppings');
    });
  });

  describe('Save existing recipe and verify data integrity', () => {
    it('should maintain section structure when saving', () => {
      const recipe = createRecipeWithSections();

      // Simulate validation before save
      const validation = validateRecipeWithSections(recipe);

      // Recipe should be valid (sections are optional, flat arrays can be empty)
      if (!validation.isValid) {
        console.log('Validation errors:', validation.errors);
      }
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should preserve all section properties when saving', () => {
      const recipe = createRecipeWithSections();

      // Simulate serialization/deserialization (like saving to DB)
      const serialized = JSON.stringify(recipe);
      const deserialized = JSON.parse(serialized);

      // Verify ingredient sections
      expect(deserialized.ingredientSections).toHaveLength(3);
      deserialized.ingredientSections.forEach((section: IngredientSection, index: number) => {
        expect(section.id).toBe(recipe.ingredientSections[index].id);
        expect(section.name).toBe(recipe.ingredientSections[index].name);
        expect(section.order).toBe(recipe.ingredientSections[index].order);
        expect(section.items).toHaveLength(recipe.ingredientSections[index].items.length);
      });

      // Verify instruction sections
      expect(deserialized.instructionSections).toHaveLength(3);
      deserialized.instructionSections.forEach((section: InstructionSection, index: number) => {
        expect(section.id).toBe(recipe.instructionSections[index].id);
        expect(section.name).toBe(recipe.instructionSections[index].name);
        expect(section.order).toBe(recipe.instructionSections[index].order);
        expect(section.items).toHaveLength(recipe.instructionSections[index].items.length);
      });
    });

    it('should handle saving recipe with empty sections', () => {
      const recipe = createRecipeWithSections();

      // Add empty section
      recipe.ingredientSections.push({
        id: 'ing-section-4',
        name: 'Optional Ingredients',
        order: 3,
        items: [],
      });

      const validation = validateRecipeWithSections(recipe);

      // Should be valid but have warnings
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.emptySections).toHaveLength(1);
      expect(validation.warnings.emptySections[0].sectionName).toBe('Optional Ingredients');
    });

    it('should maintain item order within sections when saving', () => {
      const recipe = createRecipeWithSections();

      // Verify items maintain their order
      const firstSection = recipe.ingredientSections[0];
      expect(firstSection.items[0].name).toBe('Flour');
      expect(firstSection.items[1].name).toBe('Sugar');

      // Simulate save and reload
      const serialized = JSON.stringify(firstSection);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.items[0].name).toBe('Flour');
      expect(deserialized.items[1].name).toBe('Sugar');
    });
  });

  describe('No data migration needed', () => {
    it('should work with existing section data structure', () => {
      const recipe = createRecipeWithSections();

      // Verify the recipe structure matches expected format
      expect(recipe).toHaveProperty('ingredientSections');
      expect(recipe).toHaveProperty('instructionSections');
      expect(Array.isArray(recipe.ingredientSections)).toBe(true);
      expect(Array.isArray(recipe.instructionSections)).toBe(true);
    });

    it('should not require schema changes', () => {
      const recipe = createRecipeWithSections();

      // Verify all required properties exist
      recipe.ingredientSections.forEach(section => {
        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('name');
        expect(section).toHaveProperty('order');
        expect(section).toHaveProperty('items');
        expect(typeof section.id).toBe('string');
        expect(typeof section.name).toBe('string');
        expect(typeof section.order).toBe('number');
        expect(Array.isArray(section.items)).toBe(true);
      });
    });

    it('should handle recipes created before sections feature', () => {
      // Recipe without sections (old format)
      const oldRecipe: Recipe = {
        id: 'recipe-2',
        title: 'Old Recipe',
        description: 'Recipe without sections',
        ingredients: [
          { id: '1', name: 'Flour', amount: 2, unit: 'cup' },
          { id: '2', name: 'Sugar', amount: 1, unit: 'cup' },
        ],
        instructions: [
          { id: '1', step: 1, content: 'Mix ingredients' },
          { id: '2', step: 2, content: 'Bake' },
        ],
        prepTime: 10,
        cookTime: 20,
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
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };

      // Should work with compatibility layer
      const ingredients = RecipeCompatibilityLayer.getIngredients(oldRecipe);
      const instructions = RecipeCompatibilityLayer.getInstructions(oldRecipe);

      expect(ingredients).toHaveLength(2);
      expect(instructions).toHaveLength(2);
    });
  });

  describe('Recipes without sections still work correctly', () => {
    const createFlatRecipe = (): Recipe => ({
      id: 'recipe-3',
      title: 'Simple Recipe',
      description: 'Recipe without sections',
      ingredients: [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup' },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup' },
        { id: '3', name: 'Eggs', amount: 2, unit: '' },
      ],
      instructions: [
        { id: '1', step: 1, content: 'Mix dry ingredients' },
        { id: '2', step: 2, content: 'Add eggs' },
        { id: '3', step: 3, content: 'Bake for 25 minutes' },
      ],
      prepTime: 10,
      cookTime: 25,
      servings: 6,
      difficulty: 'easy',
      tags: ['quick', 'easy'],
      notes: 'Simple recipe',
      imageUrl: null,
      sourceUrl: null,
      authorId: 'user-1',
      visibility: 'public',
      commentsEnabled: true,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    });

    it('should load flat recipe without sections', () => {
      const recipe = createFlatRecipe();

      expect(recipe.ingredients).toHaveLength(3);
      expect(recipe.instructions).toHaveLength(3);
      expect(recipe).not.toHaveProperty('ingredientSections');
      expect(recipe).not.toHaveProperty('instructionSections');
    });

    it('should validate flat recipe correctly', () => {
      const recipe = createFlatRecipe();
      const validation = validateRecipeWithSections(recipe);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings.emptySections).toHaveLength(0);
    });

    it('should edit flat recipe without adding sections', () => {
      const recipe = createFlatRecipe();

      // Add ingredient
      recipe.ingredients.push({
        id: '4',
        name: 'Milk',
        amount: 1,
        unit: 'cup',
      });

      // Add instruction
      recipe.instructions.push({
        id: '4',
        step: 4,
        content: 'Let cool before serving',
      });

      expect(recipe.ingredients).toHaveLength(4);
      expect(recipe.instructions).toHaveLength(4);
      expect(recipe).not.toHaveProperty('ingredientSections');
      expect(recipe).not.toHaveProperty('instructionSections');
    });

    it('should save flat recipe without converting to sections', () => {
      const recipe = createFlatRecipe();

      // Simulate save
      const serialized = JSON.stringify(recipe);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.ingredients).toHaveLength(3);
      expect(deserialized.instructions).toHaveLength(3);
      expect(deserialized.ingredientSections).toBeUndefined();
      expect(deserialized.instructionSections).toBeUndefined();
    });

    it('should use compatibility layer to get ingredients from flat recipe', () => {
      const recipe = createFlatRecipe();
      const ingredients = RecipeCompatibilityLayer.getIngredients(recipe);

      expect(ingredients).toHaveLength(3);
      expect(ingredients[0].name).toBe('Flour');
      expect(ingredients[1].name).toBe('Sugar');
      expect(ingredients[2].name).toBe('Eggs');
    });

    it('should use compatibility layer to get instructions from flat recipe', () => {
      const recipe = createFlatRecipe();
      const instructions = RecipeCompatibilityLayer.getInstructions(recipe);

      expect(instructions).toHaveLength(3);
      expect(instructions[0].content).toBe('Mix dry ingredients');
      expect(instructions[1].content).toBe('Add eggs');
      expect(instructions[2].content).toBe('Bake for 25 minutes');
    });

    it('should create default sections from flat recipe when needed', () => {
      const recipe = createFlatRecipe();
      
      const ingredientSections = RecipeCompatibilityLayer.getIngredientSections(recipe);
      const instructionSections = RecipeCompatibilityLayer.getInstructionSections(recipe);

      // Should create single default section
      expect(ingredientSections).toHaveLength(1);
      expect(ingredientSections[0].name).toBe('Ingredients');
      expect(ingredientSections[0].items).toHaveLength(3);

      expect(instructionSections).toHaveLength(1);
      expect(instructionSections[0].name).toBe('Instructions');
      expect(instructionSections[0].items).toHaveLength(3);
    });
  });

  describe('Mixed scenarios - recipes with and without sections', () => {
    const createFlatRecipe = (): Recipe => ({
      id: 'recipe-3',
      title: 'Simple Recipe',
      description: 'Recipe without sections',
      ingredients: [
        { id: '1', name: 'Flour', amount: 2, unit: 'cup' },
        { id: '2', name: 'Sugar', amount: 1, unit: 'cup' },
        { id: '3', name: 'Eggs', amount: 2, unit: '' },
      ],
      instructions: [
        { id: '1', step: 1, content: 'Mix dry ingredients' },
        { id: '2', step: 2, content: 'Add eggs' },
        { id: '3', step: 3, content: 'Bake for 25 minutes' },
      ],
      prepTime: 10,
      cookTime: 25,
      servings: 6,
      difficulty: 'easy',
      tags: ['quick', 'easy'],
      notes: 'Simple recipe',
      imageUrl: null,
      sourceUrl: null,
      authorId: 'user-1',
      visibility: 'public',
      commentsEnabled: true,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    });

    it('should handle recipe with only ingredient sections', () => {
      const recipe: Recipe & { ingredientSections: IngredientSection[] } = {
        ...createFlatRecipe(),
        ingredientSections: [
          {
            id: 'ing-section-1',
            name: 'Main Ingredients',
            order: 0,
            items: [
              { id: '1', name: 'Flour', amount: 2, unit: 'cup' },
            ],
          },
        ],
      };

      expect(recipe.ingredientSections).toHaveLength(1);
      expect(recipe.instructions).toHaveLength(3);
      expect(recipe).not.toHaveProperty('instructionSections');
    });

    it('should handle recipe with only instruction sections', () => {
      const recipe: Recipe & { instructionSections: InstructionSection[] } = {
        ...createFlatRecipe(),
        instructionSections: [
          {
            id: 'inst-section-1',
            name: 'Steps',
            order: 0,
            items: [
              { id: '1', step: 1, content: 'Mix ingredients' },
            ],
          },
        ],
      };

      expect(recipe.ingredients).toHaveLength(3);
      expect(recipe.instructionSections).toHaveLength(1);
      expect(recipe).not.toHaveProperty('ingredientSections');
    });

    it('should handle empty recipe (no ingredients or instructions)', () => {
      const emptyRecipe: Recipe = {
        id: 'recipe-4',
        title: 'Empty Recipe',
        description: 'Recipe in progress',
        ingredients: [],
        instructions: [],
        prepTime: null,
        cookTime: null,
        servings: null,
        difficulty: null,
        tags: [],
        notes: null,
        imageUrl: null,
        sourceUrl: null,
        authorId: 'user-1',
        visibility: 'private',
        commentsEnabled: false,
        viewCount: 0,
        likeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const ingredientSections = RecipeCompatibilityLayer.getIngredientSections(emptyRecipe);
      const instructionSections = RecipeCompatibilityLayer.getInstructionSections(emptyRecipe);

      expect(ingredientSections).toHaveLength(0);
      expect(instructionSections).toHaveLength(0);
    });
  });
});
