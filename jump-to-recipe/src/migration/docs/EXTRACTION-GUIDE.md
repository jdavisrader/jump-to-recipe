# Legacy Recipe Migration - Extraction Guide

This guide provides detailed instructions for extracting data from the legacy Ruby on Rails recipe database.

## Overview

The extraction script safely exports all recipe and user data from a legacy PostgreSQL database via SSH tunnel. It creates a complete snapshot of the data with checksums and metadata for validation.

## Prerequisites

### 1. SSH Access

You need SSH access to the server hosting the legacy database:

- SSH hostname/IP address
- SSH username
- SSH private key file (typically `~/.ssh/id_rsa`)
- Ensure key permissions: `chmod 600 ~/.ssh/id_rsa`

### 2. Database Credentials

You need read-only credentials for the legacy PostgreSQL database:

- Database hostname (usually `localhost` when using SSH tunnel)
- Database port (default: 5432)
- Database name
- Database username (read-only user recommended)
- Database password

### 3. Software Requirements

- Node.js 18+ installed
- npm packages installed (`npm install` in jump-to-recipe directory)
- Sufficient disk space (~1GB for 10,000 recipes)

## Setup

### Step 1: Create Configuration File

Copy the example configuration file:

```bash
cd jump-to-recipe
cp .env.migration.example .env.migration
```

### Step 2: Edit Configuration

Edit `.env.migration` with your actual credentials:

```bash
# SSH Tunnel Configuration
SSH_HOST=your-server.example.com
SSH_PORT=22
SSH_USERNAME=your_ssh_user
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa

# Legacy Database Configuration
LEGACY_DB_HOST=localhost  # localhost when using SSH tunnel
LEGACY_DB_PORT=5432
LEGACY_DB_NAME=your_legacy_db
LEGACY_DB_USER=readonly_user
LEGACY_DB_PASSWORD=your_password

# Output Directory
MIGRATION_OUTPUT_DIR=./migration-data
```

### Step 3: Test SSH Connection

Before running the extraction, test your SSH connection manually:

```bash
ssh -i ~/.ssh/id_rsa your_ssh_user@your-server.example.com
```

If this works, you're ready to proceed.

### Step 4: Test SSH Tunnel

Test the SSH tunnel with port forwarding:

```bash
ssh -L 5433:localhost:5432 your_ssh_user@your-server.example.com
```

In another terminal, test the database connection:

```bash
psql -h localhost -p 5433 -U readonly_user -d your_legacy_db
```

## Running the Extraction

### Execute the Script

```bash
npm run migration:extract
```

### What Happens

The script will:

1. **Load Configuration**: Read and validate `.env.migration`
2. **Establish SSH Tunnel**: Create secure tunnel to remote server
3. **Connect to Database**: Connect through tunnel in read-only mode
4. **Extract Data**: Export all tables in sequence
5. **Generate Metadata**: Create checksums and metadata files
6. **Cleanup**: Close connections gracefully
7. **Display Summary**: Show extraction results

### Expected Output

```
╔════════════════════════════════════════════════════════════╗
║     Legacy Recipe Migration - Data Extraction Script      ║
╚════════════════════════════════════════════════════════════╝

=== Extraction Configuration ===
SSH Host: your-server.example.com:22
SSH User: your_ssh_user
Legacy DB: your_legacy_db on localhost:5432
Output Directory: ./migration-data
================================

Validating configuration...
✓ Configuration valid

✓ Created output directory: ./migration-data/raw/2026-01-24-14-30-00

=== Step 1: Establishing SSH Tunnel ===

Attempting to establish SSH tunnel (attempt 1/3)...
SSH connection established
SSH tunnel created: localhost:5433 -> localhost:5432
SSH tunnel established and validated successfully

=== Step 2: Connecting to Database ===

Attempting to connect to database (attempt 1/3)...
Database connection established (READ ONLY mode)
Database connected successfully. Version: PostgreSQL 14.5

=== Step 3: Extracting Data ===

Extracting users...
✓ Extracted 150 users
Extracting recipes...
✓ Extracted 1500 recipes
Extracting ingredients...
✓ Extracted 12000 ingredients
Extracting instructions...
✓ Extracted 8000 instructions
Extracting tags...
✓ Extracted 50 tags
Extracting recipe-tag associations...
✓ Extracted 3000 recipe-tag associations

=== Extraction Complete ===
Total time: 8.45s
===========================

=== Step 4: Generating Export Package ===

✓ Saved 150 records to: users.json
✓ Saved 1500 records to: recipes.json
✓ Saved 12000 records to: ingredients.json
✓ Saved 8000 records to: instructions.json
✓ Saved 50 records to: tags.json
✓ Saved 3000 records to: recipe_tags.json

Generating checksums...
✓ users.json: a1b2c3d4e5f6g7h8...
✓ recipes.json: b2c3d4e5f6g7h8i9...
✓ ingredients.json: c3d4e5f6g7h8i9j0...
✓ instructions.json: d4e5f6g7h8i9j0k1...
✓ tags.json: e5f6g7h8i9j0k1l2...
✓ recipe_tags.json: f6g7h8i9j0k1l2m3...

✓ Export metadata saved to: ./migration-data/raw/2026-01-24-14-30-00/export-metadata.json
✓ Manifest file saved to: ./migration-data/raw/2026-01-24-14-30-00/manifest.json
✓ Export log saved to: ./migration-data/raw/2026-01-24-14-30-00/export-log.txt

=== Export Package Complete ===

=== Step 5: Cleanup ===

Closing database connection...
Database connection closed
Closing SSH tunnel...
SSH tunnel closed

╔════════════════════════════════════════════════════════════╗
║           EXTRACTION COMPLETED SUCCESSFULLY                ║
╚════════════════════════════════════════════════════════════╝

📊 Summary:
   Users:        150
   Recipes:      1500
   Ingredients:  12000
   Instructions: 8000
   Tags:         50
   Recipe-Tags:  3000

📁 Output Directory: ./migration-data/raw/2026-01-24-14-30-00

📋 Next Steps:
   1. Review the exported data in the output directory
   2. Check export-metadata.json for checksums and record counts
   3. Run the transformation script: npm run migration:transform
```

