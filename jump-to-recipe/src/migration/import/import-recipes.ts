/**
 * Import Recipes Script
 * 
 * Main orchestrator for the import phase.
 * Coordinates batch importing, idempotency checking, progress tracking, and reporting.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BatchImporter } from './batch-importer';
import { IdempotencyChecker } from './idempotency-checker';
import { UserImporter } from './user-importer';
import { DryRunValidator } from './dry-run-validator';
import { ProgressTracker, createOrResumeTracker } from './progress-tracker';
import { ImportReportGenerator } from './import-report-generator';
import type { ImportConfig, ImportResult } from '../types/import';
import type { TransformedRecipe, TransformedUser } from '../types/transformation';

// ============================================================================
// Main Import Function
// ============================================================================

/**
 * Import recipes and users from validated data
 */
export async function importRecipes(
  config: ImportConfig,
  validatedDir: string,
  outputDir: string = 'migration-data/imported'
): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 IMPORT PHASE');
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    // Load validated data
    console.log('\n📂 Loading validated data...');
    const recipes = await loadValidatedRecipes(validatedDir);
    const users = await loadValidatedUsers(validatedDir);

    console.log(`  ✓ Loaded ${recipes.length} recipes`);
    console.log(`  ✓ Loaded ${users.length} users`);

    // Initialize components
    const idempotencyChecker = new IdempotencyChecker(outputDir);
    await idempotencyChecker.loadMappings();

    const reportGenerator = new ImportReportGenerator(outputDir);

    // Create or resume progress tracker
    const migrationId = new Date().toISOString().split('T')[0];
    const { tracker, resumed } = await createOrResumeTracker(migrationId, 'import');

    if (!resumed) {
      tracker.initialize(recipes.length + users.length);
    }

    // Dry run mode
    if (config.dryRun) {
      console.log('\n🔍 DRY RUN MODE - No data will be imported');
      await runDryRun(recipes, users, config, outputDir);
      return;
    }

    // Import users first (recipes depend on user IDs)
    console.log('\n👥 STEP 1: Import Users');
    console.log('-'.repeat(60));
    
    const userImporter = new UserImporter(config, idempotencyChecker);
    const userImportResult = await userImporter.importUsers(users);

    // Create mapping from transformed user IDs to actual database IDs
    console.log('\n🔗 Creating user ID mapping...');
    const userIdMapping = new Map<string, string>();
    for (let i = 0; i < users.length; i++) {
      const transformedUser = users[i];
      const importResult = userImportResult.results[i];
      if (importResult && importResult.success && importResult.newId) {
        userIdMapping.set(transformedUser.id, importResult.newId);
        console.log(`  Mapped ${transformedUser.email}: ${transformedUser.id} -> ${importResult.newId}`);
      }
    }

    // Update recipe authorIds to match actual database user IDs
    console.log('\n🔄 Updating recipe author IDs...');
    for (const recipe of recipes) {
      const actualUserId = userIdMapping.get(recipe.authorId);
      if (actualUserId) {
        recipe.authorId = actualUserId;
      } else {
        console.warn(`  ⚠ No mapping found for author ID: ${recipe.authorId}`);
      }
    }

    // Update progress
    for (const result of userImportResult.results) {
      tracker.recordProcessed(result.legacyId, result.success);
    }
    await tracker.saveCheckpoint();

    // Import recipes
    console.log('\n📖 STEP 2: Import Recipes');
    console.log('-'.repeat(60));

    const batchImporter = new BatchImporter(config);
    
    // Filter out already imported recipes
    const { unimported, skipped } = idempotencyChecker.filterUnimportedRecipes(recipes);
    console.log(`  ℹ ${skipped.length} recipes already imported (skipping)`);
    console.log(`  ℹ ${unimported.length} recipes to import`);

    tracker.recordSkipped(skipped.length);

    const recipeResults = await batchImporter.importRecipes(unimported, (batchResult) => {
      // Update progress after each batch
      tracker.updateBatch(batchResult.batchNumber);
      
      for (const result of batchResult.results) {
        tracker.recordProcessed(result.legacyId, result.success);
        
        // Update idempotency checker
        if (result.success && result.newId) {
          const recipe = unimported.find(r => r.legacyId === result.legacyId);
          if (recipe) {
            idempotencyChecker.markRecipeImported(result.legacyId, result.newId, recipe.title);
          }
        }
      }

      // Save checkpoint after each batch
      tracker.saveCheckpoint().catch(err => {
        console.warn('Failed to save checkpoint:', err);
      });

      // Print progress
      tracker.printSummary();
    });

    // Add skipped recipes to results
    for (const recipe of skipped) {
      const existingMapping = idempotencyChecker.getRecipeMapping(recipe.legacyId);
      recipeResults.push({
        success: true,
        legacyId: recipe.legacyId,
        newId: existingMapping?.newUuid,
      });
    }

    // Save final mappings
    await idempotencyChecker.saveMappings();

    // Generate reports
    console.log('\n📊 STEP 3: Generate Reports');
    console.log('-'.repeat(60));

    const mappings = idempotencyChecker.exportMappings();
    await reportGenerator.generateReport(
      recipeResults,
      userImportResult.results,
      mappings.recipes,
      mappings.users,
      tracker.getProgress(),
      config
    );

    // Print final summary
    reportGenerator.printSummary(
      recipeResults,
      userImportResult.results,
      tracker.getProgress()
    );

    // Clean up checkpoint on success
    if (tracker.isComplete()) {
      await tracker.deleteCheckpoint();
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ Import phase complete in ${formatDuration(duration)}`);

  } catch (error) {
    console.error('\n❌ Import phase failed:', error);
    throw error;
  }
}

// ============================================================================
// Dry Run
// ============================================================================

/**
 * Run dry run validation
 */
async function runDryRun(
  recipes: TransformedRecipe[],
  users: TransformedUser[],
  config: ImportConfig,
  outputDir: string
): Promise<void> {
  const validator = new DryRunValidator();

  // Validate users
  const userResults = validator.validateUsers(users);

  // Validate recipes
  const recipeResults = validator.validateRecipes(recipes);

  // Generate report
  const reportPath = path.join(outputDir, `dry-run-report-${Date.now()}.json`);
  await validator.generateReport(reportPath);

  console.log(`\n✅ Dry run complete - no data was imported`);
  console.log(`   Review the report at: ${reportPath}`);
}

// ============================================================================
// Data Loading
// ============================================================================

/**
 * Load validated recipes (both PASS and WARN status)
 */
async function loadValidatedRecipes(validatedDir: string): Promise<TransformedRecipe[]> {
  const recipes: TransformedRecipe[] = [];
  
  // Load PASS recipes
  const passPath = path.join(validatedDir, 'recipes-pass.json');
  try {
    const passData = await fs.readFile(passPath, 'utf-8');
    const passRecipes = JSON.parse(passData);
    if (Array.isArray(passRecipes)) {
      recipes.push(...passRecipes);
    }
  } catch (error) {
    console.log('  ℹ No PASS recipes found');
  }
  
  // Load WARN recipes (these are still valid for import)
  const warnPath = path.join(validatedDir, 'recipes-warn.json');
  try {
    const warnData = await fs.readFile(warnPath, 'utf-8');
    const warnRecipes = JSON.parse(warnData);
    if (Array.isArray(warnRecipes)) {
      recipes.push(...warnRecipes);
    }
  } catch (error) {
    console.log('  ℹ No WARN recipes found');
  }
  
  if (recipes.length === 0) {
    throw new Error('No valid recipes found. Check validation output.');
  }
  
  return recipes;
}

/**
 * Load validated users
 */
async function loadValidatedUsers(validatedDir: string): Promise<TransformedUser[]> {
  // Users are in the transformed directory, not validated
  const transformedDir = validatedDir.replace('/validated/', '/transformed/');
  const usersPath = path.join(transformedDir, 'users-normalized.json');
  
  try {
    const data = await fs.readFile(usersPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('  ℹ No users found, will skip user import');
    return [];
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format duration
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

/**
 * Run import from command line
 */
export async function main() {
  // Load configuration from environment or config file
  const config: ImportConfig = {
    batchSize: parseInt(process.env.MIGRATION_BATCH_SIZE || '50'),
    dryRun: process.env.MIGRATION_DRY_RUN === 'true',
    stopOnError: process.env.MIGRATION_STOP_ON_ERROR === 'true',
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    authToken: process.env.MIGRATION_AUTH_TOKEN || '',
    delayBetweenBatches: parseInt(process.env.MIGRATION_DELAY_MS || '100'),
    maxRetries: parseInt(process.env.MIGRATION_MAX_RETRIES || '3'),
    retryBackoffMs: parseInt(process.env.MIGRATION_RETRY_BACKOFF_MS || '1000'),
  };

  // Get validated data directory from args or use latest
  const validatedDir = process.argv[2] || await findLatestValidatedDir();

  await importRecipes(config, validatedDir);
}

/**
 * Find latest validated directory
 */
async function findLatestValidatedDir(): Promise<string> {
  const baseDir = 'migration-data/validated';
  const entries = await fs.readdir(baseDir);
  const dirs = entries.filter(e => e.match(/^\d{4}-\d{2}-\d{2}/));
  
  if (dirs.length === 0) {
    throw new Error('No validated data found. Run validation phase first.');
  }

  dirs.sort().reverse();
  return path.join(baseDir, dirs[0]);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
