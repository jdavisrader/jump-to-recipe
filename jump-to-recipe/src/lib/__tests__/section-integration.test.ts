import { SectionDataTransformer } from '../section-utils';
import { Recipe } from '@/types/recipe';
import { RecipeWithSections } from '@/types/sections';

describe('Section Integration Tests', () => {
  it('should integrate with existing Recipe type', () => {
    // Create a mock recipe using the existing Recipe interface
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
      notes: 'Delicious cake',
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

    // Test migration to sections
    const migratedRecipe = SectionDataTransformer.migrateRecipeToSections(mockRecipe);

    // Verify the migration maintains all original data
    expect(migratedRecipe.ingredients).toHaveLength(2);
    expect(migratedRecipe.instructions).toHaveLength(2);
    expect(migratedRecipe.ingredients[0].name).toBe('Flour');
    expect(migratedRecipe.instructions[0].content).toBe('Mix ingredients');
    
    // Verify no sections are created initially
    expect(migratedRecipe.ingredientSections).toBeUndefined();
    expect(migratedRecipe.instructionSections).toBeUndefined();
    
    // Verify sectionId is undefined for all items
    expect(migratedRecipe.ingredients[0].sectionId).toBeUndefined();
    expect(migratedRecipe.instructions[0].sectionId).toBeUndefined();
  });

  it('should work with RecipeWithSections type', () => {
    const recipeWithSections: RecipeWithSections = {
      ingredients: [
        {
          id: '1',
          name: 'Flour',
          amount: 2,
          unit: 'cup',
          sectionId: 'section-1'
        }
      ],
      instructions: [
        {
          id: '1',
          step: 1,
          content: 'Mix ingredients',
          sectionId: 'section-1'
        }
      ],
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
              unit: 'cup'
            , position: 0 }
          ]
        }
      ],
      instructionSections: [
        {
          id: 'section-1',
          name: 'Preparation',
          order: 0,
          items: [
            {
              id: '1',
              step: 1,
              content: 'Mix ingredients'
            , position: 0 }
          ]
        }
      ]
    };

    // Test that hasSections works correctly
    expect(SectionDataTransformer.hasSections(recipeWithSections)).toBe(true);

    // Test conversion back to flat arrays
    const flatIngredients = SectionDataTransformer.sectionsToFlatIngredients(
      recipeWithSections.ingredientSections!
    );
    const flatInstructions = SectionDataTransformer.sectionsToFlatInstructions(
      recipeWithSections.instructionSections!
    );

    expect(flatIngredients).toHaveLength(1);
    expect(flatInstructions).toHaveLength(1);
    expect(flatIngredients[0].name).toBe('Flour');
    expect(flatInstructions[0].content).toBe('Mix ingredients');
  });

  it('should handle empty recipe gracefully', () => {
    const emptyRecipe: Recipe = {
      id: '1',
      title: 'Empty Recipe',
      description: null,
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
      authorId: null,
      visibility: 'private',
      commentsEnabled: false,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const migratedRecipe = SectionDataTransformer.migrateRecipeToSections(emptyRecipe);

    expect(migratedRecipe.ingredients).toHaveLength(0);
    expect(migratedRecipe.instructions).toHaveLength(0);
    expect(SectionDataTransformer.hasSections(migratedRecipe)).toBe(false);
  });
});