# Legacy Recipe Migration - Setup Guide

This guide walks you through setting up your environment to run the legacy recipe migration system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [SSH Key Setup](#ssh-key-setup)
3. [Environment Variable Configuration](#environment-variable-configuration)
4. [Installation](#installation)
5. [Configuration Validation](#configuration-validation)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting the migration, ensure you have:

### Software Requirements

- **Node.js**: Version 18.0.0 or higher
  ```bash
  node --version  # Should be >= 18.0.0
  ```

- **npm**: Version 8.0.0 or higher
  ```bash
  npm --version
  ```

- **TypeScript**: Installed globally or via project dependencies
  ```bash
  npx tsc --version
  ```

### Access Requirements

- **SSH Access**: Credentials to connect to the remote server hosting the legacy database
- **Database Credentials**: Read-only PostgreSQL credentials for the legacy database
- **API Access**: Admin credentials for the new Jump to Recipe application
- **Disk Space**: At least 2GB free space for exported data and logs

### Network Requirements

- Outbound SSH access (port 22) to the remote server
- Firewall rules allowing SSH connections
- Stable internet connection for API calls during import

## SSH Key Setup

The migration uses SSH key-based authentication for secure, password-less connections to the remote server.

### 1. Check for Existing SSH Keys

```bash
ls -la ~/.ssh
```

Look for files like `id_rsa`, `id_ed25519`, or `id_ecdsa` (private keys) and their `.pub` counterparts (public keys).

### 2. Generate a New SSH Key (if needed)

If you don't have an SSH key or want to create a dedicated one for migration:

```bash
# Generate ED25519 key (recommended)
ssh-keygen -t ed25519 -C "migration@jumptoreceipe" -f ~/.ssh/migration_key

# Or generate RSA key (if ED25519 not supported)
ssh-keygen -t rsa -b 4096 -C "migration@jumptoreceipe" -f ~/.ssh/migration_key
```

**Important**: When prompted for a passphrase, you can either:
- Leave it empty for automated scripts (less secure)
- Set a passphrase and use `ssh-agent` to cache it (more secure)

### 3. Set Correct Permissions

SSH keys must have restrictive permissions:

```bash
chmod 600 ~/.ssh/migration_key
chmod 644 ~/.ssh/migration_key.pub
```

### 4. Copy Public Key to Remote Server

You need to add your public key to the remote server's `authorized_keys` file:

**Option A: Using ssh-copy-id (easiest)**
```bash
ssh-copy-id -i ~/.ssh/migration_key.pub user@remote-server.example.com
```

**Option B: Manual copy**
```bash
# Display your public key
cat ~/.ssh/migration_key.pub

# SSH into the remote server (using password)
ssh user@remote-server.example.com

# On the remote server, add the key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

### 5. Test SSH Connection

Verify you can connect without a password:

```bash
ssh -i ~/.ssh/migration_key user@remote-server.example.com

# If successful, you should get a shell prompt
# Type 'exit' to disconnect
```

### 6. Using SSH Agent (Optional, for passphrase-protected keys)

If you set a passphrase on your key:

```bash
# Start ssh-agent
eval "$(ssh-agent -s)"

# Add your key (you'll be prompted for the passphrase once)
ssh-add ~/.ssh/migration_key

# Verify the key is loaded
ssh-add -l
```

## Environment Variable Configuration

The migration system uses environment variables for configuration. You'll create a `.env.migration` file in the `jump-to-recipe` directory.

### 1. Copy the Example File

```bash
cd jump-to-recipe
cp .env.migration.example .env.migration
```

### 2. Edit Configuration Values

Open `.env.migration` in your text editor and fill in the values:

```bash
# SSH Tunnel Configuration
SSH_HOST=remote-server.example.com
SSH_PORT=22
SSH_USERNAME=your_ssh_username
SSH_PRIVATE_KEY_PATH=/Users/yourname/.ssh/migration_key

# Legacy Database Configuration (accessed via SSH tunnel)
# Note: Use 'localhost' as the host when using SSH tunnel
LEGACY_DB_HOST=localhost
LEGACY_DB_PORT=5432
LEGACY_DB_NAME=legacy_recipes_production
LEGACY_DB_USER=readonly_user
LEGACY_DB_PASSWORD=your_secure_password

# New Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/jump_to_recipe

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
MIGRATION_AUTH_TOKEN=your_admin_auth_token

# Migration Settings
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=50
MIGRATION_STOP_ON_ERROR=false
MIGRATION_DUPLICATE_STRATEGY=keep-first
MIGRATION_VERBOSE=true

# Output Directory
MIGRATION_OUTPUT_DIR=./migration-data
```

### 3. Configuration Details

#### SSH Configuration

- **SSH_HOST**: The hostname or IP address of the remote server
- **SSH_PORT**: SSH port (usually 22)
- **SSH_USERNAME**: Your SSH username on the remote server
- **SSH_PRIVATE_KEY_PATH**: Absolute path to your SSH private key file

#### Legacy Database Configuration

- **LEGACY_DB_HOST**: Use `localhost` when connecting through SSH tunnel
- **LEGACY_DB_PORT**: PostgreSQL port (usually 5432)
- **LEGACY_DB_NAME**: Name of the legacy database
- **LEGACY_DB_USER**: Database username (should be read-only)
- **LEGACY_DB_PASSWORD**: Database password

#### Migration Settings

- **MIGRATION_DRY_RUN**: Set to `true` for testing, `false` for actual import
- **MIGRATION_BATCH_SIZE**: Number of recipes to import per batch (default: 50)
- **MIGRATION_STOP_ON_ERROR**: Stop on first error (`true`) or continue (`false`)
- **MIGRATION_DUPLICATE_STRATEGY**: How to handle duplicates (`keep-first`, `keep-all`, `manual-review`)
- **MIGRATION_VERBOSE**: Enable detailed logging (`true` or `false`)

### 4. Secure Your Configuration

**Important**: Never commit `.env.migration` to version control!

```bash
# Verify it's in .gitignore
grep ".env.migration" .gitignore

# If not, add it
echo ".env.migration" >> .gitignore
```

Set restrictive permissions:

```bash
chmod 600 .env.migration
```

## Installation

### 1. Install Project Dependencies

```bash
cd jump-to-recipe
npm install
```

### 2. Install Migration-Specific Dependencies

The migration system requires additional packages:

```bash
npm install --save-dev ssh2 html-to-text
```

### 3. Verify TypeScript Configuration

Ensure the migration TypeScript config exists:

```bash
ls -la tsconfig.migration.json
```

If it doesn't exist, it should be created as part of the migration setup.

### 4. Build Migration Scripts

Compile the TypeScript migration scripts:

```bash
npm run build:migration
```

Or if using the CLI directly:

```bash
npx tsc --project tsconfig.migration.json
```

## Configuration Validation

Before running the migration, validate your configuration:

### 1. Test SSH Connection

```bash
ssh -i ~/.ssh/migration_key user@remote-server.example.com "echo 'SSH connection successful'"
```

Expected output: `SSH connection successful`

### 2. Test SSH Tunnel

Manually create an SSH tunnel to verify it works:

```bash
# Open tunnel (keep this terminal open)
ssh -L 5433:localhost:5432 -i ~/.ssh/migration_key jordanpi@192.168.86.248

# In another terminal, test the connection
psql -h localhost -p 5433 -U happeacookprod -d happeacookprod -c "SELECT COUNT(*) FROM recipes;"
```

If successful, you should see a count of recipes.

### 3. Validate Configuration File

Run the configuration validator:

```bash
npm run migration:validate-config
```

This will check:
- All required environment variables are set
- SSH key file exists and has correct permissions
- Database connection parameters are valid
- Output directories can be created

### 4. Test Database Connection Through Migration Script

Run a test extraction with a limit:

```bash
npm run migration:test-connection
```

This performs a minimal extraction to verify the full connection chain works.

## Troubleshooting

### SSH Connection Issues

#### Problem: "Permission denied (publickey)"

**Cause**: SSH key not properly configured or not authorized on remote server.

**Solutions**:
1. Verify key permissions: `ls -la ~/.ssh/migration_key` (should be `-rw-------`)
2. Check if key is added to remote server: `ssh -i ~/.ssh/migration_key user@remote-server.example.com`
3. Verify the public key is in `~/.ssh/authorized_keys` on the remote server
4. Check SSH logs on remote server: `sudo tail -f /var/log/auth.log`

#### Problem: "Connection refused" or "Connection timed out"

**Cause**: Network connectivity issues or firewall blocking SSH.

**Solutions**:
1. Verify the host is reachable: `ping remote-server.example.com`
2. Check if SSH port is open: `telnet remote-server.example.com 22`
3. Verify firewall rules allow outbound SSH connections
4. Try connecting from a different network
5. Contact your network administrator

#### Problem: "Host key verification failed"

**Cause**: Remote server's host key has changed or not in known_hosts.

**Solutions**:
1. Accept the new host key: `ssh-keyscan remote-server.example.com >> ~/.ssh/known_hosts`
2. Or connect manually once to accept: `ssh -i ~/.ssh/migration_key user@remote-server.example.com`

### Database Connection Issues

#### Problem: "Connection refused" when connecting to database

**Cause**: SSH tunnel not established or database not running.

**Solutions**:
1. Verify SSH tunnel is active
2. Check if PostgreSQL is running on remote server: `ssh user@remote-server.example.com "sudo systemctl status postgresql"`
3. Verify database port in configuration (usually 5432)
4. Check PostgreSQL logs on remote server

#### Problem: "Authentication failed" for database

**Cause**: Incorrect database credentials.

**Solutions**:
1. Verify username and password in `.env.migration`
2. Test credentials directly on remote server: `ssh user@remote-server.example.com "psql -U readonly_user -d legacy_recipes_production -c 'SELECT 1;'"`
3. Check if user has necessary permissions: `GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;`

#### Problem: "Database does not exist"

**Cause**: Incorrect database name in configuration.

**Solutions**:
1. List available databases: `ssh user@remote-server.example.com "psql -U postgres -l"`
2. Update `LEGACY_DB_NAME` in `.env.migration`

### Permission Issues

#### Problem: "EACCES: permission denied" when creating directories

**Cause**: Insufficient permissions to write to output directory.

**Solutions**:
1. Check directory permissions: `ls -la migration-data`
2. Create directory manually: `mkdir -p migration-data/{raw,transformed,validated,imported,logs,progress}`
3. Set correct permissions: `chmod 755 migration-data`

#### Problem: "EACCES: permission denied" reading SSH key

**Cause**: SSH key file has incorrect permissions.

**Solutions**:
1. Fix permissions: `chmod 600 ~/.ssh/migration_key`
2. Verify ownership: `ls -la ~/.ssh/migration_key` (should be owned by you)

### Configuration Issues

#### Problem: "Missing required environment variable"

**Cause**: `.env.migration` file incomplete or not loaded.

**Solutions**:
1. Verify file exists: `ls -la .env.migration`
2. Check all required variables are set: `cat .env.migration`
3. Ensure no typos in variable names
4. Restart your terminal session

#### Problem: "Invalid configuration value"

**Cause**: Configuration value has wrong format or type.

**Solutions**:
1. Check for extra spaces or quotes in `.env.migration`
2. Verify boolean values are `true` or `false` (lowercase)
3. Verify numeric values don't have quotes
4. Check paths use absolute paths (start with `/` or `~`)

### Memory Issues

#### Problem: "JavaScript heap out of memory"

**Cause**: Processing too many records at once.

**Solutions**:
1. Reduce batch size: Set `MIGRATION_BATCH_SIZE=25` in `.env.migration`
2. Increase Node.js memory: `export NODE_OPTIONS="--max-old-space-size=4096"`
3. Process in smaller chunks by filtering data

### Performance Issues

#### Problem: Migration is very slow

**Cause**: Network latency, large dataset, or API rate limiting.

**Solutions**:
1. Run extraction on the remote server directly (if possible)
2. Increase batch size: `MIGRATION_BATCH_SIZE=100`
3. Reduce delay between batches in configuration
4. Use a faster network connection
5. Run during off-peak hours

## Getting Help

If you encounter issues not covered in this guide:

1. **Check Logs**: Review log files in `migration-data/logs/`
2. **Enable Verbose Logging**: Set `MIGRATION_VERBOSE=true` in `.env.migration`
3. **Run Dry-Run**: Test with `MIGRATION_DRY_RUN=true` first
4. **Review Documentation**: Check other migration docs in `src/migration/`
5. **Contact Support**: Reach out to the development team with log files

## Starting the Next.js Development Server

**CRITICAL**: The migration import phase requires the Next.js development server to be running, as it imports data through API routes at `http://localhost:3000`.

### Start the Dev Server

In a **separate terminal window**, start the Next.js dev server:

```bash
cd jump-to-recipe
npm run dev
```

Keep this terminal open during the entire import process. You should see:

```
▲ Next.js 15.4.1
- Local:        http://localhost:3000
- Ready in 2.5s
```

### Verify API Routes Are Available

Test that the migration API endpoints are accessible:

```bash
# Test the recipes endpoint (should return 401 without auth token)
curl http://localhost:3000/api/migration/recipes

# Test the users endpoint
curl http://localhost:3000/api/migration/users
```

If you get a 404 error, the dev server isn't running or the API routes aren't properly configured.

### Important Notes

- The dev server must remain running during `npm run migration:import`
- If the server crashes or restarts during import, the migration will fail with 404 errors
- The import phase uses the `NEXT_PUBLIC_API_URL` environment variable (defaults to `http://localhost:3000`)
- For production deployments, update this URL to your production API endpoint

## Next Steps

Once setup is complete:

1. **Start the Next.js dev server** (see above) - Required for import phase
2. Review the [Execution Runbook](./EXECUTION-RUNBOOK.md) for step-by-step migration instructions
3. Run a dry-run migration to test your configuration
4. Review the validation reports before running the actual import
5. Follow the verification checklist after migration completes

## Security Reminders

- ✅ Use read-only database credentials for legacy database
- ✅ Keep SSH private keys secure (chmod 600)
- ✅ Never commit `.env.migration` to version control
- ✅ Delete exported data files after migration completes
- ✅ Revoke migration auth tokens after use
- ✅ Review audit logs for any suspicious activity
