# Legacy Recipe Migration

This directory contains scripts and utilities for migrating recipe data from the legacy Ruby on Rails application to the new Jump to Recipe Next.js application.

## Directory Structure

```
src/migration/
├── extract/          # Data extraction scripts (SSH tunnel + PostgreSQL)
├── transform/        # Data transformation and normalization
├── validate/         # Data quality validation
├── import/           # Import to new database via API
├── utils/            # Shared utilities (logging, retry, etc.)
├── types/            # TypeScript type definitions
└── README.md         # This file
```

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.migration.example .env.migration
   ```

2. Edit `.env.migration` with your SSH and database credentials

3. Ensure you have SSH access to the remote server:
   ```bash
   ssh -i ~/.ssh/id_rsa user@remote-server.example.com
   ```

4. Install dependencies (already done if you ran npm install):
   ```bash
   npm install
   ```

## Migration Pipeline

The migration follows a four-phase Extract-Transform-Validate-Import (ETVI) pipeline:

### 1. Extract
Connects to the legacy database via SSH tunnel and exports data to JSON files.

```bash
npm run migration:extract
```

Output: `migration-data/raw/{timestamp}/`

### 2. Transform
Transforms legacy relational data into the new JSONB-based schema.

```bash
npm run migration:transform
```

Output: `migration-data/transformed/{timestamp}/`

### 3. Validate
Validates transformed data against business rules and detects duplicates.

```bash
npm run migration:validate
```

Output: `migration-data/validated/{timestamp}/`

### 4. Import
Imports validated data via API routes with batching and retry logic.

```bash
npm run migration:import
```

Output: `migration-data/imported/{timestamp}/`

## Dry Run Mode

Always test with dry-run mode first:

```bash
MIGRATION_DRY_RUN=true npm run migration:import
```

## Configuration

All configuration is managed via environment variables in `.env.migration`. See `.env.migration.example` for all available options.

Key settings:
- `MIGRATION_DRY_RUN`: Test without writing to database
- `MIGRATION_BATCH_SIZE`: Number of records per batch (default: 50)
- `MIGRATION_STOP_ON_ERROR`: Halt on first error vs continue
- `MIGRATION_DUPLICATE_STRATEGY`: How to handle duplicates

## Output Data

All migration data is stored in `migration-data/`:
- `raw/`: Extracted JSON files from legacy database
- `transformed/`: Normalized data ready for validation
- `validated/`: Quality-checked data ready for import
- `imported/`: Import logs and ID mappings
- `logs/`: Detailed logs for each phase
- `progress/`: Checkpoint files for resumption

## Requirements

- Node.js 18+
- SSH access to legacy database server
- Read-only credentials for legacy database
- Admin access to new application API

## Security Notes

- Use SSH key-based authentication (not password)
- Ensure SSH private key has restrictive permissions: `chmod 600 ~/.ssh/id_rsa`
- Use read-only credentials for legacy database
- Store `.env.migration` securely and never commit to version control
- Delete exported JSON files after migration completes

## Troubleshooting

### SSH Connection Issues
- Verify SSH key permissions: `ls -la ~/.ssh/id_rsa`
- Test SSH connection manually: `ssh -i ~/.ssh/id_rsa user@host`
- Check firewall rules allow SSH access

### Database Connection Issues
- Verify SSH tunnel is established
- Check database credentials
- Ensure PostgreSQL is running on remote server

### Import Failures
- Check API authentication token
- Verify API is running and accessible
- Review import logs in `migration-data/logs/`

## Development

To compile TypeScript migration scripts:

```bash
npm run build:migration
```

To run tests:

```bash
npm run test:migration
```
