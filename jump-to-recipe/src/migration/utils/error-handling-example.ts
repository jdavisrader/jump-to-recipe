/**
 * Example usage of error handling, retry, and logging system
 * 
 * This file demonstrates how to use the migration error handling utilities
 * in a real-world scenario.
 */

import {
  initializeErrorRecovery,
  getErrorRecovery,
  createRecoveryState,
} from './error-recovery';
import { logger, createPhaseLogger } from './logger';
import { withAutoRetry, withBatchRetry } from './retry';
import { MigrationError, categorizeError } from '../types/errors';

// Example: Extract data with error handling
async function extractWithErrorHandling() {
  // Initialize error recovery
  const recovery = initializeErrorRecovery({
    stopOnError: false, // Continue on error
    saveStateOnError: true,
    outputDir: './migration-data',
  });

  // Initialize logger
  logger.configure({
    level: 'DEBUG',
    verbose: true,
    logToFile: true,
    logToConsole: true,
  });
  logger.initialize('./migration-data', 'extract');
  const log = createPhaseLogger('extract');

  // Register cleanup handlers
  recovery.registerShutdownHandler(async () => {
    log.info('Closing database connections...');
    // await db.close();
    await logger.close();
  });

  try {
    log.info('Starting data extraction');

    // Connect to database with auto-retry
    const connection = await withAutoRetry(
      async () => {
        log.debug('Attempting database connection');
        // Simulated connection that might fail
        if (Math.random() > 0.7) {
          throw new Error('ECONNREFUSED: Connection refused');
        }
        return { connected: true };
      },
      'extract'
    );

    log.info('Database connected successfully');

    // Extract data
    const tables = ['users', 'recipes', 'ingredients'];
    const results: Record<string, any> = {};

    for (const table of tables) {
      log.info(`Extracting ${table}...`);

      try {
        const data = await withAutoRetry(
          async () => {
            // Simulated extraction
            log.debug(`Querying ${table} table`);
            return Array.from({ length: 100 }, (_, i) => ({
              id: i + 1,
              data: `${table}_${i}`,
            }));
          },
          'extract',
          { context: { table } }
        );

        results[table] = data;
        log.info(`Extracted ${data.length} records from ${table}`);
      } catch (error) {
        log.error(`Failed to extract ${table}`, {
          error: error instanceof Error ? error.message : String(error),
        });

        // Save recovery state
        await recovery.saveRecoveryState(
          createRecoveryState(
            'extract',
            {
              totalRecords: tables.length,
              processedRecords: Object.keys(results).length,
              succeededRecords: Object.keys(results).length,
              failedRecords: 1,
            },
            { completedTables: Object.keys(results), failedTable: table }
          )
        );

        throw error;
      }
    }

    log.info('Extraction complete', {
      tables: Object.keys(results),
      totalRecords: Object.values(results).reduce(
        (sum, arr: any) => sum + arr.length,
        0
      ),
    });

    return results;
  } catch (error) {
    log.error('Extraction failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await logger.close();
  }
}

// Example: Import with batch retry
async function importWithBatchRetry() {
  const recovery = initializeErrorRecovery({
    stopOnError: false,
    saveStateOnError: true,
    outputDir: './migration-data',
  });

  logger.initialize('./migration-data', 'import');
  const log = createPhaseLogger('import');

  recovery.registerShutdownHandler(async () => {
    await logger.close();
  });

  try {
    log.info('Starting batch import');

    // Simulated recipes to import
    const recipes = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: `Recipe ${i + 1}`,
      ingredients: ['ingredient 1', 'ingredient 2'],
    }));

    log.info(`Importing ${recipes.length} recipes`);

    // Import with batch retry
    const results = await withBatchRetry(
      recipes,
      async (recipe) => {
        log.debug(`Importing recipe ${recipe.id}`);

        // Simulated API call with random failures
        return await withAutoRetry(
          async () => {
            if (Math.random() > 0.9) {
              throw new Error('500: Internal Server Error');
            }
            return { id: recipe.id, success: true };
          },
          'import',
          { recordId: recipe.id, recordTitle: recipe.title }
        );
      },
      'import',
      {
        maxRetries: 3,
        initialDelay: 500,
        onRetry: (error, attempt) => {
          log.warn(`Retrying import`, {
            recordId: error.metadata.recordId,
            attempt,
          });
        },
      }
    );

    // Analyze results
    const succeeded = results.filter((r) => r.result).length;
    const failed = results.filter((r) => r.error).length;

    log.info('Import complete', {
      total: recipes.length,
      succeeded,
      failed,
      successRate: `${((succeeded / recipes.length) * 100).toFixed(1)}%`,
    });

    // Log failed imports
    if (failed > 0) {
      const failedRecipes = results
        .filter((r) => r.error)
        .map((r) => ({
          id: r.item.id,
          title: r.item.title,
          error: r.error?.message,
        }));

      log.error('Failed imports', { failedRecipes });

      // Save recovery state
      await recovery.saveRecoveryState(
        createRecoveryState(
          'import',
          {
            totalRecords: recipes.length,
            processedRecords: recipes.length,
            succeededRecords: succeeded,
            failedRecords: failed,
          },
          { failedRecipeIds: failedRecipes.map((r) => r.id) }
        )
      );
    }

    return results;
  } catch (error) {
    log.error('Import failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await logger.close();
  }
}

