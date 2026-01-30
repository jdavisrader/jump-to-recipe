# Migration Configuration Guide

This document explains how to configure the legacy recipe migration system.

## Configuration Methods

The migration system supports two configuration methods:

1. **Environment Variables** (via `.env.migration` file)
2. **JSON Configuration File** (via `migration-config.json`)

These can be used together, with JSON config taking precedence over environment variables.

## Environment Variables Configuration

### Setup

1. Copy the example file:
   ```bash
   cp .env.migration.example .env.migration
   ```

2. Edit `.env.migration` with your settings

### Required Variables

```bash
# SSH Configuration
SSH_HOST=remote-server.example.com
SSH_PORT=22
SSH_USERNAME=migration_user
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa

# Legacy Database Configuration
LEGACY_DB_HOST=localhost  # localhost when using SSH tunnel
LEGACY_DB_PORT=5432
LEGACY_DB_NAME=legacy_recipes
LEGACY_DB_USER=readonly_user
LEGACY_DB_PASSWORD=secure_password

# New Application API
NEXT_PUBLIC_API_URL=http://localhost:3000
MIGRATION_AUTH_TOKEN=your_admin_token_here
```

### Optional Variables

```bash
# Transformation Settings
MIGRATION_DEFAULT_VISIBILITY=private  # or 'public'
MIGRATION_PRESERVE_TIMESTAMPS=true

# Validation Settings
MIGRATION_STRICT_MODE=false
MIGRATION_DUPLICATE_STRATEGY=keep-first  # or 'keep-all', 'manual-review'

# Import Settings
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=50
MIGRATION_DELAY_BETWEEN_BATCHES=100
MIGRATION_STOP_ON_ERROR=false

# Logging Settings
MIGRATION_LOG_LEVEL=INFO  # DEBUG, INFO, WARN, ERROR
MIGRATION_VERBOSE=false
MIGRATION_OUTPUT_DIR=./migration-data

# Migration User
MIGRATION_USER_EMAIL=migration@example.com
MIGRATION_USER_NAME=Migration User
```

## JSON Configuration File

### Setup

1. Copy the example file:
   ```bash
   cp migration-config.example.json migration-config.json
   ```

2. Edit `migration-config.json` with your settings

### Example Configuration

```json
{
  "ssh": {
    "host": "remote-server.example.com",
    "port": 22,
    "username": "migration_user",
    "privateKeyPath": "~/.ssh/id_rsa"
  },
  "legacyDb": {
    "host": "localhost",
    "port": 5432,
    "database": "legacy_recipes",
    "username": "readonly_user",
    "password": "secure_password"
  },
  "transform": {
    "defaultVisibility": "private",
    "preserveTimestamps": true
  },
  "validation": {
    "strictMode": false,
    "duplicateStrategy": "keep-first"
  },
  "import": {
    "apiBaseUrl": "http://localhost:3000",
    "batchSize": 50,
    "delayBetweenBatches": 100,
    "dryRun": true,
    "stopOnError": false,
    "authToken": ""
  },
  "logging": {
    "level": "INFO",
    "verbose": false,
    "outputDir": "./migration-data"
  },
  "migrationUser": {
    "email": "migration@example.com",
    "name": "Migration User",
    "role": "admin"
  }
}
```

### Using JSON Config

```bash
# Use custom config file
npm run migrate -- all --config migration-config.json

# Or specify full path
npm run migrate -- all --config /path/to/config.json
```

## Configuration Precedence

When both environment variables and JSON config are provided:

1. **JSON config values** take precedence
2. **Environment variables** are used as fallback
3. **Default values** are used if neither is provided

Example:
```bash
# .env.migration
MIGRATION_BATCH_SIZE=50

# migration-config.json
{
  "import": {
    "batchSize": 100
  }
}

# Result: batchSize = 100 (JSON config wins)
```

## Configuration Sections

### SSH Configuration

Controls SSH tunnel connection to remote server hosting legacy database.

```typescript
{
  host: string;        // Remote server hostname or IP
  port: number;        // SSH port (default: 22)
  username: string;    // SSH username
  privateKeyPath: string; // Path to SSH private key
}
```

**Security Notes:**
- Use SSH key-based authentication (not password)
- Ensure private key has restrictive permissions: `chmod 600 ~/.ssh/id_rsa`
- Test SSH connection manually before running migration

### Legacy Database Configuration

Connection details for the legacy PostgreSQL database.

```typescript
{
  host: string;        // Database host (usually 'localhost' via SSH tunnel)
  port: number;        // Database port (default: 5432)
  database: string;    // Database name
  username: string;    // Database username (read-only recommended)
  password: string;    // Database password
}
```

**Security Notes:**
- Use read-only credentials to prevent accidental writes
- Connection is made through SSH tunnel for security

### Transformation Configuration

Controls how legacy data is transformed to new schema.

```typescript
{
  defaultVisibility: 'private' | 'public';  // Default recipe visibility
  preserveTimestamps: boolean;              // Keep original timestamps
}
```

**Options:**
- `defaultVisibility`: Set to 'private' for user recipes, 'public' for shared recipes
- `preserveTimestamps`: Set to true to maintain original created_at/updated_at dates

