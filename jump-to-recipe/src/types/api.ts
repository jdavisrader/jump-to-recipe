// API-specific TypeScript interfaces and types for the add-to-cookbook feature

import type { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

// Base API response types
export interface BaseApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface BaseApiSuccessResponse<T = unknown> extends BaseApiResponse<T> {
  success: true;
  data: T;
  message: string;
}

export interface BaseApiErrorResponse extends BaseApiResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

// Request parameter types
export interface RecipeParamsType {
  id: string; // Recipe UUID
}

export interface CookbookParamsType {
  id: string; // Cookbook UUID
}

export interface CookbookRecipeParamsType {
  id: string; // Cookbook UUID
  recipeId: string; // Recipe UUID
}

// Request body types
export interface AddRecipeRequestBody {
  recipeId: string;
}

export interface RemoveRecipeRequestBody {
  // DELETE requests typically don't have a body
}

// Query parameter types
export interface BaseRecipeCookbooksQuery {
  editableOnly?: string | boolean;
}

// Response data types
export interface CookbookOptionResponse {
  id: string;
  name: string;
  isChecked: boolean;
  isOwned: boolean;
  permission: 'edit' | 'owner';
  lastUsed?: string; // ISO date string
}

export interface GetRecipeCookbooksResponseData {
  cookbooks: CookbookOptionResponse[];
  totalCount: number;
}

export interface AddRecipeResponseData {
  cookbookId: string;
  recipeId: string;
  position: number;
  addedAt: string; // ISO date string
}

export interface RemoveRecipeResponseData {
  cookbookId: string;
  recipeId: string;
  removedAt: string; // ISO date string
}

// API handler types
export type ApiHandler<TParams = unknown, TQuery = unknown, TBody = unknown, TResponse = unknown> = (
  request: NextRequest,
  context: { params: Promise<TParams> }
) => Promise<NextResponse<TResponse>>;

export type GetRecipeCookbooksHandler = ApiHandler<
  RecipeParamsType,
  BaseRecipeCookbooksQuery,
  never,
  BaseApiSuccessResponse<GetRecipeCookbooksResponseData> | BaseApiErrorResponse
>;

export type AddRecipeToCookbookHandler = ApiHandler<
  CookbookParamsType,
  never,
  AddRecipeRequestBody,
  BaseApiSuccessResponse<AddRecipeResponseData> | BaseApiErrorResponse
>;

export type RemoveRecipeFromCookbookHandler = ApiHandler<
  CookbookRecipeParamsType,
  never,
  never,
  BaseApiSuccessResponse<RemoveRecipeResponseData> | BaseApiErrorResponse
>;

// Authentication context types
export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
}

export interface ApiContext {
  session: Session | null;
  user: Session['user'] | null;
  isAuthenticated: boolean;
}

// Database operation types
export interface DatabaseOperation<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  affectedRows?: number;
}

export interface CookbookPermissionCheck {
  userId: string;
  cookbookId: string;
  hasPermission: boolean;
  permission?: 'view' | 'edit' | 'owner';
}

export interface RecipeExistenceCheck {
  recipeId: string;
  exists: boolean;
  recipe?: {
    id: string;
    title: string;
    authorId: string;
  };
}

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  errors: ValidationError[];
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // Seconds
}

export interface RateLimitResponse extends ApiErrorResponse {
  rateLimit: RateLimitInfo;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Sorting and filtering types
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  tags?: string[];
  difficulty?: string;
  cookTime?: number;
  prepTime?: number;
}

// Batch operation types
export interface BatchOperationRequest {
  operations: Array<{
    type: 'add' | 'remove';
    cookbookId: string;
    recipeId: string;
  }>;
}

export interface BatchOperationResponse {
  success: boolean;
  results: Array<{
    cookbookId: string;
    recipeId: string;
    operation: 'add' | 'remove';
    success: boolean;
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Webhook types (for future integrations)
export interface WebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature: string;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  error?: string;
}

// Cache types
export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[];
  revalidate?: boolean;
}

// Metrics and analytics types
export interface ApiMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userId?: string;
}

export interface PerformanceMetrics {
  dbQueryTime: number;
  totalResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

// Error tracking types
export interface ErrorContext {
  userId?: string;
  endpoint: string;
  method: string;
  userAgent?: string;
  ip?: string;
  timestamp: number;
}

export interface ErrorReport {
  error: Error;
  context: ErrorContext;
  stackTrace?: string;
  additionalData?: Record<string, unknown>;
}

// Health check types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis?: 'up' | 'down';
    external?: 'up' | 'down';
  };
  version: string;
  uptime: number;
}

// Configuration types
export interface ApiConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
  };
  security: {
    helmet: boolean;
    csrf: boolean;
  };
}