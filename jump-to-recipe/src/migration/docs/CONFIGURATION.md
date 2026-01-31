# Migration Configuration Reference

This document provides detailed information about all configuration options for the legacy recipe migration system.

## Configuration Methods

The migration system supports two configuration methods:

1. **Environment Variables** (`.env.migration` file) - Recommended for sensitive data
2. **JSON Configuration File** (`migration-config.json`) - Recommended for non-sensitive settings

Both methods can be used together. Environment variables take precedence over JSON configuration.

## Configuration Files

### .env.migration

Located in the `jump-to-recipe` directory. Copy from `.env.migration.example`:

```bash
cp .env.migration.example .env.migration
```

**Security**: This file contains sensitive credentials. Never commit to version control!

### migration-config.json

Optional JSON configuration file. Copy from `migration-config.example.json`:

```bash
cp migration-config.example.json migration-config.json
```

Use the `--config` flag to specify a custom config file:

```bash
npm run migration:all -- --config my-custom-config.json
```

## Configuration Options

### SSH Tunnel Configuration

Configures the SSH tunnel for secure database access.

| Option | Env Variable | JSON Path | Type | Required | Default | Description |
|--------|--------------|-----------|------|----------|---------|-------------|
| Host | `SSH_HOST` | `ssh.host` | string | Yes | - | Remote server hostname or IP |
| Port | `SSH_PORT` | `ssh.port` | number | No | 22 | SSH port |
| Username | `SSH_USERNAME` | `ssh.username` | string | Yes | - | SSH username |
| Private Key | `SSH_PRIVATE_KEY_PATH` | `ssh.privateKeyPath` | string | Yes | - | Absolute path to SSH private key |

**Example**:
```bash
SSH_HOST=recipes.example.com
SSH_PORT=22
SSH_USERNAME=migration_user
SSH_PRIVATE_KEY_PATH=/home/user/.ssh/migration_key
```

**Notes**:
- Private key must have restrictive permissions: `chmod 600 ~/.ssh/migration_key`
- Use key-based authentication (not password)
- Test connection before migration: `ssh -i ~/.ssh/migration_key user@host`

### Legacy Database Configuration

Connection settings for the legacy PostgreSQL database.

| Option | Env Variable | JSON Path | Type | Required | Default | Description |
|--------|--------------|-----------|------|----------|---------|-------------|
| Host | `LEGACY_DB_HOST` | `legacyDb.host` | string | Yes | - | Database host (use 'localhost' with SSH tunnel) |
| Port | `LEGACY_DB_PORT` | `legacyDb.port` | number | No | 5432 | PostgreSQL port |
| Database | `LEGACY_DB_NAME` | `legacyDb.database` | string | Yes | - | Database name |
| Username | `LEGACY_DB_USER` | `legacyDb.username` | string | Yes | - | Database username (read-only recommended) |
| Password | `LEGACY_DB_PASSWORD` | `legacyDb.password` | string | Yes | - | Database password |

**Example**:
```bash
LEGACY_DB_HOST=localhost
LEGACY_DB_PORT=5432
LEGACY_DB_NAME=legacy_recipes_production
LEGACY_DB_USER=readonly_user
LEGACY_DB_PASSWORD=secure_password_here
```

**Notes**:
- When using SSH tunnel, always use `localhost` as host
- Use read-only credentials for safety
- Test connection: `psql -h localhost -p 5432 -U readonly_user -d legacy_recipes_production`

### New Database Configuration

Connection string for the new Jump to Recipe database.

| Option | Env Variable | JSON Path | Type | Required | Default | Description |
|--------|--------------|-----------|------|----------|---------|-------------|
| Connection URL | `DATABASE_URL` | - | string | Yes | - | PostgreSQL connection string |

**Example**:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/jump_to_recipe
```

**Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`

### API Configuration

Settings for importing data through the application API.

| Option | Env Variable | JSON Path | Type | Required | Default | Description |
|--------|--------------|-----------|------|----------|---------|-------------|
| Base URL | `NEXT_PUBLIC_API_URL` | `import.apiBaseUrl` | string | Yes | - | Base URL of the API |
| Auth Token | `MIGRATION_AUTH_TOKEN` | `import.authToken` | string | Yes | - | Admin authentication token |

