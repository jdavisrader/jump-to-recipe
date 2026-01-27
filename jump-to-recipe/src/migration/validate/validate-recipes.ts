/**
 * Main Validation Script
 * 
 * Orchestrates the complete validation process:
 * 1. Load transformed recipes
 * 2. Validate against business rules
 * 3. Detect duplicates
 * 4. Generate comprehensive reports
 * 5. Save categorized recipes
 * 
 * Usage:
 *   ts-node src/migration/validate/validate-recipes.ts <transformed-dir> <output-dir>
 * 
 * Example:
 *   ts-node src/migration/validate/validate-recipes.ts \
 *     migration-data/transformed/2026-01-23-14-30-00 \
 *     migration-data/validated/2026-01-23-14-30-00
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { validateBatch } from './recipe-validator';
import { detectDuplicates, generateDuplicateReport } from './duplicate-detector';
import { generateValidationReport } from './validation-report-generator';
import type { TransformedRecipe } from '../transform/recipe-transformer';

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Main validation orchestrator
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         RECIPE VALIDATION - PHASE 3 OF ETVI PIPELINE      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Parse command-line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: ts-node validate-recipes.ts <transformed-dir> <output-dir>');
    console.error('');
    console.error('Example:');
    console.error('  ts-node validate-recipes.ts \\');
    console.error('    migration-data/transformed/2026-01-23-14-30-00 \\');
    console.error('    migration-data/validated/2026-01-23-14-30-00');
    process.exit(1);
  }

  const [transformedDir, outputDir] = args;

  console.log('Configuration:');
  console.log(`  Transformed Data: ${transformedDir}`);
  console.log(`  Output Directory: ${outputDir}`);
  console.log('');

  try {
    // Step 1: Load transformed recipes
    console.log('Step 1: Loading transformed recipes...');
    const recipes = await loadTransformedRecipes(transformedDir);
    console.log(`✓ Loaded ${recipes.length} recipes\n`);

    // Step 2: Validate recipes
    console.log('Step 2: Validating recipes against business rules...');
    const validationReport = await validateBatch(recipes);

    // Step 3: Detect duplicates
    console.log('Step 3: Detecting duplicate recipes...');
    const duplicateGroups = await detectDuplicates(recipes);
    const duplicateReport = generateDuplicateReport(duplicateGroups);

    // Step 4: Generate comprehensive reports
    console.log('Step 4: Generating validation reports...');
    const reportPath = await generateValidationReport(
      validationReport,
      duplicateReport,
      {
        outputDir,
        includeRecipeDetails: true,
        generateSeparateFiles: true,
      }
    );

    // Step 5: Display summary
    displaySummary(validationReport, duplicateReport, outputDir);

    console.log('\n✓ Validation complete!');
    console.log(`\nNext steps:`);
    console.log(`  1. Review validation report: ${reportPath}`);
    console.log(`  2. Review failed recipes: ${path.join(outputDir, 'recipes-fail.json')}`);
    console.log(`  3. Review duplicates: ${path.join(outputDir, 'duplicates-report.json')}`);
    console.log(`  4. Proceed to import phase with PASS recipes: ${path.join(outputDir, 'recipes-pass.json')}`);
    console.log('');

  } catch (error) {
    console.error('\n✗ Validation failed:');
    console.error(error);
    process.exit(1);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load transformed recipes from JSON file
 */
