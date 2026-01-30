# Migration NPM Scripts Reference

This document describes all available npm scripts for the legacy recipe migration system.

## Quick Start

```bash
# Run the complete migration pipeline
npm run migration:all

# Or run individual phases
npm run migration:extract
npm run migration:transform
npm run migration:validate
npm run migration:import
npm run migration:verify
```

## Core Migration Scripts

### `npm run migration:all`

Runs the complete migration pipeline: Extract → Transform → Validate → Import → Verify

**Usage**:
```bash
# Run full pipeline with default config
npm run migration:all

# Run with custom config file
npm run migration:all -- --config migration-config.json

# Run with dry-run mode
npm run migration:all -- --dry-run

# Run with verbose logging
npm run migration:all -- --verbose
```

**Options**:
- `--config <file>`: Path to custom configuration file
- `--dry-run`: Simulate import without writing to database
- `--verbose`: Enable detailed logging
- `--stop-on-error`: Stop immediately on first error

**When to Use**: 
- First-time migration
- Re-running complete migration after fixes
- Automated migration workflows

**Duration**: 30-45 minutes for 10,000 recipes

---

### `npm run migration:extract`

Extracts data from the legacy database through SSH tunnel.

**Usage**:
```bash
# Extract with default config
npm run migration:extract

# Extract with custom config
npm run migration:extract -- --config migration-config.json

# Extract to specific output directory
npm run migration:extract -- --output ./custom-output
```

**Options**:
- `--config <file>`: Path to custom configuration file
- `--output <dir>`: Custom output directory (default: `./migration-data/raw/{timestamp}`)

**What It Does**:
1. Establishes SSH tunnel to remote server
2. Connects to legacy PostgreSQL database
3. Extracts all tables: users, recipes, ingredients, instructions, tags, recipe_tags
4. Generates export metadata with checksums
5. Closes SSH tunnel

**Output Files**:
- `migration-data/raw/{timestamp}/users.json`
- `migration-data/raw/{timestamp}/recipes.json`
- `migration-data/raw/{timestamp}/ingredients.json`
- `migration-data/raw/{timestamp}/instructions.json`
- `migration-data/raw/{timestamp}/tags.json`
- `migration-data/raw/{timestamp}/recipe_tags.json`
- `migration-data/raw/{timestamp}/export-metadata.json`

**Duration**: 5-10 minutes for 10,000 recipes

---

### `npm run migration:transform`

Transforms both users and recipes from legacy to new schema format.

**Usage**:
```bash
# Transform with default config
npm run migration:transform

# Transform with custom input directory
npm run migration:transform -- --input ./migration-data/raw/2026-01-25-14-30-00

# Transform with custom output directory
npm run migration:transform -- --output ./custom-output
```

**Options**:
- `--input <dir>`: Input directory containing extracted data
- `--output <dir>`: Custom output directory (default: `./migration-data/transformed/{timestamp}`)

**What It Does**:
1. Transforms user data (generates UUIDs, maps fields)
2. Creates user ID mapping table
3. Transforms recipe data (parses ingredients, cleans instructions)
4. Maps legacy user IDs to new UUIDs
5. Generates transformation reports

**Output Files**:
- `migration-data/transformed/{timestamp}/users-normalized.json`
- `migration-data/transformed/{timestamp}/user-mapping.json`
- `migration-data/transformed/{timestamp}/recipes-normalized.json`
- `migration-data/transformed/{timestamp}/transformation-report.json`
- `migration-data/transformed/{timestamp}/unparseable-items.json`

**Duration**: 3-5 minutes for 10,000 recipes

---

### `npm run migration:transform-users`

Transforms only user data (useful for testing or re-running user transformation).

**Usage**:
```bash
# Transform users with default config
npm run migration:transform-users

# Transform with custom input
npm run migration:transform-users -- --input ./migration-data/raw/2026-01-25-14-30-00
```

**Options**:
- `--input <dir>`: Input directory containing `users.json`
- `--output <dir>`: Custom output directory

**Duration**: 1-2 minutes

---

### `npm run migration:transform-recipes`

Transforms only recipe data (useful for testing or re-running recipe transformation).

**Usage**:
```bash
# Transform recipes with default config
npm run migration:transform-recipes

# Transform with custom input
npm run migration:transform-recipes -- --input ./migration-data/raw/2026-01-25-14-30-00
```

**Options**:
- `--input <dir>`: Input directory containing recipe-related JSON files
- `--output <dir>`: Custom output directory

**What It Does**:
1. Loads user mapping table
2. Parses ingredient text into structured format
3. Cleans HTML from instructions
4. Aggregates tags
5. Maps user IDs
6. Generates transformation report

**Duration**: 3-5 minutes for 10,000 recipes

---

### `npm run migration:validate`

Validates transformed data against business rules and detects duplicates.

**Usage**:
```bash
# Validate with default config
npm run migration:validate

# Validate with custom input
npm run migration:validate -- --input ./migration-data/transformed/2026-01-25-14-30-00

# Validate with strict mode
npm run migration:validate -- --strict
```

