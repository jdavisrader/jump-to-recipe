// Validation types for API endpoints and forms
// These types correspond to Zod schemas used throughout the application

// UUID validation type
export type UUID = string; // Should match UUID format: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Add to cookbook validation schemas
export interface AddRecipeValidationSchema {
  recipeId: UUID;
}

export interface RemoveRecipeValidationSchema {
  // No body validation needed for DELETE requests
}

export interface RecipeIdParamSchema {
  id: UUID;
}

export interface CookbookIdParamSchema {
  id: UUID;
}

export interface CookbookRecipeParamsSchema {
  id: UUID; // cookbook ID
  recipeId: UUID;
}

// Query parameter validation schemas
export interface RecipeCookbooksQuerySchema {
  editableOnly?: boolean;
}

// Response validation schemas
export interface CookbookOptionSchema {
  id: UUID;
  name: string;
  isChecked: boolean;
  isOwned: boolean;
  permission: 'edit' | 'owner';
  lastUsed?: string; // ISO date string
}

export interface RecipeCookbooksResponseSchema {
  cookbooks: CookbookOptionSchema[];
  totalCount: number;
}

export interface ApiSuccessResponseSchema {
  success: true;
  message: string;
  data?: Record<string, unknown>;
}

export interface ApiErrorResponseSchema {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

// Form validation schemas
export interface CookbookSearchSchema {
  query: string; // min length 0, max length 100
}

// Database constraint validation
export interface CookbookRecipeConstraintSchema {
  cookbookId: UUID;
  recipeId: UUID;
  position: number; // positive integer
}

// Permission validation schemas
export interface CookbookPermissionSchema {
  userId: UUID;
  cookbookId: UUID;
  requiredPermission: 'view' | 'edit' | 'owner';
}

// Batch operation validation schemas
export interface BatchAddRecipesSchema {
  recipeIds: UUID[];
  cookbookId: UUID;
}

export interface BatchRemoveRecipesSchema {
  recipeIds: UUID[];
  cookbookId: UUID;
}

// File upload validation (for future cookbook cover images)
export interface ImageUploadSchema {
  file: File;
  maxSize: number; // in bytes
  allowedTypes: string[]; // MIME types
}

// Pagination validation schemas
export interface PaginationSchema {
  page?: number; // positive integer, default 1
  limit?: number; // positive integer, max 100, default 20
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Search and filter validation schemas
export interface CookbookFilterSchema {
  search?: string;
  ownedOnly?: boolean;
  collaboratedOnly?: boolean;
  hasRecipe?: UUID; // recipe ID to filter by
}

// Rate limiting validation
export interface RateLimitSchema {
  userId: UUID;
  endpoint: string;
  windowMs: number;
  maxRequests: number;
}

// Session validation schemas
export interface SessionValidationSchema {
  userId: UUID;
  sessionToken: string;
  expiresAt: string; // ISO date string
}

// Environment variable validation
export interface EnvValidationSchema {
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
  // Add other required env vars
}

// Type guards for runtime validation
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  issues?: Array<{
    path: string[];
    message: string;
  }>;
};

// Utility types for validation
export type ValidatedRequest<TParams = unknown, TQuery = unknown, TBody = unknown> = {
  params: TParams;
  query: TQuery;
  body: TBody;
};

export type ValidationMiddleware<T> = (input: unknown) => ValidationResult<T>;