async function loadTransformedRecipes(transformedDir: string): Promise<TransformedRecipe[]> {
  const recipesPath = path.join(transformedDir, 'recipes-normalized.json');

  try {
    const content = await fs.readFile(recipesPath, 'utf-8');
    const recipes = JSON.parse(content);

    if (!Array.isArray(recipes)) {
      throw new Error('Invalid recipes file format: expected array');
    }

    return recipes;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Recipes file not found: ${recipesPath}`);
    }
    throw error;
  }
}

/**
 * Display validation summary
 */
function displaySummary(
  validationReport: any,
  duplicateReport: any,
  outputDir: string
): void {
  const { stats } = validationReport;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    VALIDATION SUMMARY                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Validation Results:');
  console.log(`  Total Recipes:     ${stats.total}`);
  console.log(`  ✓ PASS:            ${stats.passed} (${((stats.passed / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  ⚠ WARN:            ${stats.warned} (${((stats.warned / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  ✗ FAIL:            ${stats.failed} (${((stats.failed / stats.total) * 100).toFixed(1)}%)`);
  console.log(`  Critical Errors:   ${stats.criticalErrors}`);
  console.log(`  Warnings:          ${stats.warningCount}`);
  console.log('');

  console.log('Duplicate Detection:');
  console.log(`  Total Groups:      ${duplicateReport.totalDuplicates}`);
  console.log(`  High Confidence:   ${duplicateReport.highConfidenceCount}`);
  console.log(`  Medium Confidence: ${duplicateReport.mediumConfidenceCount}`);
  console.log(`  Low Confidence:    ${duplicateReport.lowConfidenceCount}`);
  console.log(`  Affected Recipes:  ${duplicateReport.affectedRecipes}`);
  console.log('');

  console.log('Output Files:');
  console.log(`  ✓ ${path.join(outputDir, 'validation-report.json')}`);
  console.log(`  ✓ ${path.join(outputDir, 'validation-summary.txt')}`);
  console.log(`  ✓ ${path.join(outputDir, 'recipes-pass.json')}`);
  console.log(`  ✓ ${path.join(outputDir, 'recipes-warn.json')}`);
  console.log(`  ✓ ${path.join(outputDir, 'recipes-fail.json')}`);
  console.log(`  ✓ ${path.join(outputDir, 'duplicates-report.json')}`);
  console.log('');
}

// ============================================================================
// Execute
// ============================================================================

/**
 * Validate recipes with specified directories (for programmatic use)
 */
export async function validateRecipesWithDirs(
  transformedDir: string,
  outputDir: string
): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         RECIPE VALIDATION - PHASE 3 OF ETVI PIPELINE      ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Configuration:');
  console.log(`  Transformed Data: ${transformedDir}`);
  console.log(`  Output Directory: ${outputDir}`);
  console.log('');

  try {
    // Step 1: Load transformed recipes
    console.log('Step 1: Loading transformed recipes...');
    const recipes = await loadTransformedRecipes(transformedDir);
    console.log(`✓ Loaded ${recipes.length} recipes\n`);

    // Step 2: Validate recipes
    console.log('Step 2: Validating recipes against business rules...');
    const validationReport = await validateBatch(recipes);

    // Step 3: Detect duplicates
    console.log('Step 3: Detecting duplicate recipes...');
    const duplicateGroups = await detectDuplicates(recipes);
    const duplicateReport = generateDuplicateReport(duplicateGroups);

    // Step 4: Generate comprehensive reports
    console.log('Step 4: Generating validation reports...');
    const reportPath = await generateValidationReport(
      validationReport,
      duplicateReport,
      {
        outputDir,
        includeRecipeDetails: true,
        generateSeparateFiles: true,
      }
    );

    // Step 5: Display summary
    displaySummary(validationReport, duplicateReport, outputDir);

    console.log('\n✓ Validation complete!');
    console.log(`\nNext steps:`);
    console.log(`  1. Review validation report: ${reportPath}`);
    console.log(`  2. Review failed recipes: ${path.join(outputDir, 'recipes-fail.json')}`);
    console.log(`  3. Review duplicates: ${path.join(outputDir, 'duplicates-report.json')}`);
    console.log(`  4. Proceed to import phase with PASS recipes: ${path.join(outputDir, 'recipes-pass.json')}`);
    console.log('');
  } catch (error) {
    console.error('\n✗ Validation failed:');
    console.error(error);
    throw error;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as validateRecipes };