**Options**:
- `--input <dir>`: Input directory containing transformed data
- `--output <dir>`: Custom output directory
- `--strict`: Treat warnings as failures

**What It Does**:
1. Validates recipes using Zod schemas
2. Classifies recipes as PASS, WARN, or FAIL
3. Detects duplicate recipes
4. Generates validation reports
5. Separates recipes into categorized files

**Output Files**:
- `migration-data/validated/{timestamp}/recipes-valid.json` (PASS)
- `migration-data/validated/{timestamp}/recipes-warnings.json` (WARN)
- `migration-data/validated/{timestamp}/recipes-failed.json` (FAIL)
- `migration-data/validated/{timestamp}/duplicates-report.json`
- `migration-data/validated/{timestamp}/validation-report.json`

**Duration**: 2-3 minutes for 10,000 recipes

---

### `npm run migration:import`

Imports validated data into the new database through API routes.

**Usage**:
```bash
# Import with dry-run (ALWAYS TEST FIRST!)
npm run migration:import -- --dry-run

# Production import (after dry-run succeeds)
npm run migration:import

# Import with custom input
npm run migration:import -- --input ./migration-data/validated/2026-01-25-14-30-00

# Resume interrupted import
npm run migration:import -- --resume
```

**Options**:
- `--input <dir>`: Input directory containing validated data
- `--dry-run`: Simulate import without writing to database
- `--resume`: Resume from last checkpoint
- `--batch-size <n>`: Override batch size
- `--stop-on-error`: Stop on first error

**What It Does**:
1. Imports users (creates if not exists)
2. Imports recipes in batches through API
3. Handles idempotency (skips existing recipes)
4. Implements retry logic for failures
5. Saves progress checkpoints
6. Generates import reports

**Output Files**:
- `migration-data/imported/{timestamp}/import-log.json`
- `migration-data/imported/{timestamp}/import-errors.json`
- `migration-data/imported/{timestamp}/import-summary.json`
- `migration-data/imported/{timestamp}/id-mapping.json`
- `migration-data/progress/{migration-id}.json` (checkpoint)

**Duration**: 20-30 minutes for 10,000 recipes

**IMPORTANT**: Always run with `--dry-run` first!

---

### `npm run migration:verify`

Runs post-migration verification checks to ensure data integrity.

**Usage**:
```bash
# Verify latest migration
npm run migration:verify

# Verify specific migration
npm run migration:verify -- --migration-id 2026-01-25-14-30-00

# Verify with custom checks
npm run migration:verify -- --spot-check-count 50
```

**Options**:
- `--migration-id <id>`: Specific migration to verify
- `--spot-check-count <n>`: Number of random recipes to check (default: 20)

**What It Does**:
1. Compares record counts (legacy vs new)
2. Performs spot-checks on random recipes
3. Validates field population
4. Checks for HTML artifacts
5. Validates ordering preservation
6. Checks tag associations
7. Validates user ownership mapping

**Output Files**:
- `migration-data/imported/{timestamp}/verification-report.json`

**Duration**: 5-10 minutes

---

## Utility Scripts

### `npm run migration:test-connection`

Tests SSH tunnel and database connection.

**Usage**:
```bash
npm run migration:test-connection
```

**What It Does**:
1. Establishes SSH tunnel
2. Connects to legacy database
3. Runs test query
4. Reports connection status

**When to Use**: Before starting migration to verify connectivity

**Duration**: < 1 minute

---

### `npm run migration:validate-config`

Validates migration configuration without running migration.

**Usage**:
```bash
# Validate default config
npm run migration:validate-config

# Validate custom config
npm run migration:validate-config -- --config migration-config.json
```

**What It Does**:
1. Loads configuration from environment and files
2. Validates all required fields present
3. Checks SSH key file exists and has correct permissions
4. Validates database connection parameters
5. Checks output directories can be created
6. Validates value ranges and types

**When to Use**: After setup, before running migration

**Duration**: < 1 minute

---

### `npm run migration:show-config`

Displays current migration configuration (without sensitive data).

**Usage**:
```bash
# Show default config
npm run migration:show-config

# Show custom config
npm run migration:show-config -- --config migration-config.json
```

**What It Does**:
- Displays all configuration values
- Masks sensitive data (passwords, tokens)
- Shows configuration source (env var, file, default)

**When to Use**: To verify configuration before migration

**Duration**: < 1 minute

---

### `npm run migration:report`

Generates comprehensive migration report combining all phases.

**Usage**:
```bash
# Generate report for latest migration
npm run migration:report

# Generate report for specific migration
npm run migration:report -- --migration-id 2026-01-25-14-30-00
```

**What It Does**:
1. Aggregates reports from all phases
2. Generates summary statistics
3. Creates comprehensive HTML/JSON report
4. Includes charts and visualizations

**Output Files**:
- `migration-data/migration-summary.json`
- `migration-data/migration-report.html`

**When to Use**: After migration completes, for documentation

**Duration**: < 1 minute

---

## Build and Test Scripts

### `npm run build:migration`

