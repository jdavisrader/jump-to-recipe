# Extraction Module

This module handles the extraction of legacy recipe data from a remote PostgreSQL database via SSH tunnel.

## Overview

The extraction phase is the first step in the ETVI (Extract-Transform-Validate-Import) pipeline. It safely exports all recipe-related data from the legacy database to JSON files for further processing.

## Features

- **SSH Tunnel Support**: Securely connects to remote databases via SSH
- **Read-Only Mode**: Uses read-only transactions to prevent accidental writes
- **Progress Tracking**: Displays extraction progress for each table
- **Data Integrity**: Generates SHA-256 checksums for all exported files
- **Comprehensive Metadata**: Creates detailed export metadata and manifest files
- **Error Handling**: Graceful error handling with automatic cleanup

## Files

- `extract-legacy-data.ts` - Main orchestrator script
- `table-extractors.ts` - Individual table extraction functions
- `metadata-generator.ts` - Checksum and metadata generation
- `index.ts` - Module exports

## Usage

### Prerequisites

1. SSH access to the remote server hosting the legacy database
2. SSH private key with appropriate permissions (`chmod 600 ~/.ssh/id_rsa`)
3. Read-only database credentials
4. `.env.migration` file configured (see `.env.migration.example`)

### Running the Extraction

```bash
# From the jump-to-recipe directory
npm run migration:extract
```

### Configuration

The extraction script reads configuration from `.env.migration`:

```bash
# SSH Configuration
SSH_HOST=remote-server.example.com
SSH_PORT=22
SSH_USERNAME=migration_user
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa

# Database Configuration
LEGACY_DB_HOST=localhost  # localhost when using SSH tunnel
LEGACY_DB_PORT=5432
LEGACY_DB_NAME=legacy_recipes
LEGACY_DB_USER=readonly_user
LEGACY_DB_PASSWORD=secure_password

# Output Directory
MIGRATION_OUTPUT_DIR=./migration-data
```

## Output Structure

The extraction creates a timestamped directory with the following structure:

```
migration-data/raw/2026-01-24-14-30-00/
├── users.json              # Exported user records
├── recipes.json            # Exported recipe records
├── ingredients.json        # Exported ingredient records
├── instructions.json       # Exported instruction records
├── tags.json              # Exported tag records
├── recipe_tags.json       # Exported recipe-tag associations
├── export-metadata.json   # Metadata with checksums and counts
├── manifest.json          # File manifest with checksums
└── export-log.txt         # Detailed extraction log
```

## Extracted Tables

1. **users** - User accounts with authentication data
2. **recipes** - Recipe metadata (name, times, servings, etc.)
3. **ingredients** - Recipe ingredients (unstructured text)
4. **instructions** - Recipe instructions (may contain HTML)
5. **tags** - Tag definitions
6. **recipe_tags** - Recipe-tag associations (many-to-many)

## Data Integrity

The extraction process ensures data integrity through:

- **Checksums**: SHA-256 checksums for all exported files
- **Metadata**: Record counts and database version information
- **Manifest**: Complete file listing with checksums
- **Logs**: Detailed extraction log for auditing

## Error Handling

The script handles errors gracefully:

- **SSH Connection Errors**: Retries up to 3 times with exponential backoff
- **Database Errors**: Retries up to 3 times with exponential backoff
- **Cleanup**: Automatically closes connections even on error
- **Troubleshooting**: Provides helpful error messages and tips

## Next Steps

After successful extraction:

1. Review the exported data in the output directory
2. Check `export-metadata.json` for checksums and record counts
3. Verify the extraction log for any warnings
4. Run the transformation script: `npm run migration:transform`

## Troubleshooting

### SSH Connection Failed

- Verify SSH credentials and key permissions (`chmod 600 ~/.ssh/id_rsa`)
- Check that the remote server is accessible
- Ensure firewall rules allow SSH connections

### Database Connection Failed

- Verify database credentials
- Check that PostgreSQL is running on the remote server
- Ensure the database name is correct

### Permission Denied

- Verify the database user has SELECT permissions on all tables
- Check that the SSH user has access to the database server

### Configuration Errors

- Ensure `.env.migration` file exists and is properly formatted
- Verify all required environment variables are set
- Check that paths are correct (especially SSH key path)
