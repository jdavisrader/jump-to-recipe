# Error Handling Quick Reference

Quick reference guide for using the migration error handling system.

## Import Statements

```typescript
// Error types
import { MigrationError, categorizeError } from '../types/errors';

// Retry utilities
import { withRetry, withAutoRetry, withBatchRetry } from '../utils/retry';

// Logging
import { logger, createPhaseLogger } from '../utils/logger';

// Error recovery
import { 
  initializeErrorRecovery, 
  getErrorRecovery,
  createRecoveryState 
} from '../utils/error-recovery';
```

## Common Patterns

### 1. Initialize at Start of Phase

```typescript
// Initialize error recovery
const recovery = initializeErrorRecovery({
  stopOnError: false,
  saveStateOnError: true,
  outputDir: './migration-data',
});

// Initialize logger
logger.initialize('./migration-data', 'extract');
const log = createPhaseLogger('extract');

// Register cleanup
recovery.registerShutdownHandler(async () => {
  await logger.close();
});
```

### 2. Wrap Retryable Operations

```typescript
// Auto-retry (uses error category config)
const data = await withAutoRetry(
  async () => await fetchData(),
  'extract'
);

// Custom retry config
const data = await withRetry(
  async () => await fetchData(),
  'extract',
  { maxRetries: 5, initialDelay: 2000 }
);
```

### 3. Batch Processing

```typescript
const results = await withBatchRetry(
  items,
  async (item) => await processItem(item),
  'transform',
  { maxRetries: 3, initialDelay: 500 }
);

// Check results
const succeeded = results.filter(r => r.result).length;
const failed = results.filter(r => r.error).length;
```

### 4. Logging

```typescript
// Basic logging
log.info('Operation started', { count: 100 });
log.debug('Processing item', { id: 123 });
log.warn('Potential issue', { warning: 'Missing field' });
log.error('Operation failed', { error: error.message });

// With phase
logger.withPhase('import').info('Starting import');
```

### 5. Error Handling

```typescript
try {
  await operation();
} catch (error) {
  // Categorize error
  const migrationError = categorizeError(error, 'transform');
  
  // Log it
  log.error('Operation failed', {
    category: migrationError.category,
    retryable: migrationError.retryable,
  });
  
  // Handle based on category
  if (migrationError.category === 'PARSE_ERROR') {
    // Add to manual review queue
  }
  
  throw migrationError;
}
```

### 6. Save Recovery State

```typescript
await recovery.saveRecoveryState(
  createRecoveryState(
    'import',
    {
      totalRecords: 1000,
      processedRecords: 500,
      succeededRecords: 480,
      failedRecords: 20,
    },
    { lastBatchId: 10 }, // checkpoint
    { batchSize: 50 }    // metadata
  )
);
```

### 7. Load and Resume

```typescript
const states = recovery.listRecoveryStates();
if (states.length > 0) {
  const state = recovery.loadRecoveryState(states[states.length - 1]);
  if (state?.checkpoint) {
    // Resume from checkpoint
    startBatchId = state.checkpoint.lastBatchId + 1;
  }
}
```

## Error Categories

| Category | Retryable | Max Retries | Initial Delay |
|----------|-----------|-------------|---------------|
| SSH_CONNECTION | ✅ | 3 | 2000ms |
| DATABASE_CONNECTION | ✅ | 3 | 1000ms |
| NETWORK_ERROR | ✅ | 3 | 1000ms |
| IMPORT_ERROR | ✅ | 3 | 500ms |
| PARSE_ERROR | ❌ | 0 | - |
| VALIDATION_ERROR | ❌ | 0 | - |
| FILE_SYSTEM_ERROR | ❌ | 0 | - |
| CONFIGURATION_ERROR | ❌ | 0 | - |

## Log Levels

| Level | When to Use |
|-------|-------------|
| DEBUG | Detailed debugging info, variable values |
| INFO | General progress, milestones |
| WARN | Potential issues, recoverable errors |
| ERROR | Failures, exceptions |

## Configuration Cheat Sheet

```typescript
// Logger
logger.configure({
  level: 'INFO',         // DEBUG, INFO, WARN, ERROR
  verbose: true,         // Show data in console
  logToFile: true,
  logToConsole: true,
});

// Retry
{
  maxRetries: 3,
  initialDelay: 1000,    // milliseconds
  maxDelay: 30000,       // milliseconds
  backoffMultiplier: 2,  // 2x each retry
}

// Error Recovery
{
  stopOnError: false,    // Continue on error
  saveStateOnError: true,
  outputDir: './migration-data',
}
```

## Complete Example

```typescript
async function migrateData() {
  // Setup
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
    log.info('Starting migration');
    
    // Load data with retry
    const data = await withAutoRetry(
      async () => await loadData(),
      'import'
    );
    
    // Process with batch retry
    const results = await withBatchRetry(
      data,
      async (item) => await processItem(item),
      'import',
      { maxRetries: 3 }
    );
    
    // Analyze results
    const succeeded = results.filter(r => r.result).length;
    const failed = results.filter(r => r.error).length;
    
    log.info('Migration complete', { succeeded, failed });
    
    // Save state if failures
    if (failed > 0) {
      await recovery.saveRecoveryState(
        createRecoveryState('import', {
          totalRecords: data.length,
          processedRecords: data.length,
          succeededRecords: succeeded,
          failedRecords: failed,
        })
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
```

## Tips

1. **Always initialize logger and recovery** at the start of each phase
2. **Use `withAutoRetry`** for most operations (automatic config)
3. **Use `withBatchRetry`** for processing arrays
4. **Log at appropriate levels** (don't spam DEBUG in production)
5. **Save recovery state** after each batch or checkpoint
6. **Register cleanup handlers** for resources (DB, files, etc.)
7. **Use phase-scoped loggers** for cleaner code
8. **Check recovery states** before starting to resume if needed

## See Also

- [ERROR-HANDLING.md](./ERROR-HANDLING.md) - Complete documentation
- [error-handling-example.ts](./error-handling-example.ts) - Working examples
- [README.md](./README.md) - Utilities overview
