# Verification Module Usage Guide

This guide provides step-by-step instructions for running post-migration verification.

## Quick Start

```bash
# Run verification (from migration root)
ts-node src/migration/verify/verify-example.ts 4
```

## Prerequisites

1. **Completed Import**: Import phase must be complete
2. **Database Access**: Read-only access to both databases
3. **Mapping Files**: Import mapping files must exist
4. **SSH Access**: (Optional) If legacy DB is remote

## Step-by-Step Guide

### Step 1: Prepare Configuration

Create a verification config file or use environment variables:

```typescript
const config: VerificationConfig = {
  legacyDb: {
    host: process.env.LEGACY_DB_HOST || 'localhost',
    port: parseInt(process.env.LEGACY_DB_PORT || '5432'),
    database: process.env.LEGACY_DB_NAME || 'legacy_recipes',
    username: process.env.LEGACY_DB_USER || 'readonly_user',
    password: process.env.LEGACY_DB_PASSWORD || '',
  },
  newDb: {
    host: process.env.NEW_DB_HOST || 'localhost',
    port: parseInt(process.env.NEW_DB_PORT || '5432'),
    database: process.env.NEW_DB_NAME || 'jump_to_recipe',
    username: process.env.NEW_DB_USER || 'readonly_user',
    password: process.env.NEW_DB_PASSWORD || '',
  },
  ssh: process.env.SSH_HOST ? {
    host: process.env.SSH_HOST,
    port: parseInt(process.env.SSH_PORT || '22'),
    username: process.env.SSH_USERNAME || '',
    privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH || '~/.ssh/id_rsa',
  } : undefined,
  spotCheckCount: 20,
  importedDataDir: 'migration-data/imported',
};
```

### Step 2: Run Verification

```typescript
import { runVerification } from './verify/post-migration-verification';

const result = await runVerification(config);
```

### Step 3: Generate Reports

```typescript
import { generateVerificationReport } from './verify/verification-report-generator';

await generateVerificationReport(result, 'migration-data/verified');
```

### Step 4: Generate Comprehensive Report

```typescript
import { generateComprehensiveReport } from './verify/comprehensive-report-generator';

await generateComprehensiveReport({
  migrationDataDir: 'migration-data',
  outputDir: 'migration-data/reports',
  includeDetailedReports: true,
});
```

### Step 5: Review Results

Check the generated reports:

```bash
# Executive summary
cat migration-data/reports/executive-summary.txt

# Verification summary
cat migration-data/verified/verification-summary.txt

# Detailed reports
ls -la migration-data/verified/
ls -la migration-data/reports/
```

## Configuration Options

### Verification Config

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `legacyDb` | DatabaseConfig | Yes | Legacy database connection |
| `newDb` | DatabaseConfig | Yes | New database connection |
| `ssh` | SSHConfig | No | SSH tunnel configuration |
| `spotCheckCount` | number | Yes | Number of random recipes to check |
| `importedDataDir` | string | Yes | Directory with import mappings |

### Database Config

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `host` | string | Yes | Database host |
| `port` | number | Yes | Database port |
| `database` | string | Yes | Database name |
| `username` | string | Yes | Database username |
| `password` | string | Yes | Database password |

### SSH Config

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `host` | string | Yes | SSH server host |
| `port` | number | Yes | SSH server port (default: 22) |
| `username` | string | Yes | SSH username |
| `privateKeyPath` | string | Yes | Path to SSH private key |

## Verification Checks

### 1. Record Count Comparison

Compares the number of records in each table:

```
✓ users: Legacy=150, New=150 (100% match)
✓ recipes: Legacy=1500, New=1485 (99% match)
```

**Status:**
- `match`: ≥99% match
- `warning`: 90-99% match
- `mismatch`: <90% match

### 2. Spot Checks

Randomly samples recipes and validates:
- Title matches
- Ingredient count matches
- Instruction count matches
- Author is mapped
- Tags are preserved
- No HTML artifacts
- No encoding issues

**Example:**
```
✓ Recipe 123: Chocolate Chip Cookies (0 issues)
✗ Recipe 456: Pasta Carbonara (2 issues)
  - Ingredient count mismatch: 8 vs 7
  - HTML artifacts found in instructions
```

### 3. Field Population

Validates that required fields are populated:

```
✓ title: 100% populated (required)
✓ ingredients: 100% populated (required)
✓ instructions: 100% populated (required)
✓ author_id: 100% populated (required)
⚠️  description: 75% populated (optional)
⚠️  image_url: 45% populated (optional)
```

### 4. HTML/Encoding Artifacts

Detects HTML tags and encoding issues:

