import { generateGroceryList } from '../grocery-list-generator';
import type { Recipe } from '@/types/recipe';

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recipe-1',
    title: 'Test Recipe',
    description: null,
    ingredients: [],
    instructions: [],
    prepTime: null,
    cookTime: null,
    servings: 2,
    difficulty: null,
    tags: [],
    notes: null,
    imageUrl: null,
    sourceUrl: null,
    authorId: null,
    visibility: 'private',
    commentsEnabled: true,
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('generateGroceryList scaling', () => {
  it('scales a unicode-fraction displayAmount from the decimal amount, not by re-parsing the fraction text', () => {
    const recipe = makeRecipe({
      servings: 2,
      ingredients: [
        { id: 'i1', name: 'flour', amount: 0.5, unit: 'cup', displayAmount: '½', position: 0 },
      ],
    });

    const groceryList = generateGroceryList([recipe], { 'recipe-1': 4 });
    const item = groceryList.find((i) => i.name === 'flour');

    expect(item?.amount).toBeCloseTo(1);
    expect(item?.displayAmount).toBe('1');
  });

  it('scales a mixed unicode-fraction displayAmount correctly instead of truncating it', () => {
    const recipe = makeRecipe({
      servings: 2,
      ingredients: [
        { id: 'i1', name: 'sugar', amount: 1.5, unit: 'cup', displayAmount: '1½', position: 0 },
      ],
    });

    const groceryList = generateGroceryList([recipe], { 'recipe-1': 4 });
    const item = groceryList.find((i) => i.name === 'sugar');

    expect(item?.amount).toBeCloseTo(3);
    expect(item?.displayAmount).toBe('3');
  });
});
