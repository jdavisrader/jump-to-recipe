# Import Phase

This directory contains the implementation for the import phase of the legacy recipe migration system. The import phase takes validated recipes and users and imports them into the new database via API endpoints.

## Overview

The import phase is the final step in the ETVI (Extract-Transform-Validate-Import) pipeline. It handles:

- Batch processing of recipes and users
- API integration with retry logic
- Idempotency checking to prevent duplicates
- User deduplication by email
- Progress tracking with checkpoint-based recovery
- Comprehensive reporting
- Dry-run mode for testing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Import Orchestrator                      │
│                   (import-recipes.ts)                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──► User Importer ──────► API: POST /api/users
             │    (user-importer.ts)
             │
             ├──► Batch Importer ─────► API: POST /api/recipes
             │    (batch-importer.ts)
             │
             ├──► Idempotency Checker ─► ID Mappings
             │    (idempotency-checker.ts)
             │
             ├──► Progress Tracker ────► Checkpoints
             │    (progress-tracker.ts)
             │
             ├──► Dry Run Validator ───► Validation Reports
             │    (dry-run-validator.ts)
             │
             └──► Report Generator ────► Import Reports
                  (import-report-generator.ts)
```

## Components

### 1. Batch Importer (`batch-importer.ts`)

Handles batch processing of recipes and users with API integration.

**Features:**
- Configurable batch size
- Exponential backoff retry logic
- Error categorization (4xx vs 5xx)
- Delay between batches to avoid rate limiting
- Stop-on-error mode

**Usage:**
```typescript
import { BatchImporter } from './batch-importer';

const importer = new BatchImporter(config);
const results = await importer.importRecipes(recipes, (batchResult) => {
  console.log(`Batch ${batchResult.batchNumber} complete`);
});
```

### 2. Idempotency Checker (`idempotency-checker.ts`)

Prevents duplicate imports by tracking legacy ID to new UUID mappings.

**Features:**
- Load/save ID mappings from disk
- Check if recipe/user already imported
- Filter out already imported items
- Export mappings for reporting

**Usage:**
```typescript
import { IdempotencyChecker } from './idempotency-checker';

const checker = new IdempotencyChecker('migration-data/imported');
await checker.loadMappings();

if (!checker.isRecipeImported(legacyId)) {
  // Import recipe
  checker.markRecipeImported(legacyId, newUuid, title);
}

await checker.saveMappings();
```

### 3. User Importer (`user-importer.ts`)

Specialized importer for users with email-based deduplication.

**Features:**
- Check if user exists by email
- Use existing user UUID if found
- Create new user if not exists
- Update user mapping table

**Usage:**
```typescript
import { UserImporter } from './user-importer';

const userImporter = new UserImporter(config, idempotencyChecker);
const result = await userImporter.importUsers(users);
```

### 4. Dry Run Validator (`dry-run-validator.ts`)

Validates import payloads without actually importing.

**Features:**
- Validate required fields
- Check UUID formats
- Validate email formats
- Generate warnings for non-critical issues
- Create "would import" report

**Usage:**
```typescript
import { DryRunValidator } from './dry-run-validator';

const validator = new DryRunValidator();
const results = validator.validateRecipes(recipes);
await validator.generateReport('dry-run-report.json');
```

### 5. Progress Tracker (`progress-tracker.ts`)

Tracks migration progress and creates checkpoints for recovery.

**Features:**
- Track processed/succeeded/failed counts
- Save checkpoints after each batch
- Resume from last checkpoint
- Estimate time remaining
- Auto-save at intervals

**Usage:**
```typescript
import { ProgressTracker, createOrResumeTracker } from './progress-tracker';

const { tracker, resumed } = await createOrResumeTracker('migration-id', 'import');
tracker.initialize(totalRecords);

// After processing each record
tracker.recordProcessed(legacyId, success);

// After each batch
await tracker.saveCheckpoint();
```

### 6. Import Report Generator (`import-report-generator.ts`)

Generates comprehensive reports for the import phase.

**Features:**
- Summary report with statistics
- Success log with all imported items
- Error log with failure details
- ID mapping files (JSON and CSV)
- Human-readable error report

**Usage:**
```typescript
import { ImportReportGenerator } from './import-report-generator';

const generator = new ImportReportGenerator('migration-data/imported');
await generator.generateReport(
  recipeResults,
  userResults,
  recipeMappings,
  userMappings,
  progress,
  config
);
```

## Configuration

The import phase is configured via environment variables or a config object:

```typescript
interface ImportConfig {
  batchSize: number;              // Records per batch (default: 50)
  dryRun: boolean;                // Validate without importing (default: false)
  stopOnError: boolean;           // Stop on first error (default: false)
  apiBaseUrl: string;             // API base URL (e.g., http://localhost:3000)
  authToken: string;              // Migration user auth token
  delayBetweenBatches: number;    // Delay in ms (default: 100)
  maxRetries: number;             // Max retry attempts (default: 3)
  retryBackoffMs: number;         // Initial backoff in ms (default: 1000)
}
```

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
MIGRATION_AUTH_TOKEN=your_admin_token_here

# Import Settings
MIGRATION_BATCH_SIZE=50
MIGRATION_DRY_RUN=false
MIGRATION_STOP_ON_ERROR=false
MIGRATION_DELAY_MS=100
MIGRATION_MAX_RETRIES=3
MIGRATION_RETRY_BACKOFF_MS=1000
```

