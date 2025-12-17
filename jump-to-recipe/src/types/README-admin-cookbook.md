# Admin Cookbook Management Types and Validation

This document describes the TypeScript interfaces and Zod validation schemas for admin cookbook management functionality.

## Overview

The admin cookbook management system provides administrators with comprehensive control over all cookbooks in the platform. This includes:

- Browsing and searching all cookbooks
- Managing cookbook collaborators
- Transferring cookbook ownership
- Deleting cookbooks
- Viewing cookbook metadata and statistics

## Type Definitions

### Core Types

#### `CookbookWithMetadata`
Represents a cookbook with aggregated metadata for admin display.

```typescript
interface CookbookWithMetadata {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: CookbookOwner;
  collaboratorCount: number;
  recipeCount: number;
}
```

#### `CollaboratorWithUser`
Represents a cookbook collaborator with user information.

```typescript
interface CollaboratorWithUser {
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
```

### Request/Response Types

#### API Requests
- `OwnershipTransferRequest` - Transfer cookbook ownership
- `AddCollaboratorRequest` - Add a collaborator to a cookbook
- `AdminCookbooksQuery` - Query parameters for cookbook list

#### API Responses
- `AdminCookbooksResponse` - Paginated cookbook list response
- `OwnershipTransferResponse` - Ownership transfer result
- `AddCollaboratorResponse` - Add collaborator result
- `RemoveCollaboratorResponse` - Remove collaborator result

### Error Types

#### `AdminCookbookErrorType`
Enumeration of possible error types:
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks admin privileges
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `CONFLICT` - Resource conflict (e.g., duplicate collaborator)
- `INTERNAL_ERROR` - Server error

## Validation Schemas

All validation is handled using Zod schemas located in `/src/lib/validations/admin-cookbook.ts`.

### Request Validation

#### `ownershipTransferSchema`
Validates ownership transfer requests:
```typescript
{
  newOwnerId: string (UUID format)
}
```

#### `addCollaboratorSchema`
Validates add collaborator requests:
```typescript
{
  userId: string (UUID format),
  permission: 'view' | 'edit'
}
```

#### `adminCookbooksQuerySchema`
Validates cookbook list query parameters:
```typescript
{
  page?: number (min: 1, default: 1),
  pageSize?: number (min: 1, max: 100, default: 20),
  search?: string,
  ownerId?: string (UUID format, empty strings converted to undefined),
  sortBy?: 'title' | 'createdAt' (default: 'createdAt'),
  sortOrder?: 'asc' | 'desc' (default: 'desc')
}
```

**Note**: The `ownerId` parameter uses preprocessing to convert empty strings to `undefined`, allowing for optional filtering without validation errors.

### Response Validation

Response schemas ensure API responses match expected formats:
- `adminCookbooksResponseSchema`
- `ownershipTransferResponseSchema`
- `addCollaboratorResponseSchema`
- `removeCollaboratorResponseSchema`

### Parameter Validation

#### `cookbookIdParamSchema`
Validates cookbook ID parameters:
```typescript
{
  id: string (UUID format)
}
```

#### `userIdParamSchema`
Validates user ID parameters:
```typescript
{
  userId: string (UUID format)
}
```

## Utility Functions

### Validation Helpers

#### `validateAdminCookbooksQuery(searchParams: URLSearchParams)`
Parses and validates URL search parameters for cookbook queries.

#### `validateCookbookId(id: string)`
Validates and returns a cookbook ID.

#### `validateUserId(userId: string)`
Validates and returns a user ID.

### Response Helpers

#### `createErrorResponse(error: string, details?: string | object, statusCode?: number)`
Creates standardized error responses.

#### `createSuccessResponse<T>(data: T, message?: string, statusCode?: number)`
Creates standardized success responses.

## Usage Examples

### API Route Implementation

```typescript
import { 
  validateAdminCookbooksQuery,
  createErrorResponse,
  createSuccessResponse,
  type AdminCookbooksResponse 
} from '@/lib/validations/admin-cookbook';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const queryParams = validateAdminCookbooksQuery(url.searchParams);
    
    // ... fetch data logic
    
    const response: AdminCookbooksResponse = {
      cookbooks: cookbooksData,
      total,
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      totalPages: Math.ceil(total / queryParams.pageSize),
    };

    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse('Failed to fetch cookbooks', error.message, 500);
  }
}
```

### Component Props

```typescript
import type { AdminCookbookListProps } from '@/types/admin-cookbook';

function AdminCookbookList({ initialData, searchParams }: AdminCookbookListProps) {
  // Component implementation
}
```

## File Organization

```
src/
├── types/
│   ├── admin-cookbook.ts          # Main type definitions
│   └── admin.ts                   # Re-exports for backward compatibility
├── lib/
│   └── validations/
│       ├── admin-cookbook.ts      # Validation schemas and utilities
│       └── index.ts               # Central export point
└── app/api/admin/cookbooks/       # API route implementations
```

## Best Practices

1. **Type Safety**: Always use the provided TypeScript interfaces for type checking.

2. **Validation**: Use Zod schemas for all request validation to ensure data integrity.

3. **Error Handling**: Use the standardized error response format for consistent API behavior.

4. **Imports**: Import types and validation schemas from the dedicated files:
   ```typescript
   import type { CookbookWithMetadata } from '@/types/admin-cookbook';
   import { validateCookbookId } from '@/lib/validations/admin-cookbook';
   ```

5. **Response Format**: Always use the helper functions for creating API responses to maintain consistency.

## Requirements Coverage

This implementation covers the following requirements:

- **Requirement 1.2**: TypeScript interfaces for cookbook data structures with metadata
- **Requirement 4.3**: Validation schemas for collaborator management operations  
- **Requirement 5.3**: Validation and error handling for ownership transfer operations

The type system ensures compile-time safety while the validation schemas provide runtime data integrity for all admin cookbook management operations.