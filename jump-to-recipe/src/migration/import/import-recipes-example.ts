/**
 * Import Recipes Example
 * 
 * Example usage of the import phase components.
 * This file demonstrates how to use the import system.
 */

import { importRecipes } from './import-recipes';
import { BatchImporter } from './batch-importer';
import { IdempotencyChecker } from './idempotency-checker';
import { UserImporter } from './user-importer';
import { DryRunValidator } from './dry-run-validator';
import { ProgressTracker } from './progress-tracker';
import { ImportReportGenerator } from './import-report-generator';
import type { ImportConfig } from '../types/import';
import type { TransformedRecipe, TransformedUser } from '../types/transformation';

// ============================================================================
// Example 1: Full Import Pipeline
// ============================================================================

async function example1_fullImport() {
  console.log('Example 1: Full Import Pipeline\n');

  const config: ImportConfig = {
    batchSize: 50,
    dryRun: false,
    stopOnError: false,
    apiBaseUrl: 'http://localhost:3000',
    authToken: 'your_admin_token_here',
    delayBetweenBatches: 100,
    maxRetries: 3,
    retryBackoffMs: 1000,
  };

  // Run full import
  await importRecipes(
    config,
    'migration-data/validated/2026-01-23-14-30-00',
    'migration-data/imported'
  );
}

// ============================================================================
// Example 2: Dry Run First
// ============================================================================

async function example2_dryRun() {
  console.log('Example 2: Dry Run First\n');

  const config: ImportConfig = {
    batchSize: 50,
    dryRun: true, // Enable dry run
    stopOnError: false,
    apiBaseUrl: 'http://localhost:3000',
    authToken: 'your_admin_token_here',
    delayBetweenBatches: 100,
    maxRetries: 3,
    retryBackoffMs: 1000,
  };

  // Run dry run
  await importRecipes(
    config,
    'migration-data/validated/2026-01-23-14-30-00',
    'migration-data/imported'
  );

  console.log('\n✓ Dry run complete. Review the report before running actual import.');
}

// ============================================================================
// Example 3: Custom Batch Processing
// ============================================================================

async function example3_customBatchProcessing() {
  console.log('Example 3: Custom Batch Processing\n');

  const config: ImportConfig = {
    batchSize: 25, // Smaller batches
    dryRun: false,
    stopOnError: true, // Stop on first error
    apiBaseUrl: 'http://localhost:3000',
    authToken: 'your_admin_token_here',
    delayBetweenBatches: 200, // Longer delay
    maxRetries: 5, // More retries
    retryBackoffMs: 2000, // Longer backoff
  };

  const batchImporter = new BatchImporter(config);

  // Load recipes (example)
  const recipes: TransformedRecipe[] = []; // Load from validated data

  // Import with custom callback
  const results = await batchImporter.importRecipes(recipes, (batchResult) => {
    console.log(`\nBatch ${batchResult.batchNumber}/${batchResult.totalBatches}:`);
    console.log(`  Success: ${batchResult.successCount}`);
    console.log(`  Failed: ${batchResult.failureCount}`);
    console.log(`  Duration: ${batchResult.duration}ms`);
  });

  console.log(`\n✓ Import complete: ${results.filter(r => r.success).length} succeeded`);
}

// ============================================================================
// Example 4: Idempotency Checking
// ============================================================================

async function example4_idempotencyChecking() {
  console.log('Example 4: Idempotency Checking\n');

  const checker = new IdempotencyChecker('migration-data/imported');
  
  // Load existing mappings
  await checker.loadMappings();

  // Check if recipe already imported
  const legacyId = 123;
  if (checker.isRecipeImported(legacyId)) {
    console.log(`Recipe ${legacyId} already imported`);
    const uuid = checker.getRecipeUuid(legacyId);
    console.log(`  New UUID: ${uuid}`);
  } else {
    console.log(`Recipe ${legacyId} not yet imported`);
  }

  // Get statistics
  const stats = checker.getStats();
  console.log('\nMapping Statistics:');
  console.log(`  Recipes: ${stats.recipes.imported}/${stats.recipes.total} imported`);
  console.log(`  Users: ${stats.users.imported}/${stats.users.total} imported`);

  // Filter unimported recipes
  const allRecipes: TransformedRecipe[] = []; // Load recipes
  const { unimported, skipped } = checker.filterUnimportedRecipes(allRecipes);
  console.log(`\n${unimported.length} recipes to import, ${skipped.length} already imported`);
}

