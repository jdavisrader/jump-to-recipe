# AssignOwnerSection Component Usage

## Overview
The `AssignOwnerSection` component provides an admin-only interface for transferring recipe ownership to different users. It features a searchable dropdown with user filtering capabilities.

## Component Features
- ✅ Admin-only visibility (returns null for non-admin users)
- ✅ Fetches all users from `/api/admin/users` endpoint on mount
- ✅ Searchable dropdown using shadcn Select component
- ✅ Search/filter functionality for user name and email
- ✅ Displays current owner as preselected value
- ✅ Validation to ensure owner is always selected (required field)
- ✅ onChange handler to update parent component state
- ✅ Styled with border and padding to match existing form sections

## Props Interface

```typescript
interface AssignOwnerSectionProps {
  currentOwnerId: string;        // Current recipe owner's ID
  currentOwnerName: string;      // Current recipe owner's name
  currentOwnerEmail: string;     // Current recipe owner's email
  onOwnerChange: (newOwnerId: string) => void;  // Callback when owner changes
  isAdmin: boolean;              // Whether current user is admin
}
```

## Usage Example

```typescript
import { AssignOwnerSection } from '@/components/recipes';

function RecipeEditPage() {
  const [selectedOwnerId, setSelectedOwnerId] = useState(recipe.authorId);
  const { data: session } = useSession();
  
  const handleOwnerChange = (newOwnerId: string) => {
    setSelectedOwnerId(newOwnerId);
    // Update will be sent when form is submitted
  };
  
  return (
    <div>
      <RecipeForm {...props} />
      
      {/* Admin-only section for ownership transfer */}
      <AssignOwnerSection
        currentOwnerId={recipe.authorId}
        currentOwnerName={recipe.authorName}
        currentOwnerEmail={recipe.authorEmail}
        onOwnerChange={handleOwnerChange}
        isAdmin={session?.user?.role === 'admin'}
      />
      
      <DeleteRecipeSection {...props} />
    </div>
  );
}
```

## Integration with Recipe Edit Page

The component should be integrated into the recipe edit page between the main form and the danger zone:

1. Add state for tracking selected owner
2. Pass current recipe owner information
3. Handle owner change in the form submission
4. Only send `authorId` to API when it has changed

## API Requirements

The component expects the `/api/admin/users` endpoint to return:

```typescript
{
  users: Array<{
    id: string;
    name: string;
    email: string;
    // ... other user fields
  }>
}
```

## Validation

- Owner field is marked as required with `*`
- Shows validation error if no owner is selected
- Displays current owner information when unchanged
- Search functionality filters users in real-time

## Accessibility

- Proper ARIA labels on form controls
- Required field indicator (`*`)
- Error messages with `role="alert"`
- Keyboard navigation support via Select component
- Loading states for better UX

## Styling

The component uses:
- Border and rounded corners for visual separation
- Padding for internal spacing
- Consistent spacing with `space-y-4`
- Muted text for helper information
- Destructive color for validation errors
