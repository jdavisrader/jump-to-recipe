# Migration CLI Quick Start Guide

## Prerequisites

1. **SSH Access**: Ensure you have SSH access to the remote server
   ```bash
   ssh -i ~/.ssh/id_rsa user@remote-server.example.com
   ```

2. **Configuration**: Create `.env.migration` file
   ```bash
   cp .env.migration.example .env.migration
   # Edit with your settings
   ```

3. **Verify Configuration**: Check that all required variables are set
   ```bash
   cat .env.migration
   ```

## Quick Start

### Option 1: Run Complete Pipeline

```bash
# Dry run first (recommended)
npm run migrate -- all --dry-run

# Run for real
npm run migrate -- all
```

### Option 2: Run Phase by Phase

```bash
# Step 1: Extract data from legacy database
npm run migrate -- extract

# Step 2: Transform extracted data
npm run migrate -- transform

# Step 3: Validate transformed data
npm run migrate -- validate

# Step 4: Import validated data (dry run first)
npm run migrate -- import --dry-run

# Step 5: Import for real
npm run migrate -- import
```

## Common Commands

### Get Help
```bash
npm run migrate -- --help
```

### Run with Custom Config
```bash
npm run migrate -- all --config production-config.json
```

### Specify Input Directory
```bash
npm run migrate -- transform --input-dir migration-data/raw/2026-01-23-14-30-00
```

### Dry Run Import
```bash
npm run migrate -- import --dry-run
```

## Workflow

```
┌─────────────┐
│   EXTRACT   │  Extract data from legacy DB via SSH tunnel
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  TRANSFORM  │  Transform users and recipes to new schema
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  VALIDATE   │  Validate data quality, detect duplicates
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   IMPORT    │  Import via API with batching and retry
└─────────────┘
```

## Output Locations

After each phase, check the output:

```bash
# Extraction output
ls -la migration-data/raw/

# Transformation output
ls -la migration-data/transformed/

# Validation output
ls -la migration-data/validated/

# Import output
ls -la migration-data/imported/
```

## Review Reports

```bash
# Extraction metadata
cat migration-data/raw/*/export-metadata.json

# Transformation report
cat migration-data/transformed/*/transformation-report.json

# Validation report
cat migration-data/validated/*/validation-report.json

# Import report
cat migration-data/imported/*/import-report.json

# Final summary
cat migration-data/imported/*/migration-summary.json
```

## Troubleshooting

### SSH Connection Failed
```bash
# Check SSH key permissions
chmod 600 ~/.ssh/id_rsa

# Test SSH connection
ssh -i ~/.ssh/id_rsa user@remote-server.example.com

# Verify SSH config in .env.migration
grep SSH_ .env.migration
```

### Database Connection Failed
```bash
# Verify database credentials
grep LEGACY_DB_ .env.migration

# Check if PostgreSQL is running on remote server
ssh user@remote-server.example.com "pg_isready"
```

### Configuration Errors
```bash
# Check for missing variables
npm run migrate -- extract

# Review configuration
cat .env.migration
```

### Import Errors
```bash
# Check API is running
curl http://localhost:3000/api/health

# Verify auth token
grep MIGRATION_AUTH_TOKEN .env.migration

# Review import errors
cat migration-data/imported/*/import-errors.json
```

## Best Practices

1. **Always start with dry run**
   ```bash
   npm run migrate -- import --dry-run
   ```

2. **Test with small batch first**
   ```bash
   # In .env.migration
   MIGRATION_BATCH_SIZE=5
   ```

3. **Review reports after each phase**
   ```bash
   cat migration-data/*/*/report.json
   ```

4. **Keep backups**
   ```bash
   # Backup database before import
   pg_dump new_database > backup.sql
   ```

5. **Monitor progress**
   ```bash
   # Watch logs in real-time
   tail -f migration-data/logs/*.log
   ```

## Configuration Tips

### Development Environment
```bash
# .env.migration
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=10
MIGRATION_LOG_LEVEL=DEBUG
MIGRATION_STOP_ON_ERROR=true
```

### Production Environment
```bash
# .env.migration
MIGRATION_DRY_RUN=false
MIGRATION_BATCH_SIZE=50
MIGRATION_LOG_LEVEL=INFO
MIGRATION_STOP_ON_ERROR=false
```

### Testing Subset
```bash
# .env.migration
MIGRATION_BATCH_SIZE=5
MIGRATION_STOP_ON_ERROR=true
```

## Advanced Usage

### Resume from Checkpoint
```bash
# If import was interrupted, it will automatically resume
npm run migrate -- import
```

### Custom Config File
```bash
# Create custom config
cp migration-config.example.json my-config.json

# Edit my-config.json

# Use custom config
npm run migrate -- all --config my-config.json
```

### Override Dry Run
```bash
# Override .env.migration setting
npm run migrate -- import --dry-run
```

## Verification

After migration completes:

1. **Check record counts**
   ```bash
   # Compare with legacy database
   cat migration-data/imported/*/migration-summary.json
   ```

2. **Spot check recipes**
   ```bash
   # Open new application and verify random recipes
   ```

3. **Review errors**
   ```bash
   # Check for any failed imports
   cat migration-data/imported/*/import-errors.json
   ```

4. **Verify duplicates**
   ```bash
   # Review duplicate detection results
   cat migration-data/validated/*/duplicates-report.json
   ```

## Getting Help

- **CLI Help**: `npm run migrate -- --help`
- **Configuration Guide**: `src/migration/CONFIG.md`
- **Full Documentation**: `src/migration/README.md`
- **Implementation Details**: `src/migration/TASK-9-IMPLEMENTATION.md`

## Example Session

```bash
# 1. Setup
cp .env.migration.example .env.migration
vim .env.migration  # Edit with your settings

# 2. Test SSH connection
ssh -i ~/.ssh/id_rsa user@remote-server.example.com

# 3. Run dry run
npm run migrate -- all --dry-run

# 4. Review dry run results
cat migration-data/imported/*/dry-run-report.json

# 5. Run for real
npm run migrate -- all

# 6. Review final summary
cat migration-data/imported/*/migration-summary.json

# 7. Verify in application
# Open browser and check recipes
```

## Success Indicators

✅ All phases complete without errors
✅ Record counts match expectations
✅ No critical validation failures
✅ Import success rate > 95%
✅ Recipes visible in new application
✅ User ownership preserved
✅ Timestamps preserved

## Next Steps After Migration

1. **Verify Data**: Spot check recipes in new application
2. **Clean Up**: Delete exported JSON files
3. **Rotate Credentials**: Change database passwords
4. **Revoke Tokens**: Revoke migration user API token
5. **Document**: Record migration date and statistics
6. **Monitor**: Watch for any issues in production

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review error logs in `migration-data/logs/`
3. Check phase-specific reports
4. Verify configuration in `.env.migration`
5. Test SSH and database connections manually
