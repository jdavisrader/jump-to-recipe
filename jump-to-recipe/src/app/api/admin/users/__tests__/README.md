# Admin User Management API Integration Tests

This directory contains comprehensive integration tests for all admin user management API endpoints.

## Test Files

### 1. `route.test.ts` - GET /api/admin/users
Tests for fetching all users with counts.

**Coverage:**
- ✅ Authorization (401 for unauthenticated, 403 for non-admin)
- ✅ Successful fetch with recipe and cookbook counts
- ✅ Empty array when no users exist
- ✅ Users with zero counts
- ✅ Database error handling
- ✅ Unknown error handling

**Requirements Tested:** 1.1, 4.3

### 2. `[id]/__tests__/route.get.test.ts` - GET /api/admin/users/[id]
Tests for fetching single user details.

**Coverage:**
- ✅ Authorization (401 for unauthenticated, 403 for non-admin)
- ✅ UUID validation (400 for invalid format)
- ✅ Successful fetch with counts
- ✅ User with zero counts
- ✅ Admin user details
- ✅ 404 when user not found
- ✅ Database error handling
- ✅ Unknown error handling

**Requirements Tested:** 2.1, 4.3

### 3. `[id]/__tests__/route.put.test.ts` - PUT /api/admin/users/[id]
Tests for updating user profile and role.

**Coverage:**
- ✅ Authorization (401 for unauthenticated, 403 for non-admin)
- ✅ UUID validation
- ✅ Request body validation (invalid JSON, missing fields, invalid email, invalid role)
- ✅ Password length validation (minimum 8 characters)
- ✅ Valid role acceptance (user, elevated, admin)
- ✅ Successful profile update
- ✅ Successful role update
- ✅ Password hashing when provided
- ✅ No password update when not provided
- ✅ Email uniqueness validation
- ✅ Allowing same email (no change)
- ✅ 404 when user not found
- ✅ Password hashing errors
- ✅ Database update errors
- ✅ Unique constraint errors

**Requirements Tested:** 2.7, 2.8, 2.9, 4.3, 5.1, 5.2, 5.3, 5.4

### 4. `[id]/__tests__/route.delete.test.ts` - DELETE /api/admin/users/[id]
Tests for deleting users with ownership transfer.

**Coverage:**
- ✅ Authorization (401 for unauthenticated, 403 for non-admin)
- ✅ UUID validation
- ✅ Request body validation (invalid JSON, missing newOwnerId, invalid UUID)
- ✅ Validation that newOwnerId is different from user being deleted
- ✅ 404 when user to delete not found
- ✅ 404 when new owner not found
- ✅ Last admin protection (400 when deleting last admin)
- ✅ Allowing admin deletion when multiple admins exist
- ✅ Successful deletion with ownership transfer
- ✅ Recipe ownership transfer
- ✅ Cookbook ownership transfer
- ✅ Collaborator removal
- ✅ User account deletion
- ✅ Transaction rollback on error
- ✅ Recipe transfer errors
- ✅ Cookbook transfer errors
- ✅ Collaborator removal errors
- ✅ User deletion errors
- ✅ Foreign key constraint errors
- ✅ Transaction-specific errors
- ✅ Unknown error handling

**Requirements Tested:** 3.5, 3.6, 3.7, 3.8, 3.9, 4.3, 5.5, 5.6, 5.7

### 5. `transfer-candidates/__tests__/route.test.ts` - GET /api/admin/users/transfer-candidates
Tests for fetching transfer candidate users.

**Coverage:**
- ✅ Authorization (401 for unauthenticated, 403 for non-admin, 403 for elevated)
- ✅ UUID validation for excludeUserId parameter
- ✅ Valid UUID acceptance
- ✅ Fetching all users when no exclusion
- ✅ Excluding specified user
- ✅ Sorting by name
- ✅ Empty array when no users exist
- ✅ Empty array when only excluded user exists
- ✅ Only returning id, name, and email fields
- ✅ Handling multiple query parameters
- ✅ Database error handling
- ✅ Unknown error handling

**Requirements Tested:** 3.2, 3.3, 4.3

## Running the Tests

To run all admin user management API tests:

```bash
npm test -- src/app/api/admin/users
```

To run a specific test file:

```bash
npm test -- src/app/api/admin/users/__tests__/route.test.ts
npm test -- src/app/api/admin/users/[id]/__tests__/route.get.test.ts
npm test -- src/app/api/admin/users/[id]/__tests__/route.put.test.ts
npm test -- src/app/api/admin/users/[id]/__tests__/route.delete.test.ts
npm test -- src/app/api/admin/users/transfer-candidates/__tests__/route.test.ts
```

## Test Structure

Each test file follows this structure:

1. **Authorization Tests**: Verify that only authenticated admin users can access endpoints
2. **Validation Tests**: Verify input validation and error messages
3. **Success Tests**: Verify successful operations with expected responses
4. **Error Handling Tests**: Verify graceful error handling and appropriate status codes

## Mocking Strategy

The tests use Jest mocks for:
- `next-auth` - For session authentication
- `@/db` - For database operations
- `bcrypt` - For password hashing (PUT tests only)

All mocks are reset before each test to ensure isolation.

## Test Data

Tests use realistic mock data including:
- Valid and invalid UUIDs
- Various user roles (user, elevated, admin)
- Email addresses and names
- Recipe and cookbook counts
- Timestamps

## Coverage Goals

These integration tests aim to cover:
- ✅ All API endpoints
- ✅ All authorization scenarios
- ✅ All validation rules
- ✅ All success paths
- ✅ All error paths
- ✅ Database transaction handling
- ✅ Edge cases (empty data, last admin, etc.)

## Notes

- Tests use `jest.mock()` to mock external dependencies
- Database operations are mocked to avoid actual database calls
- Transaction rollback is tested by simulating errors during transaction execution
- All tests follow the AAA pattern (Arrange, Act, Assert)
