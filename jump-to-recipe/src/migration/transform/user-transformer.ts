/**
 * User Transformer Module
 * Transforms legacy user data to new schema format
 * 
 * Requirements: 2.8, 2.9, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.13
 */

import { randomUUID } from 'crypto';
import type { LegacyUser } from '../types/extraction';
import type {
  TransformedUser,
  UserMapping,
  TransformError,
  UserTransformationResult,
} from '../types/transformation';

/**
 * Transform a single legacy user to new schema format
 * 
 * Transformation rules:
 * 1. Generate UUID for each user
 * 2. Map username → name (if null, use email prefix before @)
 * 3. Preserve email exactly
 * 4. Set password to null (users will authenticate via OAuth or reset)
 * 5. Map super_user: true → role: 'admin', otherwise role: 'user'
 * 6. Preserve timestamps
 * 7. Store legacy ID for reference
 */
export function transformUser(legacyUser: LegacyUser): TransformedUser {
  // Generate new UUID
  const newUuid = randomUUID();

  // Map username to name, fallback to email prefix
  let name: string;
  if (legacyUser.username && legacyUser.username.trim() !== '') {
    name = legacyUser.username.trim();
  } else {
    // Extract email prefix (everything before @)
    const emailPrefix = legacyUser.email.split('@')[0];
    name = emailPrefix;
  }

  // Map super_user flag to role
  const role = legacyUser.super_user ? 'admin' : 'user';

  // Parse timestamps
  const createdAt = new Date(legacyUser.created_at);
  const updatedAt = new Date(legacyUser.updated_at);

  return {
    id: newUuid,
    name,
    email: legacyUser.email,
    emailVerified: null,
    password: null,
    image: null,
    role,
    createdAt,
    updatedAt,
    legacyId: legacyUser.id,
  };
}

/**
 * Create user mapping entry
 */
export function createUserMapping(
  legacyUser: LegacyUser,
  transformedUser: TransformedUser
): UserMapping {
  return {
    legacyId: legacyUser.id,
    newUuid: transformedUser.id,
    email: transformedUser.email,
    migrated: false,
    migratedAt: new Date().toISOString(),
  };
}

/**
 * Transform all legacy users to new schema format
 * 
 * @param legacyUsers - Array of legacy user records
 * @returns Transformation result with users, mappings, errors, and stats
 */
export async function transformUsers(
  legacyUsers: LegacyUser[]
): Promise<UserTransformationResult> {
  console.log(`\n=== Starting User Transformation ===`);
  console.log(`Total users to transform: ${legacyUsers.length}\n`);

  const users: TransformedUser[] = [];
  const mapping: UserMapping[] = [];
  const errors: TransformError[] = [];

  let adminCount = 0;
  let userCount = 0;

  for (const legacyUser of legacyUsers) {
    try {
      // Validate required fields
      if (!legacyUser.email || legacyUser.email.trim() === '') {
        throw new Error('Email is required');
      }

      if (!legacyUser.id) {
        throw new Error('User ID is required');
      }

      // Transform user
      const transformedUser = transformUser(legacyUser);
      users.push(transformedUser);

      // Create mapping
      const userMapping = createUserMapping(legacyUser, transformedUser);
      mapping.push(userMapping);

      // Track role counts
      if (transformedUser.role === 'admin') {
        adminCount++;
      } else {
        userCount++;
      }

      // Log progress every 100 users
      if (users.length % 100 === 0) {
        console.log(`Transformed ${users.length}/${legacyUsers.length} users...`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push({
        phase: 'user',
        recordId: legacyUser.id,
        error: errorMessage,
        originalData: legacyUser,
      });
      console.error(`✗ Failed to transform user ${legacyUser.id}: ${errorMessage}`);
    }
  }

  const stats = {
    total: legacyUsers.length,
    successful: users.length,
    failed: errors.length,
    adminCount,
    userCount,
  };

  console.log(`\n=== User Transformation Complete ===`);
  console.log(`Total: ${stats.total}`);
  console.log(`Successful: ${stats.successful}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Admins: ${stats.adminCount}`);
  console.log(`Regular users: ${stats.userCount}`);
  console.log(`=====================================\n`);

  return {
    users,
    mapping,
    errors,
    stats,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get user by legacy ID from mapping
 */
export function getUserUuidByLegacyId(
  legacyId: number,
  mapping: UserMapping[]
): string | null {
  const userMapping = mapping.find((m) => m.legacyId === legacyId);
  return userMapping ? userMapping.newUuid : null;
}

/**
 * Get user by email from mapping
 */
export function getUserUuidByEmail(
  email: string,
  mapping: UserMapping[]
): string | null {
  const userMapping = mapping.find((m) => m.email === email);
  return userMapping ? userMapping.newUuid : null;
}
