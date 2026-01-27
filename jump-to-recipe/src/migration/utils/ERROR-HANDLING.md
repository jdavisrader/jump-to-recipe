# Error Handling and Logging System

This document describes the error handling, retry, logging, and recovery mechanisms for the migration system.

## Overview

The migration system includes a comprehensive error handling framework with:

1. **Error Classification**: Categorize errors by type and determine retry behavior
2. **Retry Mechanism**: Automatic retry with exponential backoff
3. **Structured Logging**: JSON-formatted logs with multiple levels
4. **Error Recovery**: Graceful shutdown and state persistence

## Components

### 1. Error Classification (`types/errors.ts`)

#### MigrationError Class

Custom error class that extends the standard Error with migration-specific metadata:

```typescript
import { MigrationError } from '../types/errors';

throw new MigrationError(
  'Failed to connect to database',
  'DATABASE_CONNECTION',
  'extract',
  true, // retryable
  { recordId: 123, attemptNumber: 1 }
);
```

**Error Categories:**
- `SSH_CONNECTION`: SSH tunnel failures (retryable)
- `DATABASE_CONNECTION`: Database connection issues (retryable)
- `NETWORK_ERROR`: Network/API failures (retryable)
- `IMPORT_ERROR`: Import operation failures (conditionally retryable)
- `PARSE_ERROR`: Data parsing failures (not retryable)
- `VALIDATION_ERROR`: Validation failures (not retryable)
- `FILE_SYSTEM_ERROR`: File I/O errors (not retryable)
- `CONFIGURATION_ERROR`: Configuration issues (not retryable)
- `UNKNOWN_ERROR`: Uncategorized errors (not retryable)

#### Automatic Error Categorization

```typescript
import { categorizeError } from '../types/errors';

try {
  // Some operation
} catch (error) {
  const migrationError = categorizeError(error, 'extract');
  // migrationError is now a MigrationError with proper category
}
```

#### Retry Configuration

```typescript
import { getRetryConfig } from '../types/errors';

const config = getRetryConfig('SSH_CONNECTION');
// { maxRetries: 3, initialDelay: 2000 }
```

### 2. Retry Mechanism (`utils/retry.ts`)

#### Basic Retry

```typescript
import { withRetry } from '../utils/retry';

const result = await withRetry(
  async () => {
    // Your operation here
    return await fetchData();
  },
  'extract', // phase
  {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}: ${error.message}`);
    },
  }
);
```

#### Auto-Retry (Category-Based)

Automatically uses retry configuration based on error category:

```typescript
import { withAutoRetry } from '../utils/retry';

const result = await withAutoRetry(
  async () => {
    return await connectToDatabase();
  },
  'extract'
);
// Automatically retries with SSH_CONNECTION or DATABASE_CONNECTION config
```

#### Batch Retry

Retry each item in a batch individually:

```typescript
import { withBatchRetry } from '../utils/retry';

const results = await withBatchRetry(
  recipes,
  async (recipe) => {
    return await importRecipe(recipe);
  },
  'import',
  { maxRetries: 3, initialDelay: 500 }
);

// results: Array<{ item, result?, error? }>
```

#### Parallel Retry

Execute multiple operations in parallel with retry:

```typescript
import { withParallelRetry } from '../utils/retry';

const operations = recipes.map((recipe) => async () => {
  return await importRecipe(recipe);
});

const results = await withParallelRetry(
  operations,
  'import',
  { maxRetries: 3 },
  5 // concurrency
);
```

### 3. Structured Logging (`utils/logger.ts`)

#### Basic Usage

```typescript
import { logger } from '../utils/logger';

// Initialize logger for a phase
logger.initialize('/path/to/migration-data', 'extract');

// Log messages
logger.debug('Detailed debug information', { recordId: 123 });
logger.info('Operation started', { batchSize: 50 });
logger.warn('Potential issue detected', { warning: 'Missing field' });
logger.error('Operation failed', { error: error.message });

// Close logger when done
await logger.close();
```

#### Phase-Scoped Logger

```typescript
import { createPhaseLogger } from '../utils/logger';

const extractLogger = createPhaseLogger('extract');

extractLogger.info('Starting extraction');
extractLogger.debug('Processing record', { id: 123 });
```

#### Configuration

```typescript
logger.configure({
  level: 'DEBUG', // DEBUG, INFO, WARN, ERROR
  verbose: true, // Show detailed data in console
  logToFile: true,
  logToConsole: true,
});
```

#### Log Output

**Console Output** (colored, human-readable):
```
[14:30:45] INFO [extract]: Starting extraction
[14:30:46] DEBUG [extract]: Processing record
  { id: 123, name: "Recipe Name" }
```

**File Output** (JSON, machine-readable):
```json
{"timestamp":"2026-01-25T14:30:45.123Z","level":"INFO","phase":"extract","message":"Starting extraction"}
{"timestamp":"2026-01-25T14:30:46.456Z","level":"DEBUG","phase":"extract","message":"Processing record","data":{"id":123,"name":"Recipe Name"}}
```

### 4. Error Recovery (`utils/error-recovery.ts`)

#### Initialize Recovery Manager

```typescript
import { initializeErrorRecovery } from '../utils/error-recovery';

const recovery = initializeErrorRecovery({
  stopOnError: false, // Continue on error
  saveStateOnError: true, // Save recovery state
  outputDir: '/path/to/migration-data',
});
```

#### Register Shutdown Handlers

```typescript
recovery.registerShutdownHandler(async () => {
  // Cleanup code
  await closeDatabaseConnection();
  await logger.close();
});
```

#### Execute with Error Recovery

```typescript
import { getErrorRecovery } from '../utils/error-recovery';

