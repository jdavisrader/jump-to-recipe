# Admin Recipe Access Fix

**Date:** February 17, 2026  
**Issue:** Admin users were unable to view or edit private recipes

## Problem

When an admin user attempted to view or edit a private recipe (one they didn't own), the application would throw an error or deny access. This was inconsistent with the expected behavior where admins should have full access to all recipes regardless of visibility settings.

## Root Cause

The GET endpoint in `/api/recipes/[id]/route.ts` had a visibility check that only allowed:
- Public recipes to be viewed by anyone
- Private recipes to be viewed only by their owners

The check did not account for admin users who should have access to all recipes.

## Changes Made

### 1. Recipe Form Default Visibility
**File:** `jump-to-recipe/src/components/recipes/recipe-form.tsx`

Changed the default visibility for new recipes from `"private"` to `"public"`:

```typescript
// Before
visibility: normalizedInitialData?.visibility || "private",

// After
visibility: normalizedInitialData?.visibility || "public",
```

### 2. Admin Access to Private Recipes
**File:** `jump-to-recipe/src/app/api/recipes/[id]/route.ts`

Updated the GET endpoint to allow admins to view all recipes:

```typescript
// Get current user from session
const session = await getServerSession(authOptions);
const currentUserId = session?.user?.id;
const isAdmin = session?.user?.role === 'admin';

// Build where conditions
const whereConditions = [eq(recipes.id, id)];

// Add visibility check - users can see public recipes or their own private recipes
// Admins can see all recipes
if (!isAdmin) {
    if (currentUserId) {
        // For authenticated users, they can see public recipes or their own private recipes
        whereConditions.push(
            sql`(${recipes.visibility} = 'public' OR ${recipes.authorId} = ${currentUserId})`
        );
    } else {
        // Non-authenticated users can only see public recipes
        whereConditions.push(eq(recipes.visibility, 'public'));
    }
}
```

## Verification

The PUT and DELETE endpoints already had proper admin checks in place:
- PUT endpoint (line 143-149): Checks `isAdmin` and allows editing
- DELETE endpoint (line 437-441): Checks `isAdmin` and allows deletion

The edit page (`/recipes/[id]/edit/page.tsx`) also had proper admin checks:
- Line 67-73: `canEdit` check includes admin role
- Line 177-185: Permission check includes admin role

## Impact

- Admin users can now view any recipe regardless of visibility setting
- Admin users can edit any recipe (already working, now consistent with view access)
- Admin users can delete any recipe (already working)
- New recipes default to public visibility instead of private

## Testing Recommendations

1. Test admin viewing a private recipe owned by another user
2. Test admin editing a private recipe owned by another user
3. Test admin deleting a private recipe owned by another user
4. Verify non-admin users still cannot access private recipes they don't own
5. Verify new recipes are created with public visibility by default
