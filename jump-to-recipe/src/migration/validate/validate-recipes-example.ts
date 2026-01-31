/**
 * Example: Recipe Validation
 * 
 * This example demonstrates how to use the validation module to:
 * 1. Load transformed recipes
 * 2. Validate against business rules
 * 3. Detect duplicates
 * 4. Generate reports
 * 
 * Usage:
 *   ts-node src/migration/validate/validate-recipes-example.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { validateRecipe, validateBatch } from './recipe-validator';
import { detectDuplicates, generateDuplicateReport } from './duplicate-detector';
import { generateValidationReport } from './validation-report-generator';
import type { TransformedRecipe } from '../transform/recipe-transformer';

// ============================================================================
// Example 1: Validate a Single Recipe
// ============================================================================

async function example1_validateSingleRecipe() {
  console.log('\n=== Example 1: Validate Single Recipe ===\n');

  // Sample recipe (would normally come from transformation)
  const recipe: TransformedRecipe = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Chocolate Chip Cookies',
    description: 'Classic homemade chocolate chip cookies',
    ingredients: [
      {
        id: '223e4567-e89b-12d3-a456-426614174001',
        name: 'flour',
        amount: 2,
        unit: 'cup',
      },
      {
        id: '323e4567-e89b-12d3-a456-426614174002',
        name: 'chocolate chips',
        amount: 1,
        unit: 'cup',
      },
    ],
    instructions: [
      {
        id: '423e4567-e89b-12d3-a456-426614174003',
        step: 1,
        content: 'Mix flour and sugar in a bowl',
      },
      {
        id: '523e4567-e89b-12d3-a456-426614174004',
        step: 2,
        content: 'Add chocolate chips and bake at 350°F for 12 minutes',
      },
    ],
    ingredientSections: null,
    instructionSections: null,
    prepTime: 15,
    cookTime: 12,
    servings: 24,
    difficulty: null,
    tags: ['dessert', 'cookies', 'baking'],
    notes: null,
    imageUrl: null,
    sourceUrl: 'https://example.com/recipe',
    authorId: '623e4567-e89b-12d3-a456-426614174005',
    visibility: 'public',
    commentsEnabled: true,
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    legacyId: 1,
  };

  // Validate the recipe
  const result = validateRecipe(recipe);

  console.log(`Status: ${result.status}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Warnings: ${result.warnings.length}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(error => {
      console.log(`  - [${error.severity}] ${error.field}: ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    result.warnings.forEach(warning => {
      console.log(`  - ${warning.field}: ${warning.message}`);
    });
  }
}

// ============================================================================
// Example 2: Validate a Batch of Recipes
// ============================================================================

async function example2_validateBatch() {
  console.log('\n=== Example 2: Validate Batch of Recipes ===\n');

  // Create sample recipes with various validation issues
  const recipes: TransformedRecipe[] = [
    // Valid recipe
    createSampleRecipe(1, 'Chocolate Chip Cookies', true),
    
    // Recipe with warnings (missing description)
    createSampleRecipe(2, 'Oatmeal Cookies', false),
    
    // Recipe with critical error (no ingredients)
    {
      ...createSampleRecipe(3, 'Invalid Recipe', true),
      ingredients: [],
    },
  ];

  // Validate batch
  const report = await validateBatch(recipes);

  console.log('Validation Results:');
  console.log(`  Total: ${report.stats.total}`);
  console.log(`  PASS: ${report.stats.passed}`);
  console.log(`  WARN: ${report.stats.warned}`);
  console.log(`  FAIL: ${report.stats.failed}`);
}

// ============================================================================
// Example 3: Detect Duplicates
// ============================================================================

async function example3_detectDuplicates() {
  console.log('\n=== Example 3: Detect Duplicates ===\n');

  // Create recipes with potential duplicates
  const recipes: TransformedRecipe[] = [
    createSampleRecipe(1, 'Chocolate Chip Cookies', true),
    createSampleRecipe(2, 'Chocolate Chip Cookies', true), // Exact duplicate
    createSampleRecipe(3, 'Chocolate Chip Cookie', true),  // Fuzzy match
    createSampleRecipe(4, 'Oatmeal Cookies', true),
  ];

  // Detect duplicates
  const duplicateGroups = await detectDuplicates(recipes);
  const duplicateReport = generateDuplicateReport(duplicateGroups);

  console.log('Duplicate Detection Results:');
  console.log(`  Total Groups: ${duplicateReport.totalDuplicates}`);
  console.log(`  High Confidence: ${duplicateReport.highConfidenceCount}`);
  console.log(`  Medium Confidence: ${duplicateReport.mediumConfidenceCount}`);
  console.log(`  Affected Recipes: ${duplicateReport.affectedRecipes}`);

  if (duplicateGroups.length > 0) {
    console.log('\nDuplicate Groups:');
    duplicateGroups.forEach((group, index) => {
      console.log(`\n  Group ${index + 1} (${group.confidence} confidence):`);
      console.log(`    Match Reason: ${group.matchReason}`);
      console.log(`    Recipes:`);
      group.recipes.forEach(recipe => {
        console.log(`      - ${recipe.title} (ID: ${recipe.legacyId})`);
      });
    });
  }
}

// ============================================================================
// Example 4: Complete Validation Pipeline
// ============================================================================

async function example4_completeValidation() {
  console.log('\n=== Example 4: Complete Validation Pipeline ===\n');

  // Create sample recipes
  const recipes: TransformedRecipe[] = [
    createSampleRecipe(1, 'Chocolate Chip Cookies', true),
    createSampleRecipe(2, 'Oatmeal Cookies', false),
    createSampleRecipe(3, 'Peanut Butter Cookies', true),
    createSampleRecipe(4, 'Chocolate Chip Cookies', true), // Duplicate
  ];

  // Run validation
  const validationReport = await validateBatch(recipes);

  // Run duplicate detection
  const duplicateGroups = await detectDuplicates(recipes);
  const duplicateReport = generateDuplicateReport(duplicateGroups);

  // Generate reports
  const outputDir = path.join(process.cwd(), 'migration-data', 'validated', 'example');
  await generateValidationReport(validationReport, duplicateReport, {
    outputDir,
    includeRecipeDetails: true,
    generateSeparateFiles: true,
  });

  console.log(`\nReports generated in: ${outputDir}`);
  console.log('Files created:');
  console.log('  - validation-report.json');
  console.log('  - validation-summary.txt');
  console.log('  - recipes-pass.json');
  console.log('  - recipes-warn.json');
  console.log('  - recipes-fail.json');
  console.log('  - duplicates-report.json');
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a sample recipe for testing
 */
