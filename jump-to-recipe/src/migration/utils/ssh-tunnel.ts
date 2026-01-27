/**
 * SSH Tunnel Manager
 * Manages SSH tunnel connections for secure database access
 */

import { Client } from 'ssh2';
import { readFileSync } from 'fs';
import { createServer, Server, Socket } from 'net';
import type { SSHConfig } from '../types/config';

export interface TunnelConfig {
  ssh: SSHConfig;
  localPort: number;
  remoteHost: string;
  remotePort: number;
}

export class SSHTunnelManager {
  private client: Client | null = null;
  private server: Server | null = null;
  private config: TunnelConfig;
  private isConnected: boolean = false;

  constructor(config: TunnelConfig) {
    this.config = config;
  }

  /**
   * Establish SSH tunnel connection
   * @returns Promise that resolves when tunnel is ready
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Read SSH private key
        const privateKey = readFileSync(
          this.config.ssh.privateKeyPath.startsWith('~')
            ? this.config.ssh.privateKeyPath.replace('~', process.env.HOME || '')
            : this.config.ssh.privateKeyPath,
          'utf8'
        );

        this.client = new Client();

        // Set up error handler
        this.client.on('error', (err) => {
          console.error('SSH connection error:', err.message);
          reject(new Error(`SSH connection failed: ${err.message}`));
        });

        // Set up ready handler
        this.client.on('ready', () => {
          console.log('SSH connection established');

          // Create local TCP server that forwards to remote host through SSH
          this.server = createServer((localSocket: Socket) => {
            // Forward this connection through SSH tunnel
            this.client!.forwardOut(
              '127.0.0.1',
              this.config.localPort,
              this.config.remoteHost,
              this.config.remotePort,
              (err, stream) => {
                if (err) {
                  console.error('Port forwarding error:', err.message);
                  localSocket.end();
                  return;
                }

                // Pipe data between local socket and SSH stream
                localSocket.pipe(stream).pipe(localSocket);

                localSocket.on('error', (err) => {
                  console.error('Local socket error:', err.message);
                  stream.end();
                });

                stream.on('error', (err) => {
                  console.error('SSH stream error:', err.message);
                  localSocket.end();
                });
              }
            );
          });

          // Start listening on local port
          this.server.listen(this.config.localPort, '127.0.0.1', () => {
            console.log(
              `SSH tunnel created: localhost:${this.config.localPort} -> ${this.config.remoteHost}:${this.config.remotePort}`
            );
            this.isConnected = true;
            resolve();
          });

          this.server.on('error', (err) => {
            console.error('Local server error:', err.message);
            reject(new Error(`Failed to start local server: ${err.message}`));
          });
        });

        // Connect to SSH server
        this.client.connect({
          host: this.config.ssh.host,
          port: this.config.ssh.port,
          username: this.config.ssh.username,
          privateKey: privateKey,
          readyTimeout: 30000, // 30 second timeout
        });
      } catch (error) {
        reject(
          new Error(
            `Failed to establish SSH tunnel: ${error instanceof Error ? error.message : String(error)}`
          )
        );
      }
    });
  }

  /**
   * Validate SSH connection
   * @returns Promise that resolves if connection is valid
   */
  async validateConnection(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    return new Promise((resolve) => {
      // Try to execute a simple command to verify connection
      this.client!.exec('echo "test"', (err, stream) => {
        if (err) {
          resolve(false);
          return;
        }

        stream.on('close', () => {
          resolve(true);
        });

        stream.on('error', () => {
          resolve(false);
        });
      });
    });
  }

  /**
   * Close SSH tunnel gracefully
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      console.log('Closing SSH tunnel...');

      // Close local server first
      if (this.server) {
        this.server.close(() => {
          console.log('Local server closed');
        });
        this.server = null;
      }

      // Then close SSH connection
      if (this.client) {
        this.client.on('close', () => {
          console.log('SSH tunnel closed');
          this.isConnected = false;
          this.client = null;
          resolve();
        });

        this.client.end();

        // Force close after 5 seconds if graceful close fails
        setTimeout(() => {
          if (this.client) {
            console.warn('Force closing SSH tunnel');
            this.client.destroy();
            this.isConnected = false;
            this.client = null;
          }
          resolve();
        }, 5000);
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if tunnel is connected
   */
  isActive(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get tunnel configuration
   */
  getConfig(): TunnelConfig {
    return { ...this.config };
  }
}

/**
 * Create and connect SSH tunnel with retry logic
 * @param config Tunnel configuration
 * @param maxRetries Maximum number of retry attempts
 * @param retryDelay Delay between retries in milliseconds
 */
export async function createSSHTunnel(
  config: TunnelConfig,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<SSHTunnelManager> {
  const tunnel = new SSHTunnelManager(config);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to establish SSH tunnel (attempt ${attempt}/${maxRetries})...`);
      await tunnel.connect();
      console.log('SSH tunnel established successfully');
      return tunnel;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`SSH tunnel attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to establish SSH tunnel after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}