```
Found 12 recipes with artifacts
  High: 2, Medium: 5, Low: 5
```

**Common artifacts:**
- HTML tags: `<p>`, `<br>`, `<div>`
- HTML entities: `&nbsp;`, `&quot;`, `&amp;`
- Encoding issues: `â€™`, `Ã©`, `Ã¨`

### 5. Ordering Preservation

Validates that ingredient and instruction order is preserved:

```
18/20 ordering checks passed
```

### 6. Tag Associations

Validates that recipe tags are preserved:

```
17/20 recipes have all tags preserved
```

### 7. User Ownership

Validates that recipe ownership is correctly mapped:

```
20/20 recipes have correct ownership mapping
```

## Understanding Results

### Overall Status

- **PASS**: All checks passed, migration successful
- **WARNING**: Some warnings, but acceptable
- **FAIL**: Critical issues found, do not deploy

### Check Status

- **✓ Pass**: Check passed
- **⚠️  Warning**: Minor issues, review recommended
- **✗ Fail**: Critical failure, must fix

## Common Issues

### Issue: Record Count Mismatch

**Cause:** Some recipes failed validation or import

**Solution:**
1. Review validation report
2. Check import error log
3. Fix transformation logic if needed
4. Re-run migration

### Issue: HTML Artifacts

**Cause:** HTML cleaning didn't remove all tags

**Solution:**
1. Review HTML artifact report
2. Update instruction cleaner
3. Re-run transformation phase

### Issue: Encoding Issues

**Cause:** Character encoding problems

**Solution:**
1. Check database encoding settings
2. Update transformation to handle encoding
3. Re-run transformation phase

### Issue: Ordering Not Preserved

**Cause:** Sorting logic issue

**Solution:**
1. Review transformation code
2. Verify order_number/step_number sorting
3. Re-run transformation phase

### Issue: Missing Tags

**Cause:** Tag join or mapping issue

**Solution:**
1. Review tag transformation logic
2. Check recipe_tags join
3. Re-run transformation phase

### Issue: Ownership Mapping Failed

**Cause:** User mapping incomplete

**Solution:**
1. Review user mapping file
2. Ensure all users were imported
3. Re-run user import if needed

## Next Steps

### If Status is PASS

1. ✓ Review comprehensive report
2. ✓ Perform final manual spot checks
3. ✓ Back up production database
4. ✓ Deploy migrated data to production
5. ✓ Monitor application for issues

### If Status is WARNING

1. ⚠️  Review warnings in detail
2. ⚠️  Decide if warnings are acceptable
3. ⚠️  Address critical warnings
4. ⚠️  Proceed with caution

### If Status is FAIL

1. ✗ Review critical issues
2. ✗ Fix transformation/import logic
3. ✗ Re-run migration pipeline
4. ✗ DO NOT deploy to production

## Advanced Usage

### Custom Spot Check Count

```typescript
const config = {
  // ... other config
  spotCheckCount: 100, // Check more recipes
};
```

### Verify Specific Recipes

```typescript
// Modify spot check logic to target specific recipes
const targetRecipes = [123, 456, 789];
// Implementation in post-migration-verification.ts
```

### Generate Reports Only

If verification already ran:

```typescript
// Load existing verification result
const result = JSON.parse(
  await fs.readFile('migration-data/verified/verification-report.json', 'utf-8')
);

// Generate new reports
await generateVerificationReport(result, 'migration-data/verified-new');
```

## Troubleshooting

### Connection Errors

```
Error: Failed to connect to database
```

**Solution:**
- Check database credentials
- Verify network connectivity
- Test SSH tunnel manually
- Check firewall rules

### Missing Mapping Files

```
Error: ENOENT: no such file or directory 'recipe-id-mapping.json'
```

**Solution:**
- Ensure import phase completed
- Check importedDataDir path
- Verify mapping files exist

### Out of Memory

```
Error: JavaScript heap out of memory
```

**Solution:**
- Reduce spotCheckCount
- Process in smaller batches
- Increase Node.js memory limit:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" ts-node verify-example.ts
  ```

## Best Practices

1. **Always verify after import**: Don't skip this step
2. **Review all reports**: Not just the summary
3. **Save reports**: Keep for audit trail
4. **Test with sample first**: Verify with small dataset
5. **Use read-only credentials**: Prevent accidental writes
6. **Check SSH tunnel**: Ensure stable connection
7. **Monitor performance**: Large datasets may take time
8. **Address warnings**: Even if status is "pass"

## Support

For issues or questions:
1. Check this guide
2. Review README.md
3. Check example files
4. Review error logs
