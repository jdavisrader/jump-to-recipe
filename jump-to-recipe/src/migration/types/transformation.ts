/**
 * Type definitions for transformation phase
 */

export interface TransformedUser {
  id: string; // Generated UUID
  name: string; // From username or email prefix
  email: string;
  emailVerified: null;
  password: null; // Will use OAuth or password reset
  image: null;
  role: 'user' | 'admin'; // From super_user flag
  createdAt: Date;
  updatedAt: Date;
  legacyId: number; // For tracking
}

export interface UserMapping {
  legacyId: number;
  newUuid: string;
  email: string;
  migrated: boolean;
  migratedAt: string;
}

export interface RecipeMapping {
  legacyId: number;
  newUuid: string;
  title: string;
  migrated: boolean;
  migratedAt: string;
}

export interface TransformError {
  phase: 'user' | 'recipe';
  recordId: number;
  field?: string;
  error: string;
  originalData?: any;
}

export interface UserTransformationResult {
  users: TransformedUser[];
  mapping: UserMapping[];
  errors: TransformError[];
  stats: {
    total: number;
    successful: number;
    failed: number;
    adminCount: number;
    userCount: number;
  };
}

// Recipe transformation types (exported from recipe-transformer.ts)
export type { TransformedRecipe, ParsedIngredient, CleanedInstruction } from '../transform/recipe-transformer';