// ============================================================================
// Example 5: User Import with Deduplication
// ============================================================================

async function example5_userImport() {
  console.log('Example 5: User Import with Deduplication\n');

  const config: ImportConfig = {
    batchSize: 50,
    dryRun: false,
    stopOnError: false,
    apiBaseUrl: 'http://localhost:3000',
    authToken: 'your_admin_token_here',
    delayBetweenBatches: 100,
    maxRetries: 3,
    retryBackoffMs: 1000,
  };

  const idempotencyChecker = new IdempotencyChecker('migration-data/imported');
  await idempotencyChecker.loadMappings();

  const userImporter = new UserImporter(config, idempotencyChecker);

  // Load users (example)
  const users: TransformedUser[] = []; // Load from validated data

  // Import users
  const result = await userImporter.importUsers(users);

  console.log('\nUser Import Results:');
  console.log(`  Total: ${result.stats.total}`);
  console.log(`  Created: ${result.stats.created}`);
  console.log(`  Existing: ${result.stats.existing}`);
  console.log(`  Skipped: ${result.stats.skipped}`);
  console.log(`  Failed: ${result.stats.failed}`);
}

// ============================================================================
// Example 6: Progress Tracking
// ============================================================================

async function example6_progressTracking() {
  console.log('Example 6: Progress Tracking\n');

  const tracker = new ProgressTracker('migration-2026-01-23', 'import');
  
  // Initialize with total records
  tracker.initialize(1000, 20); // 1000 records, 20 batches

  // Simulate processing
  for (let i = 0; i < 100; i++) {
    const success = Math.random() > 0.1; // 90% success rate
    tracker.recordProcessed(i, success);
  }

  // Update batch
  tracker.updateBatch(5);

  // Print summary
  tracker.printSummary();

  // Save checkpoint
  await tracker.saveCheckpoint();

  console.log('\n✓ Checkpoint saved');
}

// ============================================================================
// Example 7: Dry Run Validation
// ============================================================================

async function example7_dryRunValidation() {
  console.log('Example 7: Dry Run Validation\n');

  const validator = new DryRunValidator();

  // Load data (example)
  const recipes: TransformedRecipe[] = []; // Load from validated data
  const users: TransformedUser[] = []; // Load from validated data

  // Validate
  const recipeResults = validator.validateRecipes(recipes);
  const userResults = validator.validateUsers(users);

  // Generate report
  await validator.generateReport('migration-data/imported/dry-run-report.json');

  console.log('\nValidation Results:');
  console.log(`  Recipes: ${recipeResults.filter(r => r.success).length}/${recipeResults.length} valid`);
  console.log(`  Users: ${userResults.filter(r => r.success).length}/${userResults.length} valid`);
}

// ============================================================================
// Example 8: Report Generation
// ============================================================================