Compiles TypeScript migration scripts to JavaScript.

**Usage**:
```bash
npm run build:migration
```

**What It Does**:
- Compiles all TypeScript files in `src/migration/`
- Uses `tsconfig.migration.json` configuration
- Outputs to `dist/migration/`

**When to Use**: 
- Before running migration in production
- For deployment to environments without TypeScript

**Duration**: < 1 minute

---

### `npm run test:migration`

Runs unit tests for migration scripts.

**Usage**:
```bash
# Run all migration tests
npm run test:migration

# Run specific test file
npm run test:migration -- user-transformer.test.ts

# Run with coverage
npm run test:migration -- --coverage
```

**What It Does**:
- Runs Jest tests for migration modules
- Tests transformers, validators, parsers
- Generates coverage reports

**When to Use**: During development, before migration

**Duration**: 1-2 minutes

---

## Common Workflows

### First-Time Migration

```bash
# 1. Validate configuration
npm run migration:validate-config

# 2. Test connection
npm run migration:test-connection

# 3. Run extraction
npm run migration:extract

# 4. Run transformation
npm run migration:transform

# 5. Run validation
npm run migration:validate

# 6. Dry-run import (IMPORTANT!)
npm run migration:import -- --dry-run

# 7. Review reports, then production import
npm run migration:import

# 8. Verify migration
npm run migration:verify

# 9. Generate final report
npm run migration:report
```

### Re-running After Fixes

```bash
# If extraction data is still valid, skip to transformation
npm run migration:transform -- --input ./migration-data/raw/2026-01-25-14-30-00
npm run migration:validate
npm run migration:import -- --dry-run
npm run migration:import
npm run migration:verify
```

### Testing Configuration Changes

```bash
# Validate new configuration
npm run migration:validate-config -- --config new-config.json

# Show configuration
npm run migration:show-config -- --config new-config.json

# Test with dry-run
npm run migration:all -- --config new-config.json --dry-run
```

### Debugging Issues

```bash
# Enable debug logging
MIGRATION_LOG_LEVEL=DEBUG npm run migration:extract

# Run individual phases with verbose output
npm run migration:transform -- --verbose

# Check specific transformation
npm run migration:transform-recipes -- --input ./migration-data/raw/2026-01-25-14-30-00
```

## Environment Variables

All scripts respect environment variables from `.env.migration`:

```bash
# Override batch size
MIGRATION_BATCH_SIZE=25 npm run migration:import

# Enable dry-run
MIGRATION_DRY_RUN=true npm run migration:import

# Change log level
MIGRATION_LOG_LEVEL=DEBUG npm run migration:all
```

## Exit Codes

All scripts use standard exit codes:

- `0`: Success
- `1`: General error
- `2`: Configuration error
- `3`: Connection error
- `4`: Validation error
- `5`: Import error

Use in scripts:
```bash
npm run migration:extract
if [ $? -eq 0 ]; then
  echo "Extraction successful"
  npm run migration:transform
fi
```

## Logging

All scripts log to:
- **Console**: Real-time progress
- **File**: `migration-data/logs/{phase}-{timestamp}.log`

Log levels:
- `DEBUG`: Very detailed (use for troubleshooting)
- `INFO`: Standard operational logs
- `WARN`: Warnings and potential issues
- `ERROR`: Errors and failures

## Tips and Best Practices

1. **Always run dry-run first**: Never skip `--dry-run` testing
2. **Check logs**: Review logs after each phase
3. **Validate configuration**: Run `migration:validate-config` before starting
4. **Monitor progress**: Watch log files in real-time with `tail -f`
5. **Save checkpoints**: Import phase saves progress automatically
6. **Review reports**: Check validation and import reports carefully
7. **Test connection**: Run `migration:test-connection` before extraction
8. **Use verbose mode**: Enable `--verbose` for detailed progress
9. **Backup database**: Always backup before production import
10. **Document issues**: Keep notes of any problems encountered

## Troubleshooting

### Script Not Found

**Problem**: `npm run migration:extract` fails with "script not found"

**Solution**: Ensure you're in the `jump-to-recipe` directory:
```bash
cd jump-to-recipe
npm run migration:extract
```

### Permission Denied

**Problem**: Scripts fail with permission errors

**Solution**: Check file permissions:
```bash
chmod 600 .env.migration
chmod 600 ~/.ssh/migration_key
```

### Module Not Found

**Problem**: TypeScript errors about missing modules

**Solution**: Install dependencies:
```bash
npm install
```

### Configuration Not Loaded

**Problem**: Scripts don't use `.env.migration` values

**Solution**: Ensure file is in correct location:
```bash
ls -la .env.migration  # Should be in jump-to-recipe directory
```

## See Also

- [Setup Guide](./SETUP-GUIDE.md) - Initial setup instructions
- [Execution Runbook](./EXECUTION-RUNBOOK.md) - Step-by-step migration process
- [Configuration Reference](./CONFIGURATION.md) - Detailed configuration options
- [CLI Quick Start](./CLI-QUICK-START.md) - Command-line usage examples