## Output Files

After successful extraction, you'll find these files in the output directory:

### Data Files

- **users.json** - All user accounts
- **recipes.json** - All recipe metadata
- **ingredients.json** - All recipe ingredients
- **instructions.json** - All recipe instructions
- **tags.json** - All tag definitions
- **recipe_tags.json** - Recipe-tag associations

### Metadata Files

- **export-metadata.json** - Checksums, record counts, database version
- **manifest.json** - File listing with checksums
- **export-log.txt** - Detailed extraction log

### Example export-metadata.json

```json
{
  "exportTimestamp": "2026-01-24T14:30:00.000Z",
  "legacyDatabaseVersion": "PostgreSQL 14.5",
  "recordCounts": {
    "users": 150,
    "recipes": 1500,
    "ingredients": 12000,
    "instructions": 8000,
    "tags": 50,
    "recipe_tags": 3000
  },
  "checksums": {
    "users.json": "a1b2c3d4e5f6g7h8...",
    "recipes.json": "b2c3d4e5f6g7h8i9...",
    "ingredients.json": "c3d4e5f6g7h8i9j0...",
    "instructions.json": "d4e5f6g7h8i9j0k1...",
    "tags.json": "e5f6g7h8i9j0k1l2...",
    "recipe_tags.json": "f6g7h8i9j0k1l2m3..."
  },
  "outputDirectory": "./migration-data/raw/2026-01-24-14-30-00"
}
```

## Troubleshooting

### SSH Connection Failed

**Error**: `SSH connection failed: connect ECONNREFUSED`

**Solutions**:
1. Verify the SSH host and port are correct
2. Check that the remote server is accessible: `ping your-server.example.com`
3. Ensure firewall rules allow SSH connections
4. Try connecting manually: `ssh -i ~/.ssh/id_rsa user@host`

### SSH Authentication Failed

**Error**: `SSH connection failed: All configured authentication methods failed`

**Solutions**:
1. Verify SSH key path is correct
2. Check key permissions: `chmod 600 ~/.ssh/id_rsa`
3. Ensure the public key is in the remote server's `~/.ssh/authorized_keys`
4. Try using a different key or password authentication

### Database Connection Failed

**Error**: `Failed to connect to database: connect ECONNREFUSED`

**Solutions**:
1. Verify database credentials are correct
2. Check that PostgreSQL is running on the remote server
3. Ensure the database name is correct
4. Verify the database user has SELECT permissions

### Permission Denied

**Error**: `Query execution failed: permission denied for table users`

**Solutions**:
1. Verify the database user has SELECT permissions on all tables
2. Grant read-only access: `GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;`
3. Check that the user can connect to the database

### Configuration Validation Failed

**Error**: `Missing required environment variables: SSH_HOST, LEGACY_DB_NAME`

**Solutions**:
1. Ensure `.env.migration` file exists
2. Verify all required variables are set
3. Check for typos in variable names
4. Ensure no extra spaces around values

### Out of Memory

**Error**: `JavaScript heap out of memory`

**Solutions**:
1. Increase Node.js memory limit: `NODE_OPTIONS=--max-old-space-size=4096 npm run migration:extract`
2. Extract tables individually if needed
3. Ensure sufficient disk space

## Verification

After extraction, verify the data:

### 1. Check Record Counts

```bash
cat migration-data/raw/*/export-metadata.json | grep recordCounts -A 7
```

### 2. Verify Checksums

```bash
cat migration-data/raw/*/manifest.json
```

### 3. Inspect Sample Data

```bash
# View first user
cat migration-data/raw/*/users.json | head -n 20

# View first recipe
cat migration-data/raw/*/recipes.json | head -n 30
```

### 4. Check for Errors

```bash
cat migration-data/raw/*/export-log.txt | grep ERROR
```

## Next Steps

Once extraction is complete and verified:

1. **Review the Data**: Inspect the exported JSON files
2. **Check Metadata**: Verify checksums and record counts
3. **Run Transformation**: `npm run migration:transform`
4. **Continue Pipeline**: Follow the transformation guide

## Security Notes

- The extraction uses **read-only** database connections to prevent accidental writes
- SSH tunnel ensures secure data transfer
- Exported files contain sensitive data (emails, passwords) - store securely
- Delete exported files after migration is complete
- Never commit `.env.migration` or exported data to version control

## Performance

Expected extraction times (approximate):

- 1,000 recipes: ~2-3 minutes
- 10,000 recipes: ~8-10 minutes
- 50,000 recipes: ~30-40 minutes

Factors affecting performance:
- Network latency to remote server
- Database server performance
- Number of ingredients/instructions per recipe
- Disk I/O speed

## Support

If you encounter issues not covered in this guide:

1. Check the extraction log: `migration-data/raw/*/export-log.txt`
2. Review error messages carefully
3. Verify all prerequisites are met
4. Test SSH and database connections manually
5. Consult the main migration README for additional help