### Validation Configuration

Controls data quality validation and duplicate detection.

```typescript
{
  strictMode: boolean;                      // Fail on warnings
  duplicateStrategy: 'keep-first' | 'keep-all' | 'manual-review';
}
```

**Duplicate Strategies:**
- `keep-first`: Import only the oldest recipe (by created_at)
- `keep-all`: Import all recipes, flag as potential duplicates
- `manual-review`: Generate report, don't import duplicates

### Import Configuration

Controls how data is imported into the new system.

```typescript
{
  apiBaseUrl: string;           // New application API URL
  batchSize: number;            // Records per batch (1-1000)
  delayBetweenBatches: number;  // Milliseconds between batches
  dryRun: boolean;              // Simulate without writing
  stopOnError: boolean;         // Halt on first error
  authToken: string;            // Admin authentication token
}
```

**Recommendations:**
- Start with `dryRun: true` to test
- Use `batchSize: 50` for balanced performance
- Set `delayBetweenBatches: 100` to avoid rate limiting
- Use `stopOnError: false` to process all records

### Logging Configuration

Controls logging behavior and output location.

```typescript
{
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';  // Log level
  verbose: boolean;                             // Detailed output
  outputDir: string;                            // Output directory
}
```

**Log Levels:**
- `DEBUG`: All messages including debug info
- `INFO`: Normal operation messages (recommended)
- `WARN`: Warnings and errors only
- `ERROR`: Errors only

### Migration User Configuration

Defines the user account for orphaned recipes.

```typescript
{
  email: string;       // Migration user email
  name: string;        // Migration user display name
  role: 'admin';       // User role (must be admin)
}
```

**Purpose:**
- Recipes without valid user mapping are assigned to this user
- Must have admin role to create recipes on behalf of others

## Validation

The configuration is validated before migration starts:

- SSH port must be 1-65535
- Database port must be 1-65535
- Batch size must be 1-1000
- Delay must be non-negative
- API URL must be valid URL format
- All required fields must be present

Validation errors are displayed with clear messages.

## Configuration Summary

Before starting migration, a configuration summary is displayed:

```
=== Migration Configuration ===
SSH Host: remote-server.example.com:22
SSH User: migration_user
Legacy DB: legacy_recipes on localhost:5432
API URL: http://localhost:3000
Batch Size: 50
Dry Run: YES
Stop on Error: NO
Duplicate Strategy: keep-first
Log Level: INFO
Output Directory: ./migration-data
===============================
```

Review this carefully before proceeding.

## Troubleshooting

### Missing Environment Variables

```
Error: Missing required environment variables: SSH_HOST, LEGACY_DB_PASSWORD
```

**Solution:** Ensure all required variables are set in `.env.migration`

### Invalid Configuration File

```
Error: Failed to load config file: Unexpected token in JSON
```

**Solution:** Validate JSON syntax using a JSON validator

### SSH Connection Failed

```
Error: SSH tunnel establishment failed
```

**Solutions:**
- Verify SSH credentials
- Check SSH key permissions: `chmod 600 ~/.ssh/id_rsa`
- Test connection manually: `ssh -i ~/.ssh/id_rsa user@host`
- Check firewall rules

### Database Connection Failed

```
Error: Database connection failed
```

**Solutions:**
- Verify database credentials
- Ensure SSH tunnel is established
- Check PostgreSQL is running on remote server

## Security Best Practices

1. **Never commit configuration files to version control**
   - Add `.env.migration` to `.gitignore`
   - Add `migration-config.json` to `.gitignore`

2. **Use restrictive file permissions**
   ```bash
   chmod 600 .env.migration
   chmod 600 migration-config.json
   chmod 600 ~/.ssh/id_rsa
   ```

3. **Use read-only database credentials**
   - Create a dedicated read-only user for migration
   - Limit access to required tables only

4. **Rotate credentials after migration**
   - Change database passwords
   - Revoke migration user API token
   - Delete exported data files

5. **Use SSH key authentication**
   - Never use password-based SSH authentication
   - Use strong SSH key (RSA 4096 or Ed25519)

## Examples

### Development Environment

```bash
# .env.migration
SSH_HOST=dev-server.local
LEGACY_DB_NAME=recipes_dev
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=10
MIGRATION_LOG_LEVEL=DEBUG
```

### Production Environment

```bash
# .env.migration
SSH_HOST=prod-server.example.com
LEGACY_DB_NAME=recipes_production
MIGRATION_DRY_RUN=false
MIGRATION_BATCH_SIZE=50
MIGRATION_STOP_ON_ERROR=false
MIGRATION_LOG_LEVEL=INFO
```

### Testing with Subset

```json
{
  "import": {
    "batchSize": 5,
    "dryRun": true,
    "stopOnError": true
  },
  "logging": {
    "level": "DEBUG",
    "verbose": true
  }
}
```

## See Also

- [Migration README](./README.md) - Overview and workflow
- [Extraction Guide](./EXTRACTION-GUIDE.md) - SSH tunnel setup
- [CLI Documentation](./cli.ts) - Command-line interface
