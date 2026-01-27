/**
 * Example script demonstrating SSH tunnel and database connection
 * This can be used to test the connection utilities
 */

import { loadMigrationConfig, displayConfigSummary, validateConfig } from './config-loader';
import { createSSHTunnel, SSHTunnelManager } from './ssh-tunnel';
import { createDatabaseClient, DatabaseClient } from './database-client';

/**
 * Test SSH tunnel and database connection
 */
async function testConnection() {
  let tunnel: SSHTunnelManager | null = null;
  let dbClient: DatabaseClient | null = null;

  try {
    console.log('=== Testing SSH Tunnel and Database Connection ===\n');

    // Load configuration
    console.log('Loading configuration...');
    const config = loadMigrationConfig();
    validateConfig(config);
    displayConfigSummary(config);

    // Create SSH tunnel
    console.log('Creating SSH tunnel...');
    tunnel = await createSSHTunnel(
      {
        ssh: config.ssh,
        localPort: 5433, // Use a different port to avoid conflicts
        remoteHost: config.legacyDb.host,
        remotePort: config.legacyDb.port,
      },
      3, // max retries
      2000 // retry delay
    );

    console.log('SSH tunnel established successfully!\n');

    // Create database client (connect through tunnel)
    console.log('Connecting to database through tunnel...');
    dbClient = await createDatabaseClient(
      {
        database: {
          ...config.legacyDb,
          host: 'localhost',
          port: 5433, // Connect to local tunnel port
        },
        tunnel: tunnel,
        readOnly: true,
      },
      3, // max retries
      1000 // retry delay
    );

    console.log('Database connected successfully!\n');

    // Test queries
    console.log('Running test queries...');

    // Get database version
    const version = await dbClient.getVersion();
    console.log(`Database version: ${version}`);

    // Get table counts
    const tables = ['users', 'recipes', 'ingredients', 'instructions', 'tags', 'recipe_tags'];
    console.log('\nTable counts:');
    for (const table of tables) {
      try {
        const count = await dbClient.getTableCount(table);
        console.log(`  ${table}: ${count} rows`);
      } catch (error) {
        console.log(`  ${table}: Error - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Test read-only transaction
    console.log('\nTesting read-only transaction...');
    const result = await dbClient.withReadOnlyTransaction(async (client) => {
      const res = await client.query('SELECT COUNT(*) as total FROM recipes');
      return res.rows[0].total;
    });
    console.log(`Total recipes (via transaction): ${result}`);

    // Get pool stats
    const poolStats = dbClient.getPoolStats();
    console.log('\nConnection pool stats:', poolStats);

    console.log('\n=== Connection Test Successful! ===');
  } catch (error) {
    console.error('\n=== Connection Test Failed ===');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    // Clean up connections
    console.log('\nCleaning up connections...');

    if (dbClient) {
      try {
        await dbClient.close();
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }

    if (tunnel) {
      try {
        await tunnel.close();
      } catch (error) {
        console.error('Error closing tunnel:', error);
      }
    }

    console.log('Cleanup complete');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testConnection().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { testConnection };
