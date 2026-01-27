/**
 * Database Client Wrapper
 * Provides PostgreSQL connection through SSH tunnel with read-only support
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import type { DatabaseConfig } from '../types/config';
import { SSHTunnelManager } from './ssh-tunnel';

export interface DatabaseClientConfig {
  database: DatabaseConfig;
  tunnel?: SSHTunnelManager;
  readOnly?: boolean;
  poolSize?: number;
}

export class DatabaseClient {
  private pool: Pool | null = null;
  private config: DatabaseClientConfig;
  private isConnected: boolean = false;

  constructor(config: DatabaseClientConfig) {
    this.config = {
      ...config,
      readOnly: config.readOnly ?? true, // Default to read-only for safety
      poolSize: config.poolSize ?? 10,
    };
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.pool) {
      console.log('Database already connected');
      return;
    }

    try {
      // Create connection pool
      this.pool = new Pool({
        host: this.config.database.host,
        port: this.config.database.port,
        database: this.config.database.database,
        user: this.config.database.username,
        password: this.config.database.password,
        max: this.config.poolSize,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test connection
      const client = await this.pool.connect();

      // Set read-only mode if configured
      if (this.config.readOnly) {
        await client.query('SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY');
        console.log('Database connection established (READ ONLY mode)');
      } else {
        console.log('Database connection established');
      }

      client.release();
      this.isConnected = true;
    } catch (error) {
      throw new Error(
        `Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute a query
   * @param query SQL query string
   * @param params Query parameters
   */
  async query<T extends QueryResultRow = any>(
    query: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    try {
      return await this.pool.query<T>(query, params);
    } catch (error) {
      throw new Error(
        `Query execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute a query within a read-only transaction
   * @param callback Function that executes queries within the transaction
   */
  async withReadOnlyTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN READ ONLY');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(
        `Transaction failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      client.release();
    }
  }

  /**
   * Stream query results for large datasets
   * @param query SQL query string
   * @param params Query parameters
   * @param onRow Callback for each row
   * @param batchSize Number of rows to fetch at a time
   */
  async streamQuery<T extends QueryResultRow = any>(
    query: string,
    params: any[] = [],
    onRow: (row: T) => void | Promise<void>,
    batchSize: number = 1000
  ): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const client = await this.pool.connect();

    try {
      // Use cursor for streaming large result sets
      await client.query('BEGIN READ ONLY');

      // Create cursor
      const cursorName = `cursor_${Date.now()}`;
      await client.query(`DECLARE ${cursorName} CURSOR FOR ${query}`, params);

      let hasMore = true;
      let totalRows = 0;

      while (hasMore) {
        const result = await client.query<T>(`FETCH ${batchSize} FROM ${cursorName}`);

        if (result.rows.length === 0) {
          hasMore = false;
          break;
        }

        // Process each row
        for (const row of result.rows) {
          await onRow(row);
          totalRows++;
        }

        // Log progress
        if (totalRows % 10000 === 0) {
          console.log(`Processed ${totalRows} rows...`);
        }
      }

      await client.query(`CLOSE ${cursorName}`);
      await client.query('COMMIT');

      console.log(`Stream query completed. Total rows: ${totalRows}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(
        `Stream query failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      client.release();
    }
  }

  /**
   * Get a client from the pool for manual transaction management
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    return await this.pool.connect();
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }

    try {
      const result = await this.pool.query('SELECT 1 as test');
      return result.rows.length === 1 && result.rows[0].test === 1;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database version
   */
  async getVersion(): Promise<string> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const result = await this.pool.query('SELECT version()');
    return result.rows[0].version;
  }

  /**
   * Get table row count
   * @param tableName Name of the table
   */
  async getTableCount(tableName: string): Promise<number> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM ${tableName}`
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (!this.pool) {
      return;
    }

    console.log('Closing database connection...');

    try {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
      throw error;
    }
  }

  /**
   * Check if database is connected
   */
  isActive(): boolean {
    return this.isConnected && this.pool !== null;
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    if (!this.pool) {
      return null;
    }

    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }
}

/**
 * Create database client with connection retry logic
 * @param config Database client configuration
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Delay between retries in milliseconds
 */
export async function createDatabaseClient(
  config: DatabaseClientConfig,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<DatabaseClient> {
  const client = new DatabaseClient(config);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to connect to database (attempt ${attempt}/${maxRetries})...`);
      await client.connect();

      // Test connection
      const isValid = await client.testConnection();
      if (!isValid) {
        throw new Error('Database connection test failed');
      }

      // Get and display version
      const version = await client.getVersion();
      console.log(`Database connected successfully. Version: ${version}`);

      return client;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Database connection attempt ${attempt} failed:`, lastError.message);

      // Close any partial connection
      try {
        await client.close();
      } catch (closeError) {
        // Ignore close errors
      }

      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to connect to database after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}
