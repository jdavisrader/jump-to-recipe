/**
 * Structured logging system for migration operations
 */

import * as fs from 'fs';
import * as path from 'path';
import type { MigrationPhase } from '../types/errors';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  phase?: MigrationPhase;
  message: string;
  data?: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  verbose: boolean;
  outputDir?: string;
  logToFile: boolean;
  logToConsole: boolean;
}

class Logger {
  private config: LoggerConfig;
  private logFilePath?: string;
  private logStream?: fs.WriteStream;
  private levelPriority: Record<LogLevel, number> = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || 'INFO',
      verbose: config.verbose ?? true,
      outputDir: config.outputDir,
      logToFile: config.logToFile ?? true,
      logToConsole: config.logToConsole ?? true,
    };
  }

  /**
   * Initialize logger with output directory
   */
  initialize(outputDir: string, phase: MigrationPhase): void {
    if (!this.config.logToFile) {
      return;
    }

    const logsDir = path.join(outputDir, 'logs');
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFilePath = path.join(logsDir, `${phase}-${timestamp}.log`);

    // Create write stream
    this.logStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
  }

  /**
   * Close the log stream
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.logStream) {
        this.logStream.end(() => {
          this.logStream = undefined;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }

  /**
   * Format log entry for console output
   */
  private formatConsole(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelColor = this.getLevelColor(entry.level);
    const resetColor = '\x1b[0m';
    
    let output = `${levelColor}[${timestamp}] ${entry.level}${resetColor}`;
    
    if (entry.phase) {
      output += ` [${entry.phase}]`;
    }
    
    output += `: ${entry.message}`;

    if (this.config.verbose && entry.data) {
      output += '\n' + JSON.stringify(entry.data, null, 2);
    }

    return output;
  }

  /**
   * Get ANSI color code for log level
   */
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'DEBUG':
        return '\x1b[36m'; // Cyan
      case 'INFO':
        return '\x1b[32m'; // Green
      case 'WARN':
        return '\x1b[33m'; // Yellow
      case 'ERROR':
        return '\x1b[31m'; // Red
      default:
        return '\x1b[0m'; // Reset
    }
  }

  /**
   * Format log entry for file output (JSON)
   */
  private formatFile(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  /**
   * Write log entry
   */
  private log(level: LogLevel, message: string, data?: Record<string, any>, phase?: MigrationPhase): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      phase,
      message,
      data,
    };

    // Log to console
    if (this.config.logToConsole) {
      const consoleOutput = this.formatConsole(entry);
      
      switch (level) {
        case 'ERROR':
          console.error(consoleOutput);
          break;
        case 'WARN':
          console.warn(consoleOutput);
          break;
        case 'DEBUG':
          console.debug(consoleOutput);
          break;
        default:
          console.log(consoleOutput);
      }
    }

    // Log to file
    if (this.config.logToFile && this.logStream) {
      const fileOutput = this.formatFile(entry);
      this.logStream.write(fileOutput);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: Record<string, any>, phase?: MigrationPhase): void {
    this.log('DEBUG', message, data, phase);
  }

  /**
   * Log info message
   */
  info(message: string, data?: Record<string, any>, phase?: MigrationPhase): void {
    this.log('INFO', message, data, phase);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: Record<string, any>, phase?: MigrationPhase): void {
    this.log('WARN', message, data, phase);
  }

  /**
   * Log error message
   */
  error(message: string, data?: Record<string, any>, phase?: MigrationPhase): void {
    this.log('ERROR', message, data, phase);
  }

  /**
   * Log with explicit phase
   */
  withPhase(phase: MigrationPhase) {
    return {
      debug: (message: string, data?: Record<string, any>) => this.debug(message, data, phase),
      info: (message: string, data?: Record<string, any>) => this.info(message, data, phase),
      warn: (message: string, data?: Record<string, any>) => this.warn(message, data, phase),
      error: (message: string, data?: Record<string, any>) => this.error(message, data, phase),
    };
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current log file path
   */
  getLogFilePath(): string | undefined {
    return this.logFilePath;
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Create a scoped logger for a specific phase
 */
export function createPhaseLogger(phase: MigrationPhase) {
  return logger.withPhase(phase);
}
