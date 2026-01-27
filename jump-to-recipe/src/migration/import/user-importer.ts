/**
 * User Importer Module
 * 
 * Handles user import with email-based deduplication.
 * Checks if users exist before creating, updates mapping table.
 * 
 * Requirements: 9.9, 9.10
 */

import type { TransformedUser, UserMapping } from '../types/transformation';
import type { ImportConfig, ImportResult } from '../types/import';
import { BatchImporter } from './batch-importer';
import { IdempotencyChecker } from './idempotency-checker';

// ============================================================================
// User Importer
// ============================================================================

/**
 * Specialized importer for users with email-based deduplication
 */
export class UserImporter {
  private batchImporter: BatchImporter;
  private idempotencyChecker: IdempotencyChecker;
  private config: ImportConfig;

  constructor(config: ImportConfig, idempotencyChecker: IdempotencyChecker) {
    this.config = config;
    this.batchImporter = new BatchImporter(config);
    this.idempotencyChecker = idempotencyChecker;
  }

  /**
   * Import users with email-based deduplication
   */
  async importUsers(users: TransformedUser[]): Promise<{
    results: ImportResult[];
    stats: {
      total: number;
      created: number;
      existing: number;
      skipped: number;
      failed: number;
    };
  }> {
    console.log(`\n👥 Importing ${users.length} users...`);

    // Filter out already imported users
    const { unimported, skipped } = this.idempotencyChecker.filterUnimportedUsers(users);
    
    console.log(`  ℹ ${skipped.length} users already imported (skipping)`);
    console.log(`  ℹ ${unimported.length} users to process`);

    const results: ImportResult[] = [];
    let createdCount = 0;
    let existingCount = 0;
    let failedCount = 0;

    // Process each user individually (not in batches) to check for existing users
    for (const user of unimported) {
      const result = await this.importSingleUser(user);
      results.push(result);

      if (result.success) {
        // Check if this was an existing user or newly created
        if ((result as any).existed) {
          existingCount++;
        } else {
          createdCount++;
        }
        
        this.idempotencyChecker.markUserImported(user.legacyId, result.newId!, user.email);
      } else {
        failedCount++;
      }

      // Add small delay between user checks
      if (this.config.delayBetweenBatches > 0) {
        await this.sleep(Math.min(this.config.delayBetweenBatches, 50));
      }
    }

    // Add skipped users to results
    for (const user of skipped) {
      const existingMapping = this.idempotencyChecker.getUserMapping(user.legacyId);
      results.push({
        success: true,
        legacyId: user.legacyId,
        newId: existingMapping?.newUuid,
      });
    }

    // Save updated mappings
    await this.idempotencyChecker.saveMappings();

    const stats = {
      total: users.length,
      created: createdCount,
      existing: existingCount,
      skipped: skipped.length,
      failed: failedCount,
    };

    console.log(`\n✓ User import complete:`);
    console.log(`  - Created: ${stats.created}`);
    console.log(`  - Existing: ${stats.existing}`);
    console.log(`  - Skipped: ${stats.skipped}`);
    console.log(`  - Failed: ${stats.failed}`);

    return { results, stats };
  }

  /**
   * Import a single user with email checking
   */
  private async importSingleUser(user: TransformedUser): Promise<ImportResult & { existed?: boolean }> {
    try {
      // User doesn't exist, create new user
      if (this.config.dryRun) {
        console.log(`  [DRY RUN] Would create user: ${user.email}`);
        return {
          success: true,
          legacyId: user.legacyId,
          newId: user.id,
          existed: false,
        };
      }

      // Create user via API (API will handle checking for existing users)
      const result = await this.createUser(user);
      
      if (result.existed) {
        console.log(`  ℹ User ${user.email} already exists (using existing UUID)`);
      } else {
        console.log(`  ✓ Created user: ${user.email}`);
      }
      
      return {
        success: true,
        legacyId: user.legacyId,
        newId: result.id,
        existed: result.existed,
      };
    } catch (error) {
      console.error(`  ✗ Failed to import user ${user.email}:`, error);
      return {
        success: false,
        legacyId: user.legacyId,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'unknown',
      };
    }
  }

  /**
   * Check if user exists by email
   */
  private async checkUserExists(email: string): Promise<{ id: string } | null> {
    if (this.config.dryRun) {
      return null; // In dry run, assume users don't exist
    }

    try {
      // The migration API endpoint handles checking for existing users
      // We'll just try to create and let the API return the existing user if found
      return null;
    } catch (error) {
      console.warn(`  ⚠️  Error checking user existence for ${email}:`, error);
      return null;
    }
  }

  /**
   * Create a new user via API
   */
  private async createUser(user: TransformedUser): Promise<{ id: string; existed: boolean }> {
    const response = await fetch(`${this.config.apiBaseUrl}/api/migration/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.authToken}`,
      },
      body: JSON.stringify({
        id: user.id, // Include the UUID
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        password: user.password,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create user: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return { 
      id: data.id, 
      existed: data.existed || false 
    };
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create user importer with configuration
 */
export function createUserImporter(
  config: ImportConfig,
  idempotencyChecker: IdempotencyChecker
): UserImporter {
  return new UserImporter(config, idempotencyChecker);
}