**Example**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
MIGRATION_AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Notes**:
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`
- Generate auth token from admin account
- Revoke token after migration completes

### Transformation Settings

Controls how legacy data is transformed.

| Option | Env Variable | JSON Path | Type | Required | Default | Description |
|--------|--------------|-----------|------|----------|---------|-------------|
| Default Visibility | `MIGRATION_DEFAULT_VISIBILITY` | `transform.defaultVisibility` | string | No | 'private' | Visibility for migrated recipes |
| Preserve Timestamps | - | `transform.preserveTimestamps` | boolean | No | true | Keep original timestamps |

**Default Visibility Options**:
- `private`: Only visible to recipe owner
- `public`: Visible to all users

**Example**:
```bash
MIGRATION_DEFAULT_VISIBILITY=private
```

### Validation Settings

Controls data validation and quality checks.

| Option | Env Variable | JSON Path | Type | Required | Default | Description |
|--------|--------------|-----------|------|----------|---------|-------------|
| Strict Mode | - | `validation.strictMode` | boolean | No | false | Treat warnings as failures |
| Duplicate Strategy | `MIGRATION_DUPLICATE_STRATEGY` | `validation.duplicateStrategy` | string | No | 'keep-first' | How to handle duplicates |

**Duplicate Strategy Options**:
- `keep-first`: Import only the oldest duplicate (by created_at)
- `keep-all`: Import all duplicates with a note
- `manual-review`: Generate report, don't import duplicates

**Example**:
```bash
MIGRATION_DUPLICATE_STRATEGY=keep-first
```

**Notes**:
- Strict mode is more conservative but may reject valid recipes
- `keep-first` is safest for production
- `manual-review` requires manual intervention

### Import Settings

Controls the import phase behavior.

| Option | Env Variable | JSON Path | Type | Required | Default | Description |
|--------|--------------|-----------|------|----------|---------|-------------|
| Batch Size | `MIGRATION_BATCH_SIZE` | `import.batchSize` | number | No | 50 | Recipes per batch |
| Batch Delay | - | `import.delayBetweenBatches` | number | No | 100 | Milliseconds between batches |
| Dry Run | `MIGRATION_DRY_RUN` | `import.dryRun` | boolean | No | true | Simulate without writing |
| Stop on Error | `MIGRATION_STOP_ON_ERROR` | `import.stopOnError` | boolean | No | false | Stop on first error |
| Max Retries | - | `import.maxRetries` | number | No | 3 | Retry attempts for failures |
| Retry Backoff | - | `import.retryBackoff` | number | No | 2 | Exponential backoff multiplier |

**Example**:
```bash
MIGRATION_BATCH_SIZE=50
MIGRATION_DRY_RUN=true
MIGRATION_STOP_ON_ERROR=false
```

**Batch Size Guidelines**:
- Small (10-25): Slower but more resilient, better error isolation
- Medium (25-75): Balanced performance and reliability
- Large (75-150): Faster but may hit rate limits

**Notes**:
- Always test with `dryRun=true` first!
- Set `stopOnError=true` for production imports
- Adjust batch size based on API performance

### Logging Settings

Controls logging output and verbosity.

| Option | Env Variable | JSON Path | Type | Required | Default | Description |
|--------|--------------|-----------|------|----------|---------|-------------|
| Log Level | `MIGRATION_LOG_LEVEL` | `logging.level` | string | No | 'INFO' | Minimum log level |
| Verbose | `MIGRATION_VERBOSE` | `logging.verbose` | boolean | No | false | Detailed progress info |
| Output Dir | `MIGRATION_OUTPUT_DIR` | `logging.outputDir` | string | No | './migration-data' | Base output directory |

**Log Level Options**:
- `DEBUG`: Very detailed logs (use for troubleshooting)
- `INFO`: Standard operational logs (recommended)
- `WARN`: Only warnings and errors
- `ERROR`: Only errors

**Example**:
```bash
MIGRATION_LOG_LEVEL=INFO
MIGRATION_VERBOSE=true
MIGRATION_OUTPUT_DIR=./migration-data
```

**Notes**:
- Use `DEBUG` level when troubleshooting issues
- Verbose mode shows progress bars and detailed statistics
- Output directory will contain subdirectories: raw, transformed, validated, imported, logs, progress

### Migration User Settings

Configuration for the user account that owns orphaned recipes.

| Option | Env Variable | JSON Path | Type | Required | Default | Description |
|--------|--------------|-----------|------|----------|---------|-------------|
| Email | `MIGRATION_USER_EMAIL` | `migrationUser.email` | string | Yes | - | Migration user email |
| Name | `MIGRATION_USER_NAME` | `migrationUser.name` | string | Yes | - | Migration user display name |
| Role | `MIGRATION_USER_ROLE` | `migrationUser.role` | string | No | 'admin' | Migration user role |

**Example**:
```bash
MIGRATION_USER_EMAIL=migration@example.com
MIGRATION_USER_NAME=Migration User
MIGRATION_USER_ROLE=admin
```

**Notes**:
- This user is created if it doesn't exist
- Recipes with no matching user are assigned to this account
- Role should be 'admin' for proper permissions

## Configuration Precedence

When both environment variables and JSON config are provided:

1. **Environment Variables** (highest priority)
2. **JSON Configuration File**
3. **Default Values** (lowest priority)

Example: If `MIGRATION_BATCH_SIZE=100` in `.env.migration` and `"batchSize": 50` in JSON, the value `100` is used.

## Configuration Validation

The migration system validates all configuration before starting:

```bash
npm run migration:validate-config
```

This checks:
- ✅ All required fields are present
- ✅ SSH key file exists and has correct permissions
- ✅ Database connection parameters are valid
- ✅ Output directories can be created
- ✅ Values are within acceptable ranges

## Environment-Specific Configurations

### Development Configuration

For local testing and development:

```bash
# .env.migration
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=10
MIGRATION_STOP_ON_ERROR=false
MIGRATION_LOG_LEVEL=DEBUG
MIGRATION_VERBOSE=true
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Staging Configuration

