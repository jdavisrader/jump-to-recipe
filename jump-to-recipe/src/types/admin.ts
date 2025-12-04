import { User } from '@/db/schema/users';
import { z } from 'zod';

/**
 * User with aggregated counts for admin display
 */
export interface UserWithCounts extends User {
  recipeCount: number;
  cookbookCount: number;
}

/**
 * Validation schema for user profile updates
 */
export const userEditSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email format').max(255),
  role: z.enum(['user', 'elevated', 'admin']),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

export type UserEditRequest = z.infer<typeof userEditSchema>;

/**
 * Validation schema for password updates
 */
export const passwordUpdateSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type PasswordUpdateRequest = z.infer<typeof passwordUpdateSchema>;

/**
 * Validation schema for user deletion with ownership transfer
 */
export const userDeleteSchema = z.object({
  newOwnerId: z.string().uuid('Invalid user ID'),
});

export type UserDeleteRequest = z.infer<typeof userDeleteSchema>;

/**
 * API response types
 */
export interface UsersListResponse {
  users: UserWithCounts[];
}

export interface UserDetailResponse {
  user: UserWithCounts;
}

export interface UserUpdateResponse {
  success: boolean;
  user: UserWithCounts;
}

export interface UserDeleteResponse {
  success: boolean;
  message: string;
}

export interface TransferCandidatesResponse {
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}
