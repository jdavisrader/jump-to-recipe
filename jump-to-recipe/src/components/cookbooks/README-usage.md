# Admin Cookbook Management Components Usage

This document explains how to properly use the admin cookbook management components to avoid React Server Component errors.

## The Problem

The error you encountered:
```
Error: Event handlers cannot be passed to Client Component props.
<... cookbookId=... currentOwner=... onTransfer={function onTransfer}>
```

This happens when a Server Component tries to pass function props to Client Components.

## The Solution

Use the provided wrapper components that handle the server-client boundary properly.

### ✅ Correct Usage (Server Component) - RECOMMENDED

```tsx
// In a Server Component (page.tsx, layout.tsx, etc.)
import { AdminCookbookManagementStandalone } from '@/components/cookbooks/admin-cookbook-management-standalone';

export default async function AdminCookbookPage({ params }: { params: { id: string } }) {
  // Fetch data in Server Component
  const cookbook = await fetchCookbook(params.id);
  const collaborators = await fetchCollaborators(params.id);

  return (
    <div>
      <h1>Admin: {cookbook.title}</h1>
      
      {/* ✅ RECOMMENDED - Completely standalone, no function props */}
      <AdminCookbookManagementStandalone 
        cookbook={cookbook}
        collaborators={collaborators}
      />
    </div>
  );
}
```

### ✅ Alternative Usage (Server Component)

```tsx
// Alternative approach using the server wrapper
import { AdminCookbookManagementServer } from '@/components/cookbooks/admin-cookbook-management-server';

export default async function AdminCookbookPage({ params }: { params: { id: string } }) {
  const cookbook = await fetchCookbook(params.id);
  const collaborators = await fetchCollaborators(params.id);

  return (
    <div>
      <h1>Admin: {cookbook.title}</h1>
      
      {/* ✅ This also works - wrapper handles functions internally */}
      <AdminCookbookManagementServer 
        cookbook={cookbook}
        collaborators={collaborators}
      />
    </div>
  );
}
```

### ✅ Correct Usage (Client Component)

```tsx
// In a Client Component
'use client';

import { AdminCookbookManagement } from '@/components/cookbooks/admin-cookbook-management';

export function MyClientComponent({ cookbook, collaborators }) {
  return (
    <div>
      {/* ✅ This works - functions are handled internally */}
      <AdminCookbookManagement 
        cookbook={cookbook}
        collaborators={collaborators}
      />
    </div>
  );
}
```

### ❌ Incorrect Usage (Causes Error)

```tsx
// In a Server Component - DON'T DO THIS
import { AdminOwnershipTransfer } from '@/components/cookbooks/admin-ownership-transfer';

export default async function AdminCookbookPage({ params }: { params: { id: string } }) {
  const cookbook = await fetchCookbook(params.id);

  // ❌ This causes the error - passing function from Server Component
  const handleTransfer = (newOwnerId: string) => {
    // This function cannot be serialized
  };

  return (
    <AdminOwnershipTransfer 
      cookbookId={cookbook.id}
      currentOwner={cookbook.owner}
      onTransfer={handleTransfer} // ❌ Error: function prop from Server Component
    />
  );
}
```

## Component Architecture

```
AdminCookbookManagementServer (Server Component)
└── AdminCookbookManagement (Client Component)
    ├── AdminOwnershipTransfer (Client Component)
    └── AdminCollaboratorManager (Client Component)
```

## Available Components

### 1. `AdminCookbookManagementStandalone` ⭐ RECOMMENDED
- **Use in**: Server Components (safest option)
- **Props**: `cookbook`, `collaborators` (data only)
- **Purpose**: Completely self-contained, no function props needed
- **Features**: Handles all interactions internally, refreshes page on changes

### 2. `AdminCookbookManagementServer`
- **Use in**: Server Components
- **Props**: `cookbook`, `collaborators` (data only)
- **Purpose**: Safe wrapper for Server Components

### 3. `AdminCookbookManagement`
- **Use in**: Client Components
- **Props**: `cookbook`, `collaborators` (data only)
- **Purpose**: Handles state and event handlers internally

### 4. `AdminOwnershipTransferStandalone`
- **Use in**: Server Components (individual component)
- **Props**: `cookbookId`, `currentOwner` (data only)
- **Purpose**: Standalone ownership transfer, no callbacks needed

### 5. `AdminCollaboratorManagerStandalone`
- **Use in**: Server Components (individual component)
- **Props**: `cookbookId`, `collaborators` (data only)
- **Purpose**: Standalone collaborator management, no callbacks needed

### 6. `AdminOwnershipTransfer`
- **Use in**: Client Components only
- **Props**: `cookbookId`, `currentOwner`, `onTransfer?`, `refreshOnTransfer?`
- **Purpose**: Direct component for ownership transfer with optional callbacks

### 7. `AdminCollaboratorManager`
- **Use in**: Client Components only
- **Props**: `cookbookId`, `collaborators`, `onUpdate?`, `refreshOnUpdate?`
- **Purpose**: Direct component for collaborator management with optional callbacks

## Best Practices

1. **Server Components**: Always use `AdminCookbookManagementServer`
2. **Client Components**: Use `AdminCookbookManagement` or individual components
3. **Data Fetching**: Fetch data in Server Components when possible
4. **State Management**: Let the wrapper components handle internal state
5. **Error Handling**: The components include built-in error handling and toast notifications

## Type Safety

All components use proper TypeScript types:

```tsx
import type { 
  CookbookWithMetadata, 
  CollaboratorWithUser 
} from '@/types/admin-cookbook';
```

This ensures compile-time safety and proper IntelliSense support.