For pre-production testing:

```bash
# .env.migration
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=25
MIGRATION_STOP_ON_ERROR=true
MIGRATION_LOG_LEVEL=INFO
MIGRATION_VERBOSE=true
NEXT_PUBLIC_API_URL=https://staging.example.com
```

### Production Configuration

For final production import:

```bash
# .env.migration
MIGRATION_DRY_RUN=false
MIGRATION_BATCH_SIZE=50
MIGRATION_STOP_ON_ERROR=true
MIGRATION_LOG_LEVEL=INFO
MIGRATION_VERBOSE=true
MIGRATION_DUPLICATE_STRATEGY=keep-first
NEXT_PUBLIC_API_URL=https://jumptoreceipe.com
```

## Security Best Practices

1. **Never commit configuration files with real credentials**
   ```bash
   # Add to .gitignore
   .env.migration
   migration-config.json
   ```

2. **Use restrictive file permissions**
   ```bash
   chmod 600 .env.migration
   chmod 600 migration-config.json
   chmod 600 ~/.ssh/migration_key
   ```

3. **Use read-only database credentials**
   - Create a dedicated read-only user for legacy database
   - Grant only SELECT permissions

4. **Rotate credentials after migration**
   - Revoke API auth tokens
   - Change database passwords
   - Remove SSH keys from remote server

5. **Delete exported data after migration**
   ```bash
   rm -rf migration-data/raw
   rm -rf migration-data/transformed
   ```

## Troubleshooting Configuration Issues

### "Missing required environment variable"

**Solution**: Check that all required variables are set in `.env.migration`:
```bash
grep -E "^[A-Z_]+=" .env.migration
```

### "Invalid configuration value"

**Solution**: Verify value types and formats:
- Booleans: `true` or `false` (lowercase, no quotes)
- Numbers: No quotes (e.g., `50` not `"50"`)
- Strings: Can have quotes or not

### "SSH key file not found"

**Solution**: Use absolute path for SSH key:
```bash
# Wrong
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa

# Correct
SSH_PRIVATE_KEY_PATH=/home/username/.ssh/id_rsa
```

### "Permission denied" for SSH key

**Solution**: Fix file permissions:
```bash
chmod 600 ~/.ssh/migration_key
ls -la ~/.ssh/migration_key  # Should show -rw-------
```

## See Also

- [Setup Guide](./SETUP-GUIDE.md) - Initial setup instructions
- [Execution Runbook](./EXECUTION-RUNBOOK.md) - Step-by-step migration process
- [CONFIG.md](./CONFIG.md) - Additional configuration details
- [CLI Quick Start](./CLI-QUICK-START.md) - Command-line usage
