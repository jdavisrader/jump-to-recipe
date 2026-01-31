# Import Phase Usage Guide

This guide provides step-by-step instructions for using the import phase of the legacy recipe migration system.

## Prerequisites

Before running the import phase:

1. ✅ Extraction phase completed
2. ✅ Transformation phase completed
3. ✅ Validation phase completed
4. ✅ API server is running
5. ✅ Admin auth token obtained
6. ✅ Environment variables configured

## Quick Start

### 1. Configure Environment

Create or update `.env.migration`:

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

### 2. Run Dry Run (Recommended)

Always test with a dry run first:

```bash
MIGRATION_DRY_RUN=true npm run migration:import
```

Review the dry run report:
```bash
cat migration-data/imported/dry-run-report-*.json
```

### 3. Run Actual Import

If dry run looks good, run the actual import:

```bash
npm run migration:import
```

### 4. Monitor Progress

The import will display real-time progress:

```
📦 Importing 1500 recipes in batches of 50...

  Batch 1/30 (50 recipes)...
  ✓ Batch complete: 48 success, 2 failed (2341ms)

📊 Progress Summary:
  Phase: import
  Progress: 50/1500 (3%)
  Succeeded: 48
  Failed: 2
  Estimated time remaining: 25m 30s
```

### 5. Review Results

After completion, review the reports:

```bash
# Summary
cat migration-data/imported/import-summary-*.json

# Errors (if any)
cat migration-data/imported/import-errors-*.md

# ID Mappings
cat migration-data/imported/recipe-id-mapping.csv
```

## Common Scenarios

### Scenario 1: First-Time Import

```bash
# 1. Run dry run
MIGRATION_DRY_RUN=true npm run migration:import

# 2. Review dry run report
cat migration-data/imported/dry-run-report-*.json

# 3. Run actual import
npm run migration:import

# 4. Review results
cat migration-data/imported/import-summary-*.json
```

### Scenario 2: Resume After Interruption

If the import was interrupted, simply re-run:

```bash
npm run migration:import
```

The system will:
- Load the last checkpoint
- Skip already imported items
- Continue from where it left off

### Scenario 3: Import Specific Validated Data

```bash
npm run migration:import -- migration-data/validated/2026-01-23-14-30-00
```

### Scenario 4: Stop on First Error

```bash
MIGRATION_STOP_ON_ERROR=true npm run migration:import
```

### Scenario 5: Smaller Batches (Slower but Safer)

```bash
MIGRATION_BATCH_SIZE=10 npm run migration:import
```

### Scenario 6: Re-import After Fixes

If you need to re-import after fixing issues:

```bash
# 1. Clear existing mappings (CAUTION!)
rm migration-data/imported/recipe-id-mapping.json
rm migration-data/imported/user-id-mapping.json

# 2. Run import again
npm run migration:import
```

## Configuration Options

### Batch Size

Controls how many recipes are imported per batch:

```bash
MIGRATION_BATCH_SIZE=50  # Default
MIGRATION_BATCH_SIZE=25  # Smaller batches (slower, more checkpoints)
MIGRATION_BATCH_SIZE=100 # Larger batches (faster, fewer checkpoints)
```

**Recommendation**: Start with 50, adjust based on API performance.

### Delay Between Batches

Controls delay between batches (in milliseconds):

```bash
MIGRATION_DELAY_MS=100  # Default
MIGRATION_DELAY_MS=0    # No delay (faster, may hit rate limits)
MIGRATION_DELAY_MS=500  # Longer delay (slower, safer)
```

**Recommendation**: Use 100ms for local, 500ms for production.

### Retry Configuration

Controls retry behavior for failed requests:

```bash
MIGRATION_MAX_RETRIES=3           # Default: 3 attempts
MIGRATION_RETRY_BACKOFF_MS=1000   # Default: 1 second initial backoff
```

Backoff is exponential: 1s, 2s, 4s

### Stop on Error

Controls whether to stop on first error:

```bash
MIGRATION_STOP_ON_ERROR=false  # Default: continue on errors
MIGRATION_STOP_ON_ERROR=true   # Stop on first error
```

**Recommendation**: Use `false` for production, `true` for debugging.

## Understanding Output

### Console Output

```
📦 Importing 1500 recipes in batches of 50...

  Batch 1/30 (50 recipes)...
  ✓ Batch complete: 48 success, 2 failed (2341ms)

📊 Progress Summary:
  Phase: import
  Progress: 50/1500 (3%)
  Succeeded: 48
  Failed: 2
  Warned: 0
  Skipped: 0
  Batch: 1/30
  Estimated time remaining: 25m 30s
  Last checkpoint: 2026-01-23T14:35:22.123Z
```

### Output Files

#### Summary Report (`import-summary-*.json`)

