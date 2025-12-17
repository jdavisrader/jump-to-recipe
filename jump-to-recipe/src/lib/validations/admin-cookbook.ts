import { z } from 'zod';

/**
 * Admin Cookbook Management Validation Schemas
 * 
 * This file contains all validation schemas for admin cookbook operations
 * including ownership transfer, collaborator management, and query parameters.
 */

/**
 * Schema for cookbook ownership transfer requests
 */
export const ownershipTransferSchema = z.object({
  newOwnerId: z.string().uuid('Invalid user ID format'),
});

export type OwnershipTransferRequest = z.infer<typeof ownershipTransferSchema>;

/**
 * Schema for adding collaborators to cookbooks
 */
export const addCollaboratorSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  permission: z.enum(['view', 'edit'], {
    message: 'Permission must be either "view" or "edit"'
  })
});

export type AddCollaboratorRequest = z.infer<typeof addCollaboratorSchema>;

/**
 * Schema for removing collaborators from cookbooks
 */
export const removeCollaboratorSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export type RemoveCollaboratorRequest = z.infer<typeof removeCollaboratorSchema>;

/**
 * Schema for admin cookbook query parameters
 */
export const adminCookbooksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  ownerId: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '') ? undefined : val,
    z.string().uuid().optional()
  ),
  sortBy: z.enum(['title', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AdminCookbooksQuery = z.infer<typeof adminCookbooksQuerySchema>;

/**
 * Schema for cookbook ID parameter validation
 */
export const cookbookIdParamSchema = z.object({
  id: z.string().uuid('Invalid cookbook ID format'),
});

export type CookbookIdParam = z.infer<typeof cookbookIdParamSchema>;

/**
 * Schema for user ID parameter validation
 */
export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

/**
 * Schema for user search query validation
 */
export const userSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  excludeUserIds: z.array(z.string().uuid()).optional(),
});

export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;

/**
 * Response validation schemas
 */

/**
 * Schema for cookbook with metadata response
 */
export const cookbookWithMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  owner: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
  collaboratorCount: z.number().int().min(0),
  recipeCount: z.number().int().min(0),
});

export type CookbookWithMetadata = z.infer<typeof cookbookWithMetadataSchema>;

/**
 * Schema for admin cookbooks list response
 */
export const adminCookbooksResponseSchema = z.object({
  cookbooks: z.array(cookbookWithMetadataSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalPages: z.number().int().min(0),
});

export type AdminCookbooksResponse = z.infer<typeof adminCookbooksResponseSchema>;

/**
 * Schema for ownership transfer response
 */
export const ownershipTransferResponseSchema = z.object({
  message: z.string(),
  cookbook: z.object({
    id: z.string(),
    title: z.string(),
  }),
  newOwner: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
});

export type OwnershipTransferResponse = z.infer<typeof ownershipTransferResponseSchema>;

/**
 * Schema for collaborator with user information
 */
export const collaboratorWithUserSchema = z.object({
  id: z.string(),
  userId: z.string(),
  cookbookId: z.string(),
  permission: z.enum(['view', 'edit']),
  invitedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    email: z.string(),
  }),
});

export type CollaboratorWithUser = z.infer<typeof collaboratorWithUserSchema>;

/**
 * Schema for add collaborator response
 */
export const addCollaboratorResponseSchema = z.object({
  success: z.boolean(),
  collaborator: z.object({
    id: z.string(),
    cookbookId: z.string(),
    userId: z.string(),
    permission: z.enum(['view', 'edit']),
    invitedAt: z.date(),
  }),
  message: z.string(),
});

export type AddCollaboratorResponse = z.infer<typeof addCollaboratorResponseSchema>;

/**
 * Schema for remove collaborator response
 */
export const removeCollaboratorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type RemoveCollaboratorResponse = z.infer<typeof removeCollaboratorResponseSchema>;

/**
 * Schema for user search results
 */
export const userSearchResultSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
});

export type UserSearchResult = z.infer<typeof userSearchResultSchema>;

/**
 * Schema for user search response
 */
export const userSearchResponseSchema = z.object({
  users: z.array(userSearchResultSchema),
  total: z.number().int().min(0),
});

export type UserSearchResponse = z.infer<typeof userSearchResponseSchema>;

/**
 * Error handling schemas
 */

/**
 * Schema for API error responses
 */
export const apiErrorResponseSchema = z.object({
  error: z.string(),
  details: z.union([
    z.string(),
    z.array(z.object({
      code: z.string(),
      expected: z.string().optional(),
      received: z.string().optional(),
      path: z.array(z.union([z.string(), z.number()])),
      message: z.string(),
    }))
  ]).optional(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;

/**
 * Schema for validation error responses
 */
export const validationErrorResponseSchema = z.object({
  error: z.string(),
  details: z.array(z.object({
    code: z.string(),
    expected: z.string().optional(),
    received: z.string().optional(),
    path: z.array(z.union([z.string(), z.number()])),
    message: z.string(),
  })),
});

export type ValidationErrorResponse = z.infer<typeof validationErrorResponseSchema>;

/**
 * Utility functions for validation
 */

/**
 * Validates and parses admin cookbook query parameters
 */
export function validateAdminCookbooksQuery(searchParams: URLSearchParams): AdminCookbooksQuery {
  const params = {
    page: searchParams.get('page'),
    pageSize: searchParams.get('pageSize'),
    search: searchParams.get('search'),
    ownerId: searchParams.get('ownerId'),
    sortBy: searchParams.get('sortBy'),
    sortOrder: searchParams.get('sortOrder'),
  };

  return adminCookbooksQuerySchema.parse(params);
}

/**
 * Validates cookbook ID parameter
 */
export function validateCookbookId(id: string): string {
  const result = cookbookIdParamSchema.parse({ id });
  return result.id;
}

/**
 * Validates user ID parameter
 */
export function validateUserId(userId: string): string {
  const result = userIdParamSchema.parse({ userId });
  return result.userId;
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  details?: string | object,
  statusCode: number = 500
): Response {
  return new Response(
    JSON.stringify({
      error,
      details,
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}