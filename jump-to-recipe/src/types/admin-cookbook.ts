/**
 * Admin Cookbook Management Types
 * 
 * This file contains all TypeScript interfaces and types specifically
 * for admin cookbook management functionality.
 */

/**
 * Base cookbook metadata for admin display
 */
export interface CookbookMetadata {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  collaboratorCount: number;
  recipeCount: number;
}

/**
 * Cookbook owner information
 */
export interface CookbookOwner {
  id: string;
  name: string | null;
  email: string;
}

/**
 * Cookbook with metadata and owner information for admin display
 */
export interface CookbookWithMetadata extends CookbookMetadata {
  owner: CookbookOwner;
}

/**
 * Collaborator information with user details
 */
export interface CollaboratorWithUser {
  id: string;
  userId: string;
  cookbookId: string;
  permission: 'view' | 'edit';
  invitedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * User search result for admin operations
 */
export interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
}

/**
 * Request/Response Types
 */

/**
 * Admin cookbook list query parameters
 */
export interface AdminCookbooksQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  ownerId?: string;
  sortBy?: 'title' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Admin cookbook list response
 */
export interface AdminCookbooksResponse {
  cookbooks: CookbookWithMetadata[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Ownership transfer request
 */
export interface OwnershipTransferRequest {
  newOwnerId: string;
}

/**
 * Ownership transfer response
 */
export interface OwnershipTransferResponse {
  message: string;
  cookbook: {
    id: string;
    title: string;
  };
  newOwner: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * Add collaborator request
 */
export interface AddCollaboratorRequest {
  userId: string;
  permission: 'view' | 'edit';
}

/**
 * Add collaborator response
 */
export interface AddCollaboratorResponse {
  success: boolean;
  collaborator: {
    id: string;
    cookbookId: string;
    userId: string;
    permission: 'view' | 'edit';
    invitedAt: Date;
  };
  message: string;
}

/**
 * Remove collaborator response
 */
export interface RemoveCollaboratorResponse {
  success: boolean;
  message: string;
}

/**
 * User search response
 */
export interface UserSearchResponse {
  users: UserSearchResult[];
  total: number;
}

/**
 * Error Types
 */

/**
 * Admin cookbook error types
 */
export const AdminCookbookErrorType = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type AdminCookbookErrorType = typeof AdminCookbookErrorType[keyof typeof AdminCookbookErrorType];

/**
 * API error response
 */
export interface ApiErrorResponse {
  error: string;
  details?: string | Array<{
    code: string;
    expected?: string;
    received?: string;
    path: (string | number)[];
    message: string;
  }>;
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse {
  error: string;
  details: Array<{
    code: string;
    expected?: string;
    received?: string;
    path: (string | number)[];
    message: string;
  }>;
}

/**
 * Structured error response for admin cookbook operations
 */
export interface AdminCookbookErrorResponse {
  error: string;
  type: AdminCookbookErrorType;
  message: string;
  details?: string | object;
  statusCode: number;
}

/**
 * Success response wrapper for admin operations
 */
export interface AdminCookbookSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Union type for all admin cookbook API responses
 */
export type AdminCookbookApiResponse<T = any> = 
  | AdminCookbookSuccessResponse<T>
  | AdminCookbookErrorResponse;

/**
 * Operation result for admin cookbook actions
 */
export interface AdminCookbookOperationResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Component Props Types
 */

/**
 * Props for admin cookbook list component
 */
export interface AdminCookbookListProps {
  initialData: AdminCookbooksResponse;
  searchParams: AdminCookbooksQuery;
}

/**
 * Props for admin collaborator manager component
 */
export interface AdminCollaboratorManagerProps {
  cookbookId: string;
  collaborators: CollaboratorWithUser[];
  onUpdate?: () => void;
}

/**
 * Props for admin ownership transfer component
 */
export interface AdminOwnershipTransferProps {
  cookbookId: string;
  currentOwner: CookbookOwner;
  onTransfer?: (newOwnerId: string) => void;
}

/**
 * Utility Types
 */

/**
 * Cookbook permission levels
 */
export type CookbookPermission = 'view' | 'edit' | 'owner';

/**
 * Sort options for cookbook list
 */
export type CookbookSortBy = 'title' | 'createdAt';

/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Admin cookbook action types
 */
export type AdminCookbookAction = 
  | 'view'
  | 'edit'
  | 'delete'
  | 'transfer_ownership'
  | 'add_collaborator'
  | 'remove_collaborator';

/**
 * Admin cookbook filter options
 */
export interface AdminCookbookFilters {
  search?: string;
  ownerId?: string;
  isPublic?: boolean;
  hasCollaborators?: boolean;
  hasRecipes?: boolean;
}