## Usage

### Running the Import

```bash
# Run import with default settings
npm run migration:import

# Run with specific validated data directory
npm run migration:import -- migration-data/validated/2026-01-23-14-30-00

# Dry run mode (no actual imports)
MIGRATION_DRY_RUN=true npm run migration:import
```

### Programmatic Usage

```typescript
import { importRecipes } from './import/import-recipes';

const config = {
  batchSize: 50,
  dryRun: false,
  stopOnError: false,
  apiBaseUrl: 'http://localhost:3000',
  authToken: 'your_token',
  delayBetweenBatches: 100,
  maxRetries: 3,
  retryBackoffMs: 1000,
};

await importRecipes(
  config,
  'migration-data/validated/2026-01-23-14-30-00',
  'migration-data/imported'
);
```

## Output Files

The import phase generates the following files in `migration-data/imported/`:

```
migration-data/imported/
├── import-summary-{timestamp}.json      # Overall statistics
├── import-success-{timestamp}.json      # Successful imports
├── import-errors-{timestamp}.json       # Failed imports (JSON)
├── import-errors-{timestamp}.md         # Failed imports (human-readable)
├── import-statistics-{timestamp}.json   # Detailed statistics
├── recipe-id-mapping.json               # Recipe ID mappings (JSON)
├── recipe-id-mapping.csv                # Recipe ID mappings (CSV)
├── user-id-mapping.json                 # User ID mappings (JSON)
├── user-id-mapping.csv                  # User ID mappings (CSV)
└── dry-run-report-{timestamp}.json      # Dry run validation report
```

## Error Handling

### Error Categories

1. **Validation Errors (4xx)**: Invalid data, don't retry
2. **Server Errors (5xx)**: Temporary issues, retry with backoff
3. **Network Errors**: Connection issues, retry with backoff
4. **Unknown Errors**: Log and continue

### Retry Logic

- **Max Retries**: 3 attempts (configurable)
- **Backoff**: Exponential (1s, 2s, 4s)
- **Retryable**: 5xx errors and network errors
- **Non-retryable**: 4xx validation errors

### Recovery

If the import is interrupted:

1. Progress is saved in checkpoints
2. Re-run the import script
3. It will automatically resume from the last checkpoint
4. Already imported items are skipped (idempotency)

## Idempotency

The import process is idempotent:

- **Users**: Checked by email, existing users are reused
- **Recipes**: Tracked by legacy ID in mapping table
- **Re-runs**: Safe to re-run, skips already imported items
- **Checkpoints**: Enable resumption from interruptions

## Performance

### Expected Performance

- **Batch Size**: 50 recipes per batch
- **Delay**: 100ms between batches
- **Throughput**: ~450 recipes/minute
- **10k Recipes**: ~20-30 minutes

### Optimization Tips

1. Increase batch size (if API can handle it)
2. Reduce delay between batches
3. Run during off-peak hours
4. Use parallel batches (advanced)

## Dry Run Mode

Always run a dry run before production import:

```bash
MIGRATION_DRY_RUN=true npm run migration:import
```

**Dry run will:**
- Validate all payloads
- Check for errors
- Generate report
- NOT write to database
- NOT make API calls

**Review the dry run report before proceeding with actual import.**

## Troubleshooting

### Import Fails Immediately

- Check API is running: `curl http://localhost:3000/api/health`
- Verify auth token is valid
- Check network connectivity

### High Failure Rate

- Review error log: `import-errors-{timestamp}.json`
- Check error types (validation vs server)
- Verify validated data is correct

### Slow Performance

- Increase batch size
- Reduce delay between batches
- Check API response times
- Monitor database performance

### Duplicate Imports

- Check idempotency mappings are loaded
- Verify legacy IDs are unique
- Review user email deduplication

## Next Steps

After successful import:

1. Review import summary report
2. Check error log for failures
3. Run verification script (Task 10)
4. Spot-check random recipes in UI
5. Verify user ownership mapping
6. Clean up checkpoint files

## Requirements Covered

This implementation covers the following requirements:

- **7.1-7.7**: Idempotent import with checkpoints
- **8.1-8.7**: Service layer integration with retry logic
- **9.9-9.10**: User migration with email deduplication
- **10.1-10.6**: Dry-run mode
- **11.5**: Comprehensive reporting
- **13.1-13.4**: Error handling and retry logic