function createSampleRecipe(
  id: number,
  title: string,
  includeDescription: boolean
): TransformedRecipe {
  return {
    id: `${id}23e4567-e89b-12d3-a456-426614174000`,
    title,
    description: includeDescription ? `Description for ${title}` : null,
    ingredients: [
      {
        id: `${id}23e4567-e89b-12d3-a456-426614174001`,
        name: 'flour',
        amount: 2,
        unit: 'cup',
      },
      {
        id: `${id}23e4567-e89b-12d3-a456-426614174002`,
        name: 'sugar',
        amount: 1,
        unit: 'cup',
      },
    ],
    instructions: [
      {
        id: `${id}23e4567-e89b-12d3-a456-426614174003`,
        step: 1,
        content: 'Mix ingredients',
      },
      {
        id: `${id}23e4567-e89b-12d3-a456-426614174004`,
        step: 2,
        content: 'Bake at 350°F',
      },
    ],
    ingredientSections: null,
    instructionSections: null,
    prepTime: 15,
    cookTime: 12,
    servings: 24,
    difficulty: null,
    tags: ['dessert', 'cookies'],
    notes: null,
    imageUrl: null,
    sourceUrl: null,
    authorId: `${id}23e4567-e89b-12d3-a456-426614174005`,
    visibility: 'public',
    commentsEnabled: true,
    viewCount: 0,
    likeCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    legacyId: id,
  };
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           RECIPE VALIDATION - USAGE EXAMPLES              ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    await example1_validateSingleRecipe();
    await example2_validateBatch();
    await example3_detectDuplicates();
    await example4_completeValidation();

    console.log('\n✓ All examples completed successfully!\n');
  } catch (error) {
    console.error('\n✗ Example failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