// Example: Custom error handling
async function customErrorHandling() {
  logger.initialize('./migration-data', 'transform');
  const log = createPhaseLogger('transform');

  try {
    log.info('Starting transformation');

    // Simulated operation that throws custom error
    try {
      throw new MigrationError(
        'Failed to parse ingredient',
        'PARSE_ERROR',
        'transform',
        false,
        {
          recordId: 123,
          recordTitle: 'Chocolate Cake',
          context: { ingredient: '2 cups flour???' },
        }
      );
    } catch (error) {
      if (error instanceof MigrationError) {
        log.error('Parse error occurred', {
          category: error.category,
          retryable: error.retryable,
          metadata: error.metadata,
        });

        // Handle based on category
        if (error.category === 'PARSE_ERROR') {
          log.warn('Adding to manual review queue', {
            recordId: error.metadata.recordId,
          });
          // Add to manual review queue
        }
      }
    }

    // Categorize generic error
    try {
      throw new Error('ECONNREFUSED: Connection refused');
    } catch (error) {
      const migrationError = categorizeError(error, 'transform');
      log.error('Categorized error', {
        category: migrationError.category,
        retryable: migrationError.retryable,
      });
    }
  } finally {
    await logger.close();
  }
}

// Example: Recovery from saved state
async function recoverFromSavedState() {
  const recovery = initializeErrorRecovery({
    stopOnError: false,
    saveStateOnError: true,
    outputDir: './migration-data',
  });

  logger.initialize('./migration-data', 'import');
  const log = createPhaseLogger('import');

  try {
    // List available recovery states
    const states = recovery.listRecoveryStates();
    log.info(`Found ${states.length} recovery states`);

    if (states.length > 0) {
      // Load most recent state
      const latestState = recovery.loadRecoveryState(states[states.length - 1]);

      if (latestState) {
        log.info('Loaded recovery state', {
          phase: latestState.phase,
          timestamp: latestState.timestamp,
          progress: latestState.progress,
        });

        // Resume from checkpoint
        if (latestState.checkpoint?.failedRecipeIds) {
          log.info('Resuming failed imports', {
            count: latestState.checkpoint.failedRecipeIds.length,
          });

          // Retry failed recipes
          // ... implementation
        }
      }
    }
  } finally {
    await logger.close();
  }
}

// Run examples (commented out to prevent execution)
// extractWithErrorHandling().catch(console.error);
// importWithBatchRetry().catch(console.error);
// customErrorHandling().catch(console.error);
// recoverFromSavedState().catch(console.error);

export {
  extractWithErrorHandling,
  importWithBatchRetry,
  customErrorHandling,
  recoverFromSavedState,
};
