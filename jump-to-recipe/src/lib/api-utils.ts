// API utility functions for consistent error handling and response formatting

import { NextResponse } from 'next/server';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types';

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  statusCode: number
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    success: false,
    error,
    message,
    statusCode,
  };
  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message: string,
  statusCode: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const successResponse: ApiSuccessResponse<T> = {
    success: true,
    data,
    message,
  };
  return NextResponse.json(successResponse, { status: statusCode });
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Common error responses
 */
export const CommonErrors = {
  UNAUTHORIZED: () => createErrorResponse(
    'Unauthorized',
    'Authentication required to access this resource',
    401
  ),
  
  INVALID_UUID: (field: string) => createErrorResponse(
    `Invalid ${field} format`,
    `${field} must be a valid UUID`,
    400
  ),
  
  NOT_FOUND: (resource: string) => createErrorResponse(
    `${resource} not found`,
    `The requested ${resource.toLowerCase()} does not exist`,
    404
  ),
  
  INSUFFICIENT_PERMISSIONS: () => createErrorResponse(
    'Insufficient permissions',
    'You do not have permission to perform this action',
    403
  ),
  
  ALREADY_EXISTS: (resource: string) => createErrorResponse(
    `${resource} already exists`,
    `This ${resource.toLowerCase()} already exists`,
    409
  ),
  
  INTERNAL_ERROR: (message: string) => createErrorResponse(
    'Internal server error',
    message,
    500
  ),
  
  VALIDATION_ERROR: (message: string = 'Request validation failed') => createErrorResponse(
    'Invalid request data',
    message,
    400
  ),
} as const;