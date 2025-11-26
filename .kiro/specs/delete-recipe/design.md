# Design Document

## Overview

The delete recipe feature enables authorized users (recipe owners and admins) to permanently remove recipes from the Jump to Recipe application. The feature integrates into the existing recipe edit page and follows established patterns for destructive actions with a confirmation modal workflow.

The implementation leverages existing infrastructure including:
- The existing `DELETE /api/recipes/[id]` API endpoint (already implemented)
- The existing `ConfirmationModal` component for user confirmation
- The existing authentication and authorization system via NextAuth
- The existing permission checking utilities in `recipe-permissions.ts`

This design focuses on the frontend integration, state management, and user experience while ensuring data integrity and proper authorization checks.

## Architecture

### Component Architecture

```
EditRecipePage (Client Component)
├── RecipeForm (Existing)
│   └── Form fields and update logic
└── DeleteRecipeSection (New)
    ├── Delete Button
    └── ConfirmationModal (Existing)
        ├── Modal Dialog
        ├── Cancel Button
        └── Delete Button
```

### Data Flow

```
User clicks Delete
    ↓
Modal opens (local state)
    ↓
User confirms deletion
    ↓
DELETE /api/recipes/[id] (existing endpoint)
    ↓
Authorization check (owner or admin/elevated)
    ↓
Database deletion
    ↓
Success response
    ↓
Redirect to /my-recipes
    ↓
Toast notification
```

### State Management

The delete functionality will use React local state within the edit page component:

