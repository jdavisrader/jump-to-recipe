/**
 * Recipe Transformation Example
 * 
 * Demonstrates how to use the recipe transformation module programmatically.
 */

import { transformRecipes } from './recipe-transformer';
import { generateAndSaveReports } from './transformation-report-generator';
import type {
  LegacyRecipe,
  LegacyIngredient,
  LegacyInstruction,
  LegacyTag,
  LegacyRecipeTag,
} from '../types/extraction';
import type { UserMapping } from '../types/transformation';

/**
 * Example: Transform recipes with sample data
 */
async function exampleTransformRecipes() {
  // Sample legacy data
  const legacyRecipes: LegacyRecipe[] = [
    {
      id: 1,
      name: 'Chocolate Chip Cookies',
      user_id: 1,
      description: 'Classic homemade chocolate chip cookies',
      servings: 24,
      prep_time: 15,
      prep_time_descriptor: 'minutes',
      cook_time: 0.25,
      cook_time_descriptor: 'hours',
      original_url: 'https://example.com/cookies',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
  ];

  const ingredients: LegacyIngredient[] = [
    {
      id: 1,
      recipe_id: 1,
      order_number: 1,
      ingredient: '2 cups all-purpose flour',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 2,
      recipe_id: 1,
      order_number: 2,
      ingredient: '1 tsp baking soda',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 3,
      recipe_id: 1,
      order_number: 3,
      ingredient: '1 cup butter, softened',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 4,
      recipe_id: 1,
      order_number: 4,
      ingredient: '2 cups chocolate chips',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
  ];

  const instructions: LegacyInstruction[] = [
    {
      id: 1,
      recipe_id: 1,
      step_number: 1,
      step: '<p>Preheat oven to 375&deg;F (190&deg;C).</p>',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 2,
      recipe_id: 1,
      step_number: 2,
      step: '<p>Mix flour and baking soda in a bowl.</p>',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 3,
      recipe_id: 1,
      step_number: 3,
      step: '<p>Cream butter and sugars until fluffy.<br/>Add eggs and vanilla.</p>',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 4,
      recipe_id: 1,
      step_number: 4,
      step: '<p>Stir in chocolate chips. Drop by spoonfuls onto baking sheet.</p>',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 5,
      recipe_id: 1,
      step_number: 5,
      step: '<p>Bake for 10-12 minutes until golden brown. Cool on wire rack.</p>',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
  ];

  const tags: LegacyTag[] = [
    {
      id: 1,
      name: 'dessert',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 2,
      name: 'cookies',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 3,
      name: 'chocolate',
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
  ];

  const recipeTags: LegacyRecipeTag[] = [
    {
      id: 1,
      recipe_id: 1,
      tag_id: 1,
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 2,
      recipe_id: 1,
      tag_id: 2,
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
    {
      id: 3,
      recipe_id: 1,
      tag_id: 3,
      created_at: '2020-01-15T10:30:00Z',
      updated_at: '2020-01-15T10:30:00Z',
    },
  ];

  const userMapping: UserMapping[] = [
    {
      legacyId: 1,
      newUuid: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      migrated: true,
      migratedAt: '2026-01-23T14:30:00Z',
    },
  ];

  // Transform recipes
  console.log('Transforming recipes...\n');
  const result = await transformRecipes(
    legacyRecipes,
    ingredients,
    instructions,
    tags,
    recipeTags,
    userMapping
  );

  // Display results
  console.log('\n=== Transformation Results ===\n');
  console.log(`Total recipes: ${result.stats.total}`);
  console.log(`Successful: ${result.stats.successful}`);
  console.log(`Failed: ${result.stats.failed}`);
  console.log(`Ingredients parsed: ${result.stats.ingredientsParsed}`);
  console.log(`Ingredients unparsed: ${result.stats.ingredientsUnparsed}`);
  console.log(`Instructions cleaned: ${result.stats.instructionsCleaned}`);
  console.log(`Empty instructions: ${result.stats.instructionsEmpty}`);

  // Display transformed recipe
  if (result.recipes.length > 0) {
    const recipe = result.recipes[0];
    console.log('\n=== Sample Transformed Recipe ===\n');
    console.log(`ID: ${recipe.id}`);
    console.log(`Title: ${recipe.title}`);
    console.log(`Author ID: ${recipe.authorId}`);
    console.log(`Prep Time: ${recipe.prepTime} minutes`);
    console.log(`Cook Time: ${recipe.cookTime} minutes`);
    console.log(`Servings: ${recipe.servings}`);
    console.log(`Tags: ${recipe.tags.join(', ')}`);
    console.log(`\nIngredients (${recipe.ingredients.length}):`);
    recipe.ingredients.forEach((ing, i) => {
      console.log(`  ${i + 1}. ${ing.displayAmount || ing.amount} ${ing.unit} ${ing.name}`);
      if (ing.notes) console.log(`     Notes: ${ing.notes}`);
    });
    console.log(`\nInstructions (${recipe.instructions.length}):`);
    recipe.instructions.forEach((inst) => {
      console.log(`  ${inst.step}. ${inst.content}`);
    });
  }

  // Generate reports (optional - would save to files)
  // await generateAndSaveReports(result, 'migration-data/transformed/example');

  return result;
}

// Run example if executed directly
if (require.main === module) {
  exampleTransformRecipes()
    .then(() => {
      console.log('\n✓ Example completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Example failed:', error);
      process.exit(1);
    });
}

export { exampleTransformRecipes };
