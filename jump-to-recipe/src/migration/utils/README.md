# Migration Utilities

This directory contains utility modules for the legacy recipe migration system.

## Modules

### `ssh-tunnel.ts`

SSH tunnel manager for secure database access through SSH.

**Key Features:**
- Establishes SSH tunnel using private key authentication
- Port forwarding for PostgreSQL connections
- Connection validation and health checks
- Graceful tunnel closure with timeout
- Automatic retry with exponential backoff

**Usage:**

```typescript
import { createSSHTunnel } from './ssh-tunnel';

const tunnel = await createSSHTunnel({
  ssh: {
    host: 'remote-server.com',
    port: 22,
    username: 'user',
    privateKeyPath: '~/.ssh/id_rsa',
  },
  localPort: 5433,
  remoteHost: 'localhost',
  remotePort: 5432,
});

// Use the tunnel...

await tunnel.close();
```

### `database-client.ts`

PostgreSQL database client wrapper with read-only support and streaming capabilities.

**Key Features:**
- Connection pooling for efficient resource usage
- Read-only transaction support for safe data extraction
- Query streaming for large result sets
- Automatic retry with exponential backoff
- Connection health monitoring

**Usage:**

```typescript
import { createDatabaseClient } from './database-client';

const client = await createDatabaseClient({
  database: {
    host: 'localhost',
    port: 5433,
    database: 'legacy_db',
    username: 'readonly_user',
    password: 'password',
  },
  readOnly: true,
  poolSize: 10,
});

// Simple query
const result = await client.query('SELECT * FROM recipes LIMIT 10');

// Read-only transaction
const count = await client.withReadOnlyTransaction(async (txClient) => {
  const res = await txClient.query('SELECT COUNT(*) FROM recipes');
  return res.rows[0].count;
});

// Stream large result sets
await client.streamQuery(
  'SELECT * FROM recipes',
  [],
  async (row) => {
    console.log('Processing recipe:', row.name);
  },
  1000 // batch size
);

await client.close();
```

### `config-loader.ts`

Configuration loader and validator for migration scripts.

**Key Features:**
- Loads configuration from environment variables
- Validates all required settings
- Provides configuration summary display
- Type-safe configuration objects

**Usage:**

```typescript
import { loadMigrationConfig, validateConfig, displayConfigSummary } from './config-loader';

const config = loadMigrationConfig();
validateConfig(config);
displayConfigSummary(config);
```

## Testing Connection

To test the SSH tunnel and database connection:

```bash
npm run migration:test-connection
```

This will:
1. Load configuration from `.env.migration`
2. Establish SSH tunnel
3. Connect to database through tunnel
4. Run test queries
5. Display table counts
6. Clean up connections

## Environment Variables

Create a `.env.migration` file based on `.env.migration.example`:

```bash
# SSH Configuration
SSH_HOST=remote-server.example.com
SSH_PORT=22
SSH_USERNAME=migration_user
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa

# Legacy Database (accessed via SSH tunnel)
LEGACY_DB_HOST=localhost
LEGACY_DB_PORT=5432
LEGACY_DB_NAME=legacy_recipes
LEGACY_DB_USER=readonly_user
LEGACY_DB_PASSWORD=secure_password

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Migration Settings
MIGRATION_DRY_RUN=true
MIGRATION_BATCH_SIZE=50
MIGRATION_STOP_ON_ERROR=false
```

## Error Handling

All utilities implement robust error handling with a comprehensive framework:

### Error Classification System

The migration system categorizes errors into specific types:
- **SSH_CONNECTION**: SSH tunnel failures (retryable)
- **DATABASE_CONNECTION**: Database connection issues (retryable)
- **NETWORK_ERROR**: Network/API failures (retryable)
- **PARSE_ERROR**: Data parsing failures (not retryable)
- **VALIDATION_ERROR**: Validation failures (not retryable)
- **IMPORT_ERROR**: Import operation failures (conditionally retryable)
- **FILE_SYSTEM_ERROR**: File I/O errors (not retryable)
- **CONFIGURATION_ERROR**: Configuration issues (not retryable)

### Retry Mechanism

Automatic retry with exponential backoff:
- **SSH Connection Errors**: Retry 3 times with exponential backoff (2s, 4s, 8s)
- **Database Connection Errors**: Retry 3 times with exponential backoff (1s, 2s, 4s)
- **Network Errors**: Retry 3 times with exponential backoff (1s, 2s, 4s)
- **Non-retryable Errors**: Fail immediately with detailed error message

### Structured Logging

JSON-formatted logs with multiple levels (DEBUG, INFO, WARN, ERROR):
- Console output: Colored, human-readable format
- File output: JSON format for machine parsing
- Automatic timestamps on all log entries
- Phase-scoped logging for better organization

### Error Recovery

Graceful shutdown and state persistence:
- Automatic signal handling (SIGINT, SIGTERM, SIGQUIT)
- Uncaught exception and unhandled rejection handling
- Recovery state persistence for resumption
- Configurable stop-on-error vs continue-on-error modes

For detailed documentation, see [ERROR-HANDLING.md](./ERROR-HANDLING.md)

## Security Considerations

1. **SSH Authentication**: Uses private key authentication (not password)
2. **Read-Only Mode**: Database client defaults to read-only for safety
3. **Credential Management**: All credentials loaded from environment variables
4. **Connection Limits**: Connection pooling prevents resource exhaustion
5. **Timeout Protection**: All operations have reasonable timeouts

## Performance

- **Connection Pooling**: Reuses database connections efficiently
- **Query Streaming**: Handles large result sets without memory issues
- **Batch Processing**: Fetches data in configurable batch sizes
- **Progress Logging**: Reports progress for long-running operations

## Troubleshooting

### SSH Connection Fails

1. Verify SSH host and port are correct
2. Check SSH private key path and permissions (`chmod 600 ~/.ssh/id_rsa`)
3. Test SSH connection manually: `ssh -i ~/.ssh/id_rsa user@host`
4. Check firewall rules allow SSH connections

### Database Connection Fails

1. Verify database credentials are correct
2. Check that SSH tunnel is established first
3. Verify database is accessible from SSH server
4. Check PostgreSQL is running and accepting connections

### Read-Only Errors

If you need write access (not recommended for extraction):

```typescript
const client = await createDatabaseClient({
  database: config.legacyDb,
  readOnly: false, // Enable write access
});
```

### Memory Issues with Large Queries

Use streaming for large result sets:

```typescript
await client.streamQuery(
  'SELECT * FROM large_table',
  [],
  async (row) => {
    // Process one row at a time
  },
  500 // Smaller batch size
);
```

## Next Steps

After implementing these utilities, the next tasks are:

1. **Task 3**: Build extraction script using these utilities
2. **Task 4-5**: Implement transformation logic
3. **Task 6**: Add validation layer
4. **Task 7**: Create import functionality