```typescript
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

No global state management is required as the deletion is a one-time action that results in navigation away from the page.

## Components and Interfaces

### 1. DeleteRecipeSection Component (New)

A new component that encapsulates the delete button and modal logic.

**Location:** `jump-to-recipe/src/components/recipes/delete-recipe-section.tsx`

**Props Interface:**
```typescript
interface DeleteRecipeSectionProps {
  recipeId: string;
  recipeTitle: string;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
}
```

**Responsibilities:**
- Render the delete button with destructive styling
- Manage modal open/close state
- Handle the deletion API call
- Manage loading state during deletion
- Handle success and error scenarios
- Trigger navigation on success

**Component Structure:**
```typescript
export function DeleteRecipeSection({
  recipeId,
  recipeTitle,
  onDeleteSuccess,
  onDeleteError,
}: DeleteRecipeSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    // Deletion logic
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsModalOpen(true)}
      >
        Delete Recipe
      </Button>
      
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Recipe"
        description={`Are you sure you want to delete "${recipeTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
}
```

### 2. Edit Page Integration

**Location:** `jump-to-recipe/src/app/recipes/[id]/edit/page.tsx`

**Changes Required:**
- Import the new `DeleteRecipeSection` component
- Add permission check to determine if delete button should be shown
- Add the delete section to the page layout below the form

**Permission Logic:**
```typescript
const canDelete = useMemo(() => {
  if (!session?.user || !recipe) return false;
  
  const isOwner = recipe.authorId === session.user.id;
  const isAdmin = session.user.role === 'admin';
  const isElevated = session.user.role === 'elevated';
  
  return isOwner || isAdmin || isElevated;
}, [session, recipe]);
```

**Layout Structure:**
```tsx
<div className="container mx-auto py-8 max-w-4xl">
  <h1>Edit Recipe</h1>
  
  <RecipeForm
    initialData={recipe}
    onSubmit={handleUpdateRecipe}
    isLoading={isLoading}
    submitLabel="Update Recipe"
    recipeId={recipe.id}
  />
  
  {canDelete && (
    <div className="mt-8 pt-8 border-t">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-destructive">
            Danger Zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Once you delete a recipe, there is no going back.
          </p>
        </div>
        <DeleteRecipeSection
          recipeId={recipe.id}
          recipeTitle={recipe.title}
        />
      </div>
    </div>
  )}
</div>
```

### 3. API Integration

**Endpoint:** `DELETE /api/recipes/[id]` (Already implemented)

**Current Implementation Review:**
The existing DELETE endpoint already includes:
- Authentication check (401 if not authenticated)
- Recipe existence check (404 if not found)
- Authorization check for owner, admin, or elevated roles (403 if unauthorized)
- Database deletion
- Success response (200 with message)
- Error handling (500 for server errors)

**No API changes required** - the existing implementation already meets all requirements.

### 4. ConfirmationModal Component

**Location:** `jump-to-recipe/src/components/ui/confirmation-modal.tsx` (Already exists)

**Current Features:**
- Modal dialog with backdrop
- Customizable title and description
- Configurable button text
- Variant support (default, destructive, warning)
- Loading state support
- Keyboard navigation (Escape to close, Tab trapping)
- Focus management
- Accessibility attributes (ARIA labels, roles)

**No changes required** - the existing component already supports all needed features for the delete confirmation flow.

## Data Models

### Recipe Model

No changes to the recipe data model are required. The deletion operates on existing recipe records.

**Relevant Fields:**
```typescript
interface Recipe {
  id: string;
  authorId: string;
  title: string;
  // ... other fields
}
```

### Session/User Model

The existing session model already includes the necessary fields:

```typescript
interface User {
  id: string;
  role?: 'user' | 'admin' | 'elevated';
  // ... other fields
}
```

### Cascade Deletion Considerations

When a recipe is deleted, the following related data should be handled:

1. **Recipe Photos** - Should be deleted (cascade)
2. **Cookbook Recipes** - Should be removed from cookbooks (cascade)
3. **Comments** - Should be deleted (cascade)
4. **Grocery List Items** - Should be removed (cascade)

**Note:** The database schema should already handle these cascades via foreign key constraints. Verify in the schema files that `ON DELETE CASCADE` is properly configured.

## Error Handling

### Error Scenarios and Responses

| Scenario | HTTP Status | User Message | Action |
|----------|-------------|--------------|--------|
| Not authenticated | 401 | "You must be logged in to delete recipes" | Redirect to login |
| Not authorized | 403 | "You don't have permission to delete this recipe" | Close modal, show toast |
| Recipe not found | 404 | "Recipe deleted successfully" | Treat as success (idempotent) |
| Network error | N/A | "Network error. Please check your connection and try again" | Keep modal open, allow retry |
| Server error | 500 | "Failed to delete recipe. Please try again" | Keep modal open, allow retry |
| Unknown error | N/A | "An unexpected error occurred. Please try again" | Keep modal open, allow retry |

### Error Handling Implementation

```typescript
const handleDelete = async () => {
  setIsDeleting(true);
  
  try {
    const response = await fetch(`/api/recipes/${recipeId}`, {
      method: 'DELETE',
    });
    
    // Treat 404 as success (recipe already deleted)
    if (response.status === 404 || response.ok) {
      toast({
        title: "Recipe deleted",
        description: "Recipe deleted successfully",
      });
      
      // Close modal
      setIsModalOpen(false);
      
      // Redirect to my recipes
      router.push('/my-recipes');
      
      // Call success callback if provided
      onDeleteSuccess?.();
      return;
    }
    
    // Handle authorization errors
    if (response.status === 401) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to delete recipes",
        variant: "destructive",
      });
      router.push('/auth/login');
      return;
    }
    
    if (response.status === 403) {
      toast({
        title: "Permission denied",
        description: "You don't have permission to delete this recipe",
        variant: "destructive",
      });
      setIsModalOpen(false);
      return;
    }
    
    // Handle other errors
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete recipe');
    
  } catch (error) {
    console.error('Error deleting recipe:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unexpected error occurred';
    
    toast({
      title: "Deletion failed",
      description: errorMessage,
      variant: "destructive",
    });
    
    // Call error callback if provided
    onDeleteError?.(error instanceof Error ? error : new Error(errorMessage));
    
  } finally {
    setIsDeleting(false);
  }
};
```

### Network Error Detection

```typescript
// Detect network errors
if (error instanceof TypeError && error.message.includes('fetch')) {
  toast({
    title: "Network error",
    description: "Please check your connection and try again",
    variant: "destructive",
  });
}
```

## Testing Strategy

### Unit Tests

**Component Tests:**

1. **DeleteRecipeSection Component**
   - Renders delete button correctly
   - Opens modal when delete button clicked
   - Closes modal when cancel clicked
   - Calls API when delete confirmed
   - Shows loading state during deletion
   - Handles successful deletion
   - Handles error scenarios
   - Disables button during loading

**Test File:** `jump-to-recipe/src/components/recipes/__tests__/delete-recipe-section.test.tsx`

```typescript
describe('DeleteRecipeSection', () => {
  it('renders delete button', () => {});
  it('opens confirmation modal on button click', () => {});
  it('closes modal on cancel', () => {});
  it('calls delete API on confirm', () => {});
  it('shows loading state during deletion', () => {});
  it('redirects on successful deletion', () => {});
  it('shows error toast on failure', () => {});
  it('treats 404 as success', () => {});
  it('handles network errors', () => {});
});
```

2. **Edit Page Integration**
   - Shows delete section for recipe owners
   - Shows delete section for admins
   - Hides delete section for non-owners
   - Properly checks permissions

**Test File:** `jump-to-recipe/src/app/recipes/[id]/edit/__tests__/page.test.tsx`

### Integration Tests

**API Integration:**

1. **DELETE /api/recipes/[id]** (Already tested)
   - Verify existing tests cover all scenarios
   - Ensure elevated role is tested
   - Verify cascade deletions work correctly

**Test File:** `jump-to-recipe/src/app/api/recipes/[id]/__tests__/route.test.ts`

### Manual Testing Checklist

- [ ] Recipe owner can see delete button
- [ ] Admin can see delete button on any recipe
- [ ] Elevated user can see delete button on any recipe
- [ ] Non-owner cannot see delete button
- [ ] Delete button opens confirmation modal
- [ ] Cancel button closes modal without deleting
- [ ] Delete button triggers API call
- [ ] Loading state shows during deletion
- [ ] Success toast appears after deletion
- [ ] User redirects to /my-recipes after deletion
- [ ] Error toast appears on failure
- [ ] Modal stays open on error
- [ ] Escape key closes modal
- [ ] Clicking backdrop closes modal
- [ ] Focus management works correctly
- [ ] Keyboard navigation works in modal
- [ ] Recipe no longer appears in lists after deletion
- [ ] Related data (photos, comments) are deleted

### Accessibility Testing

- [ ] Delete button has proper ARIA labels
- [ ] Modal has proper ARIA attributes
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces modal state
- [ ] Focus returns to trigger element after modal closes
- [ ] Destructive action is clearly indicated visually
- [ ] Color contrast meets WCAG AA standards

## Security Considerations

### Authorization

1. **Frontend Permission Check**
   - Check user role and ownership before showing delete button
   - Prevents UI clutter for unauthorized users
   - Not a security boundary (backend enforces)

2. **Backend Authorization**
   - Verify user is authenticated (401)
   - Verify user is owner, admin, or elevated (403)
   - This is the actual security boundary

3. **Audit Logging** (Future Enhancement)
   - Log admin deletions for audit trail
   - Include: admin user ID, recipe ID, recipe owner ID, timestamp
   - Helps track administrative actions

### Data Integrity

1. **Cascade Deletions**
   - Ensure foreign key constraints handle related data
   - Verify recipe photos are deleted
   - Verify cookbook associations are removed
   - Verify comments are deleted

2. **Idempotency**
   - Treat 404 responses as success
   - Prevents errors if recipe already deleted
   - Allows safe retries

### CSRF Protection

- Next.js API routes automatically include CSRF protection
- No additional implementation needed

## Performance Considerations

### Deletion Performance

- Single database DELETE operation
- Cascade deletions handled by database
- Expected completion time: < 500ms

### UI Responsiveness

- Optimistic UI not recommended (destructive action)
- Show loading state during deletion
- Disable buttons to prevent double-submission

### Network Optimization

- Single API call for deletion
- No need for prefetching or caching
- Error retry handled manually by user

## Future Enhancements

1. **Soft Delete**
   - Add `deletedAt` timestamp field
   - Allow recipe recovery within 30 days
   - Scheduled cleanup of old soft-deleted recipes

2. **Bulk Delete**
   - Allow selecting multiple recipes
   - Delete multiple recipes at once
   - Useful for recipe management page

3. **Delete Confirmation with Recipe Name**
   - Require typing recipe name to confirm
   - Extra safety for important recipes
   - Optional based on recipe metadata

4. **Undo Functionality**
   - Brief window to undo deletion
   - Requires soft delete implementation
   - Toast notification with undo button

5. **Admin Audit Log**
   - Track all admin deletions
   - Viewable in admin dashboard
   - Helps with moderation and accountability