```json
{
  "timestamp": "2026-01-23T14:35:22.123Z",
  "recipes": {
    "total": 1500,
    "succeeded": 1450,
    "failed": 50,
    "successRate": 96.67
  },
  "users": {
    "total": 100,
    "succeeded": 98,
    "failed": 2,
    "successRate": 98
  }
}
```

#### Error Log (`import-errors-*.json`)

```json
{
  "recipes": [
    {
      "legacyId": 123,
      "error": "Title is required",
      "errorType": "validation",
      "retryCount": 0
    }
  ]
}
```

#### ID Mappings (`recipe-id-mapping.csv`)

```csv
legacy_id,new_uuid,title,migrated,migrated_at
1,550e8400-e29b-41d4-a716-446655440000,"Chocolate Cake",true,2026-01-23T14:35:22.123Z
2,550e8400-e29b-41d4-a716-446655440001,"Apple Pie",true,2026-01-23T14:35:23.456Z
```

## Troubleshooting

### Problem: Import fails immediately

**Symptoms:**
```
❌ Import phase failed: Error: connect ECONNREFUSED
```

**Solutions:**
1. Check API is running: `curl http://localhost:3000/api/health`
2. Verify `NEXT_PUBLIC_API_URL` is correct
3. Check network connectivity

### Problem: High failure rate

**Symptoms:**
```
✗ Failed: 500/1500 (33%)
```

**Solutions:**
1. Review error log: `cat migration-data/imported/import-errors-*.md`
2. Check error types (validation vs server)
3. Verify validated data is correct
4. Run dry run to identify issues

### Problem: Slow performance

**Symptoms:**
```
Estimated time remaining: 2h 30m
```

**Solutions:**
1. Increase batch size: `MIGRATION_BATCH_SIZE=100`
2. Reduce delay: `MIGRATION_DELAY_MS=50`
3. Check API response times
4. Monitor database performance

### Problem: Duplicate imports

**Symptoms:**
```
Error: Recipe already exists
```

**Solutions:**
1. Check idempotency mappings are loaded
2. Verify legacy IDs are unique
3. Review user email deduplication
4. Check for concurrent imports

### Problem: Out of memory

**Symptoms:**
```
JavaScript heap out of memory
```

**Solutions:**
1. Reduce batch size: `MIGRATION_BATCH_SIZE=25`
2. Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096`
3. Process in smaller chunks

### Problem: Authentication errors

**Symptoms:**
```
Error: 401 Unauthorized
```

**Solutions:**
1. Verify auth token is valid
2. Check token hasn't expired
3. Ensure migration user has admin role
4. Regenerate token if needed

## Best Practices

### 1. Always Run Dry Run First

```bash
MIGRATION_DRY_RUN=true npm run migration:import
```

### 2. Start with Small Batch

Test with a small batch first:

```bash
# Edit validated data to include only 10 recipes
MIGRATION_BATCH_SIZE=5 npm run migration:import
```

### 3. Monitor Progress

Keep an eye on:
- Success rate (should be >95%)
- Error types (validation vs server)
- Performance (records/second)
- Memory usage

### 4. Review Errors Immediately

Don't wait until the end:

```bash
# In another terminal, watch errors
watch -n 5 'cat migration-data/imported/import-errors-*.md'
```

### 5. Backup Before Production

```bash
# Backup database before production import
pg_dump jump_to_recipe > backup-before-import.sql
```

### 6. Use Checkpoints

Let the import run uninterrupted. If it fails, checkpoints allow resumption.

### 7. Verify After Import

Run verification script (Task 10) after import:

```bash
npm run migration:verify
```

## Performance Tuning

### For Local Development

```bash
MIGRATION_BATCH_SIZE=25
MIGRATION_DELAY_MS=50
MIGRATION_MAX_RETRIES=2
```

### For Production

```bash
MIGRATION_BATCH_SIZE=50
MIGRATION_DELAY_MS=100
MIGRATION_MAX_RETRIES=3
MIGRATION_STOP_ON_ERROR=false
```

### For Large Datasets (>10k recipes)

```bash
MIGRATION_BATCH_SIZE=100
MIGRATION_DELAY_MS=50
MIGRATION_MAX_RETRIES=3
NODE_OPTIONS=--max-old-space-size=4096
```

## Next Steps

After successful import:

1. ✅ Review import summary
2. ✅ Check error log
3. ✅ Verify ID mappings
4. ✅ Run verification script
5. ✅ Spot-check recipes in UI
6. ✅ Test user login
7. ✅ Clean up checkpoint files
8. ✅ Archive migration data

## Getting Help

If you encounter issues:

1. Check this guide
2. Review error logs
3. Check API logs
4. Review database logs
5. Consult design document
6. Ask for help with specific error messages
