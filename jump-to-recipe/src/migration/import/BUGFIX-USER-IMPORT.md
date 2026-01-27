# Bug Fix: User Import Endpoint Issues

## Problem

The user import was failing because the importer was calling incorrect API endpoints:

1. **Wrong endpoint**: Calling `/api/users` instead of `/api/migration/users`
2. **Missing fields**: Not sending `id`, `createdAt`, and `updatedAt` fields
3. **Redundant check**: Making an extra GET request to check if user exists

## Root Cause

The user importer was designed to call a generic `/api/users` endpoint with a separate GET endpoint for checking user existence. However, the actual API implementation is at `/api/migration/users` and handles user deduplication internally.

## Changes Made

### 1. Updated `user-importer.ts`

**Changed endpoint from `/api/users` to `/api/migration/users`:**

```typescript
// Before
const response = await fetch(`${this.config.apiBaseUrl}/api/users`, {

// After
const response = await fetch(`${this.config.apiBaseUrl}/api/migration/users`, {
```

**Removed redundant user existence check:**

The `checkUserExists()` method was making a GET request to `/api/users?email=...` which doesn't exist. The migration API endpoint handles this internally, so we removed the extra check.

**Added missing fields to payload:**

```typescript
// Before
body: JSON.stringify({
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  password: user.password,
  image: user.image,
  role: user.role,
  legacyId: user.legacyId,
})

// After
body: JSON.stringify({
  id: user.id, // Added UUID
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  password: user.password,
  image: user.image,
  role: user.role,
  createdAt: user.createdAt, // Added timestamp
  updatedAt: user.updatedAt, // Added timestamp
})
```

**Updated to use API's `existed` flag:**

The API returns `{ id: string, existed: boolean }` to indicate if the user already existed. We now use this flag to properly track created vs existing users.

### 2. Updated `batch-importer.ts`

**Added missing fields to user payload:**

```typescript
// Before
private prepareUserPayload(user: TransformedUser): any {
  return {
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    password: user.password,
    image: user.image,
    role: user.role,
    legacyId: user.legacyId,
  };
}

// After
private prepareUserPayload(user: TransformedUser): any {
  return {
    id: user.id, // Added UUID
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    password: user.password,
    image: user.image,
    role: user.role,
    createdAt: user.createdAt, // Added timestamp
    updatedAt: user.updatedAt, // Added timestamp
  };
}
```

## How the API Works

The `/api/migration/users` endpoint:

1. Checks if a user with the given email already exists
2. If exists: Returns the existing user's ID with `existed: true`
3. If not exists: Creates the user with the provided UUID and returns `existed: false`

This design eliminates the need for a separate GET endpoint and ensures atomic user creation/lookup.

## Testing

After these fixes, the user import should:

1. ✅ Successfully call `/api/migration/users`
2. ✅ Send all required fields (id, name, email, timestamps)
3. ✅ Handle existing users correctly (reuse their UUID)
4. ✅ Track created vs existing users accurately
5. ✅ Update the user mapping table correctly

## Verification

Run the import again:

```bash
npm run migration:import
```

You should see output like:

```
👥 Importing 10 users...
  ℹ 0 users already imported (skipping)
  ℹ 10 users to process

  ✓ Created user: user1@example.com
  ℹ User user2@example.com already exists (using existing UUID)
  ✓ Created user: user3@example.com
  ...

✓ User import complete:
  - Created: 8
  - Existing: 2
  - Skipped: 0
  - Failed: 0
```

## Related Files

- `jump-to-recipe/src/migration/import/user-importer.ts` - Fixed endpoint and payload
- `jump-to-recipe/src/migration/import/batch-importer.ts` - Fixed user payload
- `jump-to-recipe/src/app/api/migration/users/route.ts` - API endpoint (no changes needed)
