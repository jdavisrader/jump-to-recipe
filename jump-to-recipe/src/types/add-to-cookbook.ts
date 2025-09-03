// TypeScript interfaces and types for the Add to Cookbook feature

// Core interfaces for cookbook options and recipe status
export interface CookbookOption {
  id: string;
  name: string;
  isChecked: boolean;
  isOwned: boolean;
  permission: 'edit' | 'owner';
  lastUsed?: Date | string;
}

export interface RecipeCookbookStatus {
  cookbooks: CookbookOption[];
  totalCount: number;
}

// Component prop interfaces
export interface AddToCookbookButtonProps {
  recipeId: string;
  className?: string;
}

export interface AddToCookbookModalProps {
  recipeId: string;
  isOpen: boolean;
  onClose: () => void;
}

// API request and response types
export interface AddRecipeRequest {
  recipeId: string;
}

export interface RemoveRecipeRequest {
  // No body needed for DELETE request
}

export interface AddRecipeResponse {
  success: true;
  message: string;
  data?: {
    cookbookId: string;
    recipeId: string;
    position: number;
  };
}

export interface RemoveRecipeResponse {
  success: true;
  message: string;
}

export interface GetRecipeCookbooksResponse {
  cookbooks: CookbookOption[];
  totalCount: number;
}

// Error response types
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

// Internal operation tracking types
export interface PendingOperation {
  cookbookId: string;
  operation: 'add' | 'remove';
  originalState: boolean;
  timestamp: number;
}

export interface OperationResult {
  success: boolean;
  cookbookId: string;
  operation: 'add' | 'remove';
  error?: string;
}

// State management types for the modal component
export interface ModalState {
  cookbooks: CookbookOption[];
  searchQuery: string;
  isInitialLoading: boolean;
  pendingOperations: Map<string, PendingOperation>;
  retryAttempts: Map<string, number>;
}

// Utility types for filtering and sorting
export type CookbookSortCriteria = 'lastUsed' | 'ownership' | 'name';

export interface CookbookFilterOptions {
  searchQuery?: string;
  sortBy?: CookbookSortCriteria[];
  includeOwned?: boolean;
  includeCollaborated?: boolean;
}

// Permission-related types (extending existing cookbook types)
export type CookbookPermissionLevel = 'view' | 'edit' | 'owner';

export interface CookbookWithPermission {
  id: string;
  title: string;
  permission: CookbookPermissionLevel;
  isOwned: boolean;
  lastUsed?: Date;
}

// API endpoint parameter types
export interface RecipeCookbooksParams {
  id: string; // recipe ID
}

export interface CookbookRecipesParams {
  id: string; // cookbook ID
}

export interface CookbookRecipeParams {
  id: string; // cookbook ID
  recipeId: string;
}

// Query parameter types
export interface RecipeCookbooksQuery {
  editableOnly?: boolean;
}

// Extended recipe type with cookbook status (optional caching)
export interface RecipeWithCookbookStatus {
  id: string;
  title: string;
  // ... other recipe properties
  cookbookStatus?: RecipeCookbookStatus;
}

// Validation schema types (for Zod integration)
export interface AddRecipeValidation {
  recipeId: string; // UUID format
}

export interface CookbookIdValidation {
  id: string; // UUID format
}

export interface RecipeIdValidation {
  id: string; // UUID format
}

// Toast notification types
export interface ToastNotification {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

// Hook return types
export interface UseAddToCookbookReturn {
  cookbooks: CookbookOption[];
  isLoading: boolean;
  error: string | null;
  addToCookbook: (cookbookId: string) => Promise<void>;
  removeFromCookbook: (cookbookId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// Event handler types
export type CookbookToggleHandler = (cookbookId: string, currentlyChecked: boolean) => Promise<void>;
export type SearchChangeHandler = (query: string) => void;
export type ModalCloseHandler = () => void;
export type CreateCookbookHandler = () => void;

// Async operation types
export interface AsyncOperationConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  exponentialBackoff: boolean;
}