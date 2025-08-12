import {
  categorizeIngredient,
  generateGroceryList,
  generateGroceryListTitle,
} from '@/lib/grocery-list-generator';
import { Recipe } from '@/types/recipe';

describe('Grocery List Generator', () => {
  describe('categorizeIngredient', () => {
    it('should categorize common ingredients correctly', () => {
      expect(categorizeIngredient('tomato')).toBe('produce');
      expect(categorizeIngredient('chicken breast')).toBe('meat');
      expect(categorizeIngredient('salmon')).toBe('seafood');
      expect(categorizeIngredient('milk')).toBe('dairy');
      expect(categorizeIngredient('flour')).toBe('pantry');
      expect(categorizeIngredient('salt')).toBe('spices');
      expect(categorizeIngredient('ketchup')).toBe('condiments');
      expect(categorizeIngredient('frozen peas')).toBe('frozen');
      expect(categorizeIngredient('bread')).toBe('bakery');
      expect(categorizeIngredient('water')).toBe('beverages');
    });

    it('should handle case insensitive matching', () => {
      expect(categorizeIngredient('TOMATO')).toBe('produce');
      expect(categorizeIngredient('Chicken Breast')).toBe('meat');
      expect(categorizeIngredient('MILK')).toBe('dairy');
    });

    it('should handle partial matches', () => {
      expect(categorizeIngredient('cherry tomatoes')).toBe('produce');
      expect(categorizeIngredient('ground chicken')).toBe('meat');
      expect(categorizeIngredient('whole milk')).toBe('dairy');
    });

    it('should default to "other" for unknown ingredients', () => {
      expect(categorizeIngredient('mysterious ingredient')).toBe('other');
      expect(categorizeIngredient('unknown spice')).toBe('other');
    });
  });

  describe('generateGroceryList', () => {
    const mockRecipe1: Recipe = {
      id: 'recipe1',
      title: 'Pasta Salad',
      description: 'A delicious pasta salad',
      ingredients: [
        {
          id: 'ing1',
          name: 'pasta',
          amount: 2,
          unit: 'cup',
          notes: '',
          category: '',
        },
        {
          id: 'ing2',
          name: 'tomatoes',
          amount: 3,
          unit: '',
          notes: '',
          category: '',
        },
        {
          id: 'ing3',
          name: 'olive oil',
          amount: 2,
          unit: 'tbsp',
          notes: '',
          category: '',
        },
      ],
      instructions: [],
      servings: 4,
      tags: [],
      authorId: 'user1',
      visibility: 'public',
      commentsEnabled: true,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRecipe2: Recipe = {
      id: 'recipe2',
      title: 'Tomato Soup',
      description: 'A warm tomato soup',
      ingredients: [
        {
          id: 'ing4',
          name: 'tomatoes',
          amount: 5,
          unit: '',
          notes: '',
          category: '',
        },
        {
          id: 'ing5',
          name: 'onion',
          amount: 1,
          unit: '',
          notes: '',
          category: '',
        },
        {
          id: 'ing6',
          name: 'olive oil',
          amount: 1,
          unit: 'tbsp',
          notes: '',
          category: '',
        },
      ],
      instructions: [],
      servings: 2,
      tags: [],
      authorId: 'user1',
      visibility: 'public',
      commentsEnabled: true,
      viewCount: 0,
      likeCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should generate grocery list from single recipe', () => {
      const groceryList = generateGroceryList([mockRecipe1]);

      expect(groceryList).toHaveLength(3);
      expect(groceryList.find(item => item.name === 'pasta')).toBeDefined();
      expect(groceryList.find(item => item.name === 'tomatoes')).toBeDefined();
      expect(groceryList.find(item => item.name === 'olive oil')).toBeDefined();
    });

    it('should combine similar ingredients from multiple recipes', () => {
      const groceryList = generateGroceryList([mockRecipe1, mockRecipe2]);

      // Should combine tomatoes (3 + 5 = 8)
      const tomatoes = groceryList.find(item => item.name === 'tomatoes');
      expect(tomatoes).toBeDefined();
      expect(tomatoes?.amount).toBe(8);

      // Should combine olive oil (2 tbsp + 1 tbsp = 3 tbsp)
      const oliveOil = groceryList.find(item => item.name === 'olive oil');
      expect(oliveOil).toBeDefined();
      expect(oliveOil?.amount).toBe(3);
      expect(oliveOil?.unit).toBe('tbsp');

      // Should include unique ingredients
      expect(groceryList.find(item => item.name === 'pasta')).toBeDefined();
      expect(groceryList.find(item => item.name === 'onion')).toBeDefined();
    });

    it('should handle serving size adjustments', () => {
      const servingAdjustments = {
        recipe1: 8, // Double the servings (from 4 to 8)
        recipe2: 4, // Double the servings (from 2 to 4)
      };

      const groceryList = generateGroceryList([mockRecipe1, mockRecipe2], servingAdjustments);

      // Pasta should be doubled (2 * 2 = 4 cups)
      const pasta = groceryList.find(item => item.name === 'pasta');
      expect(pasta?.amount).toBe(4);

      // Tomatoes should be combined and scaled (3*2 + 5*2 = 16)
      const tomatoes = groceryList.find(item => item.name === 'tomatoes');
      expect(tomatoes?.amount).toBe(16);

      // Olive oil should be combined and scaled (2*2 + 1*2 = 6 tbsp)
      const oliveOil = groceryList.find(item => item.name === 'olive oil');
      expect(oliveOil?.amount).toBe(6);
    });

    it('should categorize ingredients correctly', () => {
      const groceryList = generateGroceryList([mockRecipe1]);

      const pasta = groceryList.find(item => item.name === 'pasta');
      expect(pasta?.category).toBe('pantry');

      const tomatoes = groceryList.find(item => item.name === 'tomatoes');
      expect(tomatoes?.category).toBe('produce');

      const oliveOil = groceryList.find(item => item.name === 'olive oil');
      expect(oliveOil?.category).toBe('condiments');
    });

    it('should sort items by category and name', () => {
      const groceryList = generateGroceryList([mockRecipe1, mockRecipe2]);

      // Check that produce items come before pantry items
      const produceIndex = groceryList.findIndex(item => item.category === 'produce');
      const pantryIndex = groceryList.findIndex(item => item.category === 'pantry');
      const condimentsIndex = groceryList.findIndex(item => item.category === 'condiments');

      expect(produceIndex).toBeLessThan(pantryIndex);
      expect(pantryIndex).toBeLessThan(condimentsIndex);
    });

    it('should track recipe IDs for combined ingredients', () => {
      const groceryList = generateGroceryList([mockRecipe1, mockRecipe2]);

      const tomatoes = groceryList.find(item => item.name === 'tomatoes');
      expect(tomatoes?.recipeIds).toContain('recipe1');
      expect(tomatoes?.recipeIds).toContain('recipe2');

      const pasta = groceryList.find(item => item.name === 'pasta');
      expect(pasta?.recipeIds).toEqual(['recipe1']);
    });

    it('should handle recipes with no servings specified', () => {
      const recipeNoServings: Recipe = {
        ...mockRecipe1,
        servings: undefined,
      };

      const groceryList = generateGroceryList([recipeNoServings]);

      expect(groceryList).toHaveLength(3);
      // Should use default serving size of 1
      expect(groceryList.find(item => item.name === 'pasta')?.amount).toBe(2);
    });

    it('should handle empty recipe list', () => {
      const groceryList = generateGroceryList([]);
      expect(groceryList).toHaveLength(0);
    });

    it('should handle recipes with no ingredients', () => {
      const emptyRecipe: Recipe = {
        ...mockRecipe1,
        ingredients: [],
      };

      const groceryList = generateGroceryList([emptyRecipe]);
      expect(groceryList).toHaveLength(0);
    });

    it('should preserve notes when combining ingredients', () => {
      const recipeWithNotes: Recipe = {
        ...mockRecipe1,
        ingredients: [
          {
            id: 'ing1',
            name: 'tomatoes',
            amount: 2,
            unit: '',
            notes: 'ripe and red',
            category: '',
          },
        ],
      };

      const recipeWithNotes2: Recipe = {
        ...mockRecipe2,
        ingredients: [
          {
            id: 'ing2',
            name: 'tomatoes',
            amount: 3,
            unit: '',
            notes: 'organic preferred',
            category: '',
          },
        ],
      };

      const groceryList = generateGroceryList([recipeWithNotes, recipeWithNotes2]);

      const tomatoes = groceryList.find(item => item.name === 'tomatoes');
      expect(tomatoes?.notes).toBe('ripe and red; organic preferred');
    });
  });

  describe('generateGroceryListTitle', () => {
    const mockRecipes: Recipe[] = [
      {
        id: 'recipe1',
        title: 'Pasta Salad',
        description: '',
        ingredients: [],
        instructions: [],
        servings: 4,
        tags: [],
        authorId: 'user1',
        visibility: 'public',
        commentsEnabled: true,
        viewCount: 0,
        likeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'recipe2',
        title: 'Tomato Soup',
        description: '',
        ingredients: [],
        instructions: [],
        servings: 2,
        tags: [],
        authorId: 'user1',
        visibility: 'public',
        commentsEnabled: true,
        viewCount: 0,
        likeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'recipe3',
        title: 'Caesar Salad',
        description: '',
        ingredients: [],
        instructions: [],
        servings: 3,
        tags: [],
        authorId: 'user1',
        visibility: 'public',
        commentsEnabled: true,
        viewCount: 0,
        likeCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should generate default title for empty recipe list', () => {
      const title = generateGroceryListTitle([]);
      expect(title).toBe('Grocery List');
    });

    it('should generate title for single recipe', () => {
      const title = generateGroceryListTitle([mockRecipes[0]]);
      expect(title).toBe('Grocery List for Pasta Salad');
    });

    it('should generate title for multiple recipes (≤3)', () => {
      const title = generateGroceryListTitle([mockRecipes[0], mockRecipes[1]]);
      expect(title).toBe('Grocery List for Pasta Salad, Tomato Soup');

      const titleThree = generateGroceryListTitle(mockRecipes);
      expect(titleThree).toBe('Grocery List for Pasta Salad, Tomato Soup, Caesar Salad');
    });

    it('should generate title for many recipes (>3)', () => {
      const manyRecipes = [
        ...mockRecipes,
        { ...mockRecipes[0], id: 'recipe4', title: 'Recipe 4' },
        { ...mockRecipes[0], id: 'recipe5', title: 'Recipe 5' },
      ];

      const title = generateGroceryListTitle(manyRecipes);
      expect(title).toBe('Grocery List for 5 Recipes');
    });
  });
});