async function example8_reportGeneration() {
  console.log('Example 8: Report Generation\n');

  const generator = new ImportReportGenerator('migration-data/imported');

  // Example data
  const recipeResults = [
    { success: true, legacyId: 1, newId: 'uuid-1' },
    { success: false, legacyId: 2, error: 'Validation error', errorType: 'validation' as const },
  ];

  const userResults = [
    { success: true, legacyId: 1, newId: 'uuid-user-1' },
  ];

  const recipeMappings = [
    { legacyId: 1, newUuid: 'uuid-1', title: 'Recipe 1', migrated: true, migratedAt: new Date().toISOString() },
  ];

  const userMappings = [
    { legacyId: 1, newUuid: 'uuid-user-1', email: 'user@example.com', migrated: true, migratedAt: new Date().toISOString() },
  ];

  const progress = {
    migrationId: 'migration-2026-01-23',
    phase: 'import' as const,
    startTime: new Date().toISOString(),
    lastCheckpoint: new Date().toISOString(),
    totalRecords: 2,
    processedRecords: 2,
    succeededRecords: 1,
    failedRecords: 1,
    warnedRecords: 0,
    skippedRecords: 0,
  };

  const config = {
    dryRun: false,
    batchSize: 50,
    stopOnError: false,
    apiBaseUrl: 'http://localhost:3000',
  };

  // Generate reports
  await generator.generateReport(
    recipeResults,
    userResults,
    recipeMappings,
    userMappings,
    progress,
    config
  );

  // Print summary
  generator.printSummary(recipeResults, userResults, progress);
}

// ============================================================================
// Example 9: Resume from Checkpoint
// ============================================================================

async function example9_resumeFromCheckpoint() {
  console.log('Example 9: Resume from Checkpoint\n');

  // Try to load existing checkpoint
  const existingTracker = await ProgressTracker.loadCheckpoint(
    'migration-2026-01-23',
    'import'
  );

  if (existingTracker) {
    console.log('✓ Checkpoint found, resuming...');
    existingTracker.printSummary();

    // Continue processing from where we left off
    const processedIds = existingTracker.getProcessedIds();
    console.log(`\nAlready processed ${processedIds.length} records`);
    console.log('Continuing with remaining records...');
  } else {
    console.log('No checkpoint found, starting fresh');
  }
}

// ============================================================================
// Example 10: Error Handling
// ============================================================================

async function example10_errorHandling() {
  console.log('Example 10: Error Handling\n');

  const config: ImportConfig = {
    batchSize: 50,
    dryRun: false,
    stopOnError: false, // Continue on errors
    apiBaseUrl: 'http://localhost:3000',
    authToken: 'your_admin_token_here',
    delayBetweenBatches: 100,
    maxRetries: 3,
    retryBackoffMs: 1000,
  };

  try {
    await importRecipes(
      config,
      'migration-data/validated/2026-01-23-14-30-00',
      'migration-data/imported'
    );
  } catch (error) {
    console.error('Import failed:', error);
    
    // Check if checkpoint was saved
    const tracker = await ProgressTracker.loadCheckpoint('migration-2026-01-23', 'import');
    if (tracker) {
      console.log('\n✓ Progress was saved, you can resume by re-running the import');
      tracker.printSummary();
    }
  }
}

// ============================================================================
// Run Examples
// ============================================================================

async function main() {
  const examples = [
    { name: 'Full Import Pipeline', fn: example1_fullImport },
    { name: 'Dry Run First', fn: example2_dryRun },
    { name: 'Custom Batch Processing', fn: example3_customBatchProcessing },
    { name: 'Idempotency Checking', fn: example4_idempotencyChecking },
    { name: 'User Import with Deduplication', fn: example5_userImport },
    { name: 'Progress Tracking', fn: example6_progressTracking },
    { name: 'Dry Run Validation', fn: example7_dryRunValidation },
    { name: 'Report Generation', fn: example8_reportGeneration },
    { name: 'Resume from Checkpoint', fn: example9_resumeFromCheckpoint },
    { name: 'Error Handling', fn: example10_errorHandling },
  ];

  console.log('Import Phase Examples\n');
  console.log('Available examples:');
  examples.forEach((ex, i) => {
    console.log(`  ${i + 1}. ${ex.name}`);
  });

  // Run specific example by uncommenting:
  // await example1_fullImport();
  // await example2_dryRun();
  // await example6_progressTracking();
  // await example7_dryRunValidation();
  // await example8_reportGeneration();
}

// Uncomment to run examples
// main().catch(console.error);
