# Legacy Recipe Migration - Execution Runbook

This runbook provides step-by-step instructions for executing the legacy recipe migration. Follow these steps carefully to ensure a successful migration.

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Phase 1: Extraction](#phase-1-extraction)
3. [Phase 2: Transformation](#phase-2-transformation)
4. [Phase 3: Validation](#phase-3-validation)
5. [Phase 4: Dry-Run Import](#phase-4-dry-run-import)
6. [Phase 5: Production Import](#phase-5-production-import)
7. [Phase 6: Verification](#phase-6-verification)
8. [Post-Migration Tasks](#post-migration-tasks)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

## Pre-Migration Checklist

Complete these tasks before starting the migration:

### Setup Verification

- [ ] Node.js 18+ installed and verified (`node --version`)
- [ ] All dependencies installed (`npm install`)
- [ ] SSH key configured and tested
- [ ] `.env.migration` file created and populated
- [ ] Configuration validated (`npm run migration:validate-config`)
- [ ] SSH connection tested manually
- [ ] Database connection tested through SSH tunnel
- [ ] Sufficient disk space available (at least 2GB)

### Backup and Safety

- [ ] **CRITICAL**: Database backup created and verified
  ```bash
  # Create backup
  pg_dump -h localhost -U postgres jump_to_recipe > backup_$(date +%Y%m%d_%H%M%S).sql
  
  # Verify backup
  ls -lh backup_*.sql
  ```
- [ ] Backup stored in secure location
- [ ] Rollback procedure documented and understood
- [ ] Migration user account created in new system
- [ ] Admin authentication token generated

### Team Communication

- [ ] Migration scheduled with team
- [ ] Stakeholders notified of migration window
- [ ] Maintenance mode enabled (if applicable)
- [ ] Monitoring alerts configured

### Documentation Review

- [ ] [Setup Guide](./SETUP-GUIDE.md) completed
- [ ] [Configuration Reference](./CONFIGURATION.md) reviewed
- [ ] This runbook read in full
- [ ] Emergency contacts documented

## Phase 1: Extraction

Extract data from the legacy database through SSH tunnel.

### Step 1.1: Verify Configuration

```bash
cd jump-to-recipe

# Display configuration (without sensitive data)
npm run migration:show-config
```

**Expected Output**: Configuration summary with all settings

### Step 1.2: Test SSH Connection

```bash
# Test SSH connection manually
ssh -i ~/.ssh/migration_key user@remote-server.example.com "echo 'Connection successful'"
```

**Expected Output**: `Connection successful`

**If Failed**: See [Troubleshooting SSH](#troubleshooting-ssh-connection)

### Step 1.3: Run Extraction

```bash
# Extract all data from legacy database
npm run migration:extract

# Or with custom config
npm run migration:extract -- --config migration-config.json
```

**Expected Duration**: 5-10 minutes for 10,000 recipes

**Expected Output**:
```
[INFO] Starting extraction phase...
[INFO] Establishing SSH tunnel to remote-server.example.com:22
[INFO] SSH tunnel established successfully
[INFO] Connecting to legacy database...
[INFO] Database connection successful
[INFO] Extracting users... 150/150 (100%)
[INFO] Extracting recipes... 10000/10000 (100%)
[INFO] Extracting ingredients... 45000/45000 (100%)
[INFO] Extracting instructions... 38000/38000 (100%)
[INFO] Extracting tags... 250/250 (100%)
[INFO] Extracting recipe_tags... 15000/15000 (100%)
[INFO] Generating export metadata...
[INFO] Extraction complete!
[INFO] Output directory: migration-data/raw/2026-01-25-14-30-00
```

### Step 1.4: Verify Extraction

```bash
# Check extracted files
ls -lh migration-data/raw/*/

# View extraction metadata
cat migration-data/raw/*/export-metadata.json | jq .
```

**Verification Checklist**:
- [ ] All expected JSON files created (users, recipes, ingredients, instructions, tags, recipe_tags)
- [ ] File sizes are reasonable (not empty, not corrupted)
- [ ] Record counts match expectations
- [ ] Export metadata contains checksums
- [ ] No error messages in extraction log

**If Issues Found**: See [Troubleshooting Extraction](#troubleshooting-extraction)

## Phase 2: Transformation

Transform legacy data to new schema format.

### Step 2.1: Transform Users

```bash
# Transform user data
npm run migration:transform-users

# Or specify input directory
npm run migration:transform-users -- --input migration-data/raw/2026-01-25-14-30-00
```

**Expected Duration**: 1-2 minutes

**Expected Output**:
```
[INFO] Starting user transformation...
[INFO] Loading legacy users from migration-data/raw/2026-01-25-14-30-00/users.json
[INFO] Transforming 150 users...
[INFO] Generating user ID mapping...
[INFO] Transformation complete!
[INFO] Success: 150 users
[INFO] Errors: 0
[INFO] Output: migration-data/transformed/2026-01-25-14-30-00/users-normalized.json
```

### Step 2.2: Transform Recipes

```bash
# Transform recipe data
npm run migration:transform-recipes

# Or specify input directory
npm run migration:transform-recipes -- --input migration-data/raw/2026-01-25-14-30-00
```

**Expected Duration**: 3-5 minutes for 10,000 recipes

**Expected Output**:
```
[INFO] Starting recipe transformation...
[INFO] Loading legacy data...
[INFO] Transforming 10000 recipes...
[INFO] Parsing ingredients... 45000/45000 (100%)
[INFO] Cleaning instructions... 38000/38000 (100%)
[INFO] Mapping user IDs...
[INFO] Aggregating tags...
[INFO] Transformation complete!
[INFO] Success: 9850 recipes
[INFO] Parse warnings: 150 recipes
[INFO] Errors: 0
[INFO] Output: migration-data/transformed/2026-01-25-14-30-00/recipes-normalized.json
```

### Step 2.3: Review Transformation Report

```bash
# View transformation report
cat migration-data/transformed/*/transformation-report.json | jq .

# Check unparseable items
cat migration-data/transformed/*/unparseable-items.json | jq .
```

**Verification Checklist**:
- [ ] Transformation success rate > 95%
- [ ] User mapping table created
- [ ] Recipe count matches extraction
- [ ] Unparseable items reviewed (if any)
- [ ] No critical errors in transformation log

**If Issues Found**: See [Troubleshooting Transformation](#troubleshooting-transformation)

## Phase 3: Validation

Validate transformed data against business rules.

### Step 3.1: Run Validation

```bash
# Validate all transformed data
npm run migration:validate

# Or specify input directory
npm run migration:validate -- --input migration-data/transformed/2026-01-25-14-30-00
```

**Expected Duration**: 2-3 minutes for 10,000 recipes

**Expected Output**:
```
[INFO] Starting validation phase...
[INFO] Loading transformed recipes...
[INFO] Validating 9850 recipes...
[INFO] Running duplicate detection...
[INFO] Validation complete!
[INFO] PASS: 9500 recipes (96.4%)
[INFO] WARN: 300 recipes (3.0%)
[INFO] FAIL: 50 recipes (0.5%)
[INFO] Duplicates found: 25 groups (50 recipes)
[INFO] Output: migration-data/validated/2026-01-25-14-30-00/
```

### Step 3.2: Review Validation Report

```bash
# View validation summary
cat migration-data/validated/*/validation-report.json | jq .

# Check failed recipes
cat migration-data/validated/*/recipes-failed.json | jq '.[] | {id, title, errors}'

# Check warnings
cat migration-data/validated/*/recipes-warnings.json | jq '.[] | {id, title, warnings}'

# Check duplicates
cat migration-data/validated/*/duplicates-report.json | jq .
```

### Step 3.3: Review and Decide

**Decision Points**:

1. **Failed Recipes** (FAIL status):
   - Review reasons for failure
   - Decide: Fix in legacy system and re-run, or exclude from migration
   - Document excluded recipes

2. **Warning Recipes** (WARN status):
   - Review warnings (usually missing optional fields)
   - Decide: Import with warnings, or fix and re-run
   - Most warnings are acceptable

3. **Duplicate Recipes**:
   - Review duplicate groups
   - Verify duplicate strategy is appropriate
   - Consider manual review for high-value recipes

**Verification Checklist**:
- [ ] FAIL rate < 1% (or acceptable for your use case)
- [ ] WARN rate < 5% (or acceptable)
- [ ] Duplicate strategy appropriate
- [ ] Failed recipes documented
- [ ] Decision made on warnings

**If Validation Issues**: See [Troubleshooting Validation](#troubleshooting-validation)

## Phase 4: Dry-Run Import

Test the import process without writing to the database.

### Step 4.1: Verify Dry-Run Configuration

```bash
# Ensure dry-run is enabled
grep MIGRATION_DRY_RUN .env.migration
```

**Expected Output**: `MIGRATION_DRY_RUN=true`

**CRITICAL**: Never skip dry-run testing!

### Step 4.2: Run Dry-Run Import

```bash
# Import with dry-run mode
npm run migration:import -- --dry-run

# Or specify input directory
npm run migration:import -- --dry-run --input migration-data/validated/2026-01-25-14-30-00
```

**Expected Duration**: 5-10 minutes for 10,000 recipes

**Expected Output**:
```
[INFO] Starting import phase (DRY RUN MODE)...
[INFO] Loading validated recipes...
[INFO] Importing users... 150/150 (100%)
[INFO] Importing recipes in batches of 50...
[INFO] Batch 1/190: 50 recipes (DRY RUN - not actually imported)
[INFO] Batch 2/190: 50 recipes (DRY RUN - not actually imported)
...
[INFO] Dry-run import complete!
[INFO] Would import: 9500 recipes
[INFO] Would skip (duplicates): 50 recipes
[INFO] Would fail: 0 recipes
[INFO] Estimated duration: 25 minutes
```

### Step 4.3: Review Dry-Run Report

```bash
# View dry-run report
cat migration-data/imported/*/import-summary.json | jq .

# Check what would be imported
cat migration-data/imported/*/dry-run-report.json | jq .
```

**Verification Checklist**:
- [ ] Expected number of recipes would be imported
- [ ] No unexpected failures
- [ ] Duplicate handling working as expected
- [ ] API validation passing
- [ ] Estimated duration acceptable

**If Dry-Run Issues**: See [Troubleshooting Import](#troubleshooting-import)

### Step 4.4: Spot-Check Dry-Run Data

```bash
# View sample recipes that would be imported
cat migration-data/validated/*/recipes-valid.json | jq '.[0:5]'
```

**Manual Review**:
- [ ] Recipe titles look correct
- [ ] Ingredients parsed properly
- [ ] Instructions formatted correctly
- [ ] User ownership mapped correctly
- [ ] Timestamps preserved (if configured)

## Phase 5: Production Import

Perform the actual import to the database.

### Step 5.1: Final Pre-Import Checklist

**STOP**: Do not proceed unless ALL items are checked:

- [ ] Database backup created and verified
- [ ] Dry-run completed successfully
- [ ] Validation reports reviewed and approved
- [ ] Team notified of import start
- [ ] Maintenance mode enabled (if applicable)
- [ ] Rollback procedure ready
- [ ] Monitoring in place

### Step 5.2: Disable Dry-Run Mode

```bash
# Edit .env.migration
# Change: MIGRATION_DRY_RUN=true
# To:     MIGRATION_DRY_RUN=false

# Verify change
grep MIGRATION_DRY_RUN .env.migration
```

**Expected Output**: `MIGRATION_DRY_RUN=false`

### Step 5.3: Run Production Import

```bash
# Start production import
npm run migration:import

# Or with custom config
npm run migration:import -- --config migration-config.json
```

**Expected Duration**: 20-30 minutes for 10,000 recipes

**Expected Output**:
```
[INFO] Starting import phase (PRODUCTION MODE)...
[WARN] Dry-run is DISABLED - will write to database!
[INFO] Loading validated recipes...
[INFO] Importing users... 150/150 (100%)
[INFO] Importing recipes in batches of 50...
[INFO] Batch 1/190: 50/50 recipes imported successfully
[INFO] Batch 2/190: 50/50 recipes imported successfully
[INFO] Batch 3/190: 48/50 recipes imported (2 skipped - duplicates)
...
[INFO] Import complete!
[INFO] Imported: 9500 recipes
[INFO] Skipped: 50 recipes (duplicates)
[INFO] Failed: 0 recipes
[INFO] Duration: 24 minutes
```

### Step 5.4: Monitor Import Progress

**In Another Terminal**:
```bash
# Watch import progress
watch -n 5 'tail -n 20 migration-data/logs/import-*.log'

# Check database record count
psql -h localhost -U postgres jump_to_recipe -c "SELECT COUNT(*) FROM recipes;"
```

### Step 5.5: Handle Import Errors

If errors occur during import:

1. **Review Error Log**:
   ```bash
   cat migration-data/imported/*/import-errors.json | jq .
   ```

2. **Categorize Errors**:
   - Network errors: Retry automatically (handled by system)
   - Validation errors: Review and fix data
   - API errors: Check API logs

3. **Resume Import** (if interrupted):
   ```bash
   # Import will resume from last checkpoint
   npm run migration:import -- --resume
   ```

## Phase 6: Verification

Verify the migration was successful.

### Step 6.1: Run Verification Script

```bash
# Run post-migration verification
npm run migration:verify

# Or specify migration ID
npm run migration:verify -- --migration-id 2026-01-25-14-30-00
```

**Expected Duration**: 5-10 minutes

**Expected Output**:
```
[INFO] Starting post-migration verification...
[INFO] Comparing record counts...
[INFO] ✓ Users: Legacy=150, New=150 (100%)
[INFO] ✓ Recipes: Legacy=10000, New=9500 (95% - expected due to duplicates/failures)
[INFO] Performing spot-checks on 20 random recipes...
[INFO] ✓ Recipe #1234: All fields valid
[INFO] ✓ Recipe #5678: All fields valid
...
[INFO] Checking for HTML artifacts...
[INFO] ✓ No HTML artifacts found
[INFO] Validating ordering preservation...
[INFO] ✓ Ingredient ordering preserved
[INFO] ✓ Instruction ordering preserved
[INFO] Verification complete!
[INFO] Overall status: PASS
```

### Step 6.2: Manual Verification

Perform manual spot-checks in the application:

**User Interface Checks**:
- [ ] Log in as migrated user
- [ ] View "My Recipes" page
- [ ] Open 5-10 random recipes
- [ ] Verify recipe details display correctly
- [ ] Check ingredient formatting
- [ ] Check instruction formatting
- [ ] Verify images (if migrated)
- [ ] Test recipe search
- [ ] Test recipe editing

**Database Checks**:
```bash
# Check record counts
psql -h localhost -U postgres jump_to_recipe << EOF
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL
SELECT 'recipes', COUNT(*) FROM recipes
UNION ALL
SELECT 'recipe with ingredients', COUNT(*) FROM recipes WHERE jsonb_array_length(ingredients) > 0
UNION ALL
SELECT 'recipe with instructions', COUNT(*) FROM recipes WHERE jsonb_array_length(instructions) > 0;
EOF

# Check sample recipe
psql -h localhost -U postgres jump_to_recipe -c "SELECT id, title, jsonb_array_length(ingredients) as ingredient_count, jsonb_array_length(instructions) as instruction_count FROM recipes LIMIT 5;"
```

### Step 6.3: Review Verification Report

```bash
# View comprehensive verification report
cat migration-data/imported/*/verification-report.json | jq .
```

**Verification Checklist**:
- [ ] Record counts match expectations
- [ ] Spot-checks pass
- [ ] No HTML artifacts in text fields
- [ ] Ordering preserved
- [ ] User ownership correct
- [ ] Tags associated correctly
- [ ] Timestamps preserved (if configured)
- [ ] No data corruption detected

**If Verification Fails**: See [Rollback Procedures](#rollback-procedures)

## Post-Migration Tasks

Complete these tasks after successful migration.

### Step 7.1: Generate Final Reports

```bash
# Generate comprehensive migration report
npm run migration:report

# View summary
cat migration-data/migration-summary.json | jq .
```

### Step 7.2: Archive Migration Data

```bash
# Create archive
tar -czf migration-archive-$(date +%Y%m%d).tar.gz migration-data/

# Move to secure storage
mv migration-archive-*.tar.gz /path/to/secure/storage/

# Optional: Delete raw data (keep reports)
rm -rf migration-data/raw
rm -rf migration-data/transformed
```

### Step 7.3: Security Cleanup

```bash
# Revoke migration auth token (in application)
# Delete or rotate credentials
# Remove SSH key from remote server (if temporary)

# Secure configuration files
chmod 600 .env.migration
chmod 600 migration-config.json
```

### Step 7.4: Update Documentation

- [ ] Document migration completion date
- [ ] Record final statistics
- [ ] Note any issues encountered
- [ ] Update user documentation
- [ ] Archive migration logs

### Step 7.5: Team Communication

- [ ] Notify team of migration completion
- [ ] Disable maintenance mode
- [ ] Update status page
- [ ] Send completion report to stakeholders

### Step 7.6: Monitoring

- [ ] Monitor application performance
- [ ] Watch for user-reported issues
- [ ] Check error logs for anomalies
- [ ] Verify search indexing (if applicable)

## Rollback Procedures

If critical issues are discovered after migration.

### When to Rollback

Rollback if:
- Data corruption detected
- Critical functionality broken
- Unacceptable data quality issues
- User-reported critical bugs

### Rollback Steps

**IMPORTANT**: Only rollback if absolutely necessary. Consult with team first.

#### Step 1: Stop Application

```bash
# Stop the application
npm run stop
# or
docker-compose down
```

#### Step 2: Restore Database Backup

```bash
# Drop current database (DESTRUCTIVE!)
psql -h localhost -U postgres -c "DROP DATABASE jump_to_recipe;"

# Recreate database
psql -h localhost -U postgres -c "CREATE DATABASE jump_to_recipe;"

# Restore from backup
psql -h localhost -U postgres jump_to_recipe < backup_20260125_143000.sql

# Verify restoration
psql -h localhost -U postgres jump_to_recipe -c "SELECT COUNT(*) FROM recipes;"
```

#### Step 3: Restart Application

```bash
# Restart application
npm run start
# or
docker-compose up -d
```

#### Step 4: Verify Rollback

- [ ] Application starts successfully
- [ ] Database record counts match pre-migration
- [ ] Spot-check functionality
- [ ] Verify no data loss

#### Step 5: Document Rollback

- [ ] Document rollback reason
- [ ] Record rollback timestamp
- [ ] Note issues encountered
- [ ] Plan remediation steps

### Partial Rollback

If only specific recipes are problematic:

```bash
# Delete specific recipes
psql -h localhost -U postgres jump_to_recipe << EOF
DELETE FROM recipes WHERE "createdAt" >= '2026-01-25 14:30:00';
EOF
```

**Note**: This only works if you can identify migrated recipes by timestamp or other criteria.

## Troubleshooting

### Troubleshooting SSH Connection

**Problem**: Cannot establish SSH tunnel

**Solutions**:
1. Verify SSH key permissions: `chmod 600 ~/.ssh/migration_key`
2. Test SSH connection: `ssh -i ~/.ssh/migration_key user@host`
3. Check firewall rules
4. Verify SSH service running on remote server
5. Check SSH logs: `sudo tail -f /var/log/auth.log`

### Troubleshooting Extraction

**Problem**: Extraction fails or times out

**Solutions**:
1. Check database connection through tunnel
2. Verify read permissions on legacy database
3. Check disk space: `df -h`
4. Reduce batch size if memory issues
5. Check network stability

### Troubleshooting Transformation

**Problem**: High number of parse failures

**Solutions**:
1. Review unparseable items: `cat migration-data/transformed/*/unparseable-items.json`
2. Check ingredient format in legacy data
3. Update parser rules if needed
4. Consider manual review for critical recipes

### Troubleshooting Validation

**Problem**: High failure rate

**Solutions**:
1. Review validation errors: `cat migration-data/validated/*/recipes-failed.json`
2. Check if validation rules too strict
3. Fix data in legacy system if possible
4. Consider excluding problematic recipes

### Troubleshooting Import

**Problem**: Import fails or is very slow

**Solutions**:
1. Check API logs for errors
2. Verify authentication token valid
3. Reduce batch size: `MIGRATION_BATCH_SIZE=25`
4. Check network latency
5. Verify database performance
6. Resume from checkpoint: `npm run migration:import -- --resume`

### Getting Help

If issues persist:

1. Check logs: `migration-data/logs/`
2. Enable debug logging: `MIGRATION_LOG_LEVEL=DEBUG`
3. Review error reports in `migration-data/imported/*/import-errors.json`
4. Contact development team with:
   - Error messages
   - Log files
   - Configuration (without sensitive data)
   - Steps to reproduce

## Appendix: Quick Reference

### Common Commands

```bash
# Full migration pipeline
npm run migration:all

# Individual phases
npm run migration:extract
npm run migration:transform
npm run migration:validate
npm run migration:import
npm run migration:verify

# With custom config
npm run migration:all -- --config my-config.json

# Dry-run
npm run migration:import -- --dry-run

# Resume interrupted import
npm run migration:import -- --resume

# Validate configuration
npm run migration:validate-config
```

### File Locations

- Configuration: `.env.migration`, `migration-config.json`
- Extracted data: `migration-data/raw/{timestamp}/`
- Transformed data: `migration-data/transformed/{timestamp}/`
- Validated data: `migration-data/validated/{timestamp}/`
- Import results: `migration-data/imported/{timestamp}/`
- Logs: `migration-data/logs/`
- Progress: `migration-data/progress/`

### Important Files

- `export-metadata.json`: Extraction summary
- `transformation-report.json`: Transformation statistics
- `validation-report.json`: Validation results
- `import-summary.json`: Import results
- `verification-report.json`: Verification results
- `import-errors.json`: Failed imports
- `duplicates-report.json`: Duplicate recipes

## Success Criteria

Migration is considered successful when:

- ✅ All phases complete without critical errors
- ✅ Record counts match expectations (accounting for duplicates/failures)
- ✅ Verification checks pass
- ✅ Manual spot-checks confirm data quality
- ✅ No user-reported critical issues within 24 hours
- ✅ Application performance acceptable
- ✅ All documentation updated