const recovery = getErrorRecovery();

await recovery.withErrorRecovery(
  async () => {
    // Your operation
    return await processRecipes();
  },
  'transform',
  {
    progress: {
      totalRecords: 1000,
      processedRecords: 500,
      succeededRecords: 480,
      failedRecords: 20,
    },
    checkpoint: { lastProcessedId: 500 },
  }
);
```

#### Save and Load Recovery State

```typescript
// Save state manually
const statePath = await recovery.saveRecoveryState({
  phase: 'import',
  timestamp: new Date().toISOString(),
  error: {
    message: 'Connection timeout',
    category: 'NETWORK_ERROR',
  },
  progress: {
    totalRecords: 1000,
    processedRecords: 500,
    succeededRecords: 480,
    failedRecords: 20,
  },
  checkpoint: { lastBatchId: 10 },
});

// List available recovery states
const states = recovery.listRecoveryStates();

// Load recovery state
const state = recovery.loadRecoveryState(states[0]);
if (state) {
  // Resume from checkpoint
  console.log(`Resuming from ${state.checkpoint.lastBatchId}`);
}
```

#### Graceful Shutdown

The recovery manager automatically handles:
- `SIGINT` (Ctrl+C)
- `SIGTERM` (kill command)
- `SIGQUIT`
- Uncaught exceptions
- Unhandled promise rejections

```typescript
// Graceful shutdown is automatic, but you can trigger it manually:
await recovery.gracefulShutdown('manual');
```

## Complete Example

```typescript
import {
  initializeErrorRecovery,
  getErrorRecovery,
  createRecoveryState,
} from '../utils/error-recovery';
import { logger, createPhaseLogger } from '../utils/logger';
import { withAutoRetry, withBatchRetry } from '../utils/retry';
import { MigrationError } from '../types/errors';

async function migrateRecipes() {
  // Initialize error recovery
  const recovery = initializeErrorRecovery({
    stopOnError: false,
    saveStateOnError: true,
    outputDir: './migration-data',
  });

  // Initialize logger
  logger.initialize('./migration-data', 'import');
  const log = createPhaseLogger('import');

  // Register cleanup handlers
  recovery.registerShutdownHandler(async () => {
    log.info('Cleaning up resources...');
    await logger.close();
  });

  try {
    log.info('Starting recipe migration');

    // Load recipes
    const recipes = await loadRecipes();
    log.info(`Loaded ${recipes.length} recipes`);

    // Process with retry and error recovery
    const results = await withBatchRetry(
      recipes,
      async (recipe) => {
        return await withAutoRetry(
          async () => {
            return await importRecipe(recipe);
          },
          'import',
          { recordId: recipe.id }
        );
      },
      'import',
      { maxRetries: 3, initialDelay: 500 }
    );

    // Count results
    const succeeded = results.filter((r) => r.result).length;
    const failed = results.filter((r) => r.error).length;

    log.info('Migration complete', {
      total: recipes.length,
      succeeded,
      failed,
    });

    // Save recovery state if there were failures
    if (failed > 0) {
      await recovery.saveRecoveryState(
        createRecoveryState(
          'import',
          {
            totalRecords: recipes.length,
            processedRecords: recipes.length,
            succeededRecords: succeeded,
            failedRecords: failed,
          },
          { failedRecipes: results.filter((r) => r.error).map((r) => r.item.id) }
        )
      );
    }
  } catch (error) {
    log.error('Migration failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await logger.close();
  }
}

// Run migration
migrateRecipes().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

## Best Practices

1. **Always initialize logger and recovery manager** at the start of each phase
2. **Use phase-scoped loggers** for cleaner code
3. **Use `withAutoRetry`** for operations that might fail transiently
4. **Register shutdown handlers** for cleanup operations
5. **Save recovery state** after each batch or checkpoint
6. **Use structured logging** with meaningful data objects
7. **Categorize errors properly** for appropriate retry behavior
8. **Set `stopOnError: false`** for batch operations to continue processing
9. **Set `stopOnError: true`** for critical operations that must succeed

## Configuration Options

### Logger Configuration

```typescript
{
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
  verbose: boolean,
  outputDir: string,
  logToFile: boolean,
  logToConsole: boolean
}
```

### Retry Configuration

```typescript
{
  maxRetries: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number,
  onRetry: (error, attempt) => void
}
```

### Error Recovery Configuration

```typescript
{
  stopOnError: boolean,
  saveStateOnError: boolean,
  outputDir: string
}
```

## Error Recovery Files

Recovery states are saved to:
```
migration-data/
└── recovery/
    ├── recovery-extract-2026-01-25T14-30-45-123Z.json
    ├── recovery-transform-2026-01-25T15-45-30-456Z.json
    └── recovery-import-2026-01-25T16-20-15-789Z.json
```

Each recovery file contains:
```json
{
  "phase": "import",
  "timestamp": "2026-01-25T16:20:15.789Z",
  "error": {
    "message": "Connection timeout",
    "category": "NETWORK_ERROR",
    "stack": "..."
  },
  "progress": {
    "totalRecords": 1000,
    "processedRecords": 500,
    "succeededRecords": 480,
    "failedRecords": 20
  },
  "checkpoint": {
    "lastBatchId": 10,
    "lastProcessedId": 500
  },
  "metadata": {
    "batchSize": 50,
    "startTime": "2026-01-25T16:00:00.000Z"
  }
}
```
