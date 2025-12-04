# Design Document

## Overview

The Admin User Management feature provides a comprehensive interface for administrators to manage user accounts within the Jump to Recipe application. The feature consists of three main components: a user list page with search and filtering capabilities, a user detail/edit page for modifying user information, and a user deletion workflow with mandatory content ownership reassignment.

This design leverages the existing Next.js 15 App Router architecture, Drizzle ORM for database operations, and shadcn/ui components for consistent UI patterns. The implementation follows the established authentication and authorization patterns already in place, with middleware-level protection for admin routes.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[User List Page<br/>/admin/users]
        B[User Detail Page<br/>/admin/users/[id]]
        C[Delete Confirmation Modal]
    end
    
    subgraph "API Layer"
        D[GET /api/admin/users]
        E[GET /api/admin/users/[id]]
        F[PUT /api/admin/users/[id]]
        G[DELETE /api/admin/users/[id]]
        H[GET /api/admin/users/transfer-candidates]
    end
    
    subgraph "Service Layer"
        I[User Service]
        J[Ownership Transfer Service]
    end
    
    subgraph "Data Layer"
        K[(PostgreSQL)]
        L[Users Table]
        M[Recipes Table]
        N[Cookbooks Table]
        O[Cookbook Collaborators Table]
    end
    
    A --> D
    B --> E
    B --> F
    C --> G
    C --> H
    
    D --> I
    E --> I
    F --> I
    G --> J
    H --> I
    
    I --> K
    J --> K
    
    K --> L
    K --> M
    K --> N
    K --> O
```

### Technology Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with JWT strategy
- **State Management**: React hooks and server components
- **Form Handling**: React Hook Form with Zod validation

### Route Structure

```
/admin/users                    # User list page (Server Component)
/admin/users/[id]              # User detail/edit page (Server Component)

/api/admin/users               # GET: List all users with counts
/api/admin/users/[id]          # GET: Get user details
                               # PUT: Update user details
                               # DELETE: Delete user with ownership transfer
/api/admin/users/transfer-candidates  # GET: List users for ownership transfer
```

## Components and Interfaces

### 1. User List Page (`/admin/users/page.tsx`)

**Type**: Server Component with Client Component for interactive features

**Responsibilities**:
- Fetch and display all users with associated counts
- Provide search, filter, and sort functionality
- Navigate to user detail page
- Trigger user deletion workflow

**Key Features**:
- Server-side data fetching for initial load
- Client-side filtering and sorting for performance
- Responsive table layout
- Action buttons for edit and delete

**Component Structure**:
```typescript
// Server Component
async function UsersPage() {
  const users = await fetchUsersWithCounts();
  return <UserListClient users={users} />;
}

// Client Component
function UserListClient({ users }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  // Filter and sort logic
  // Render table with actions
}
```

### 2. User Detail/Edit Page (`/admin/users/[id]/page.tsx`)

**Type**: Server Component with Client Component for form handling

**Responsibilities**:
- Display user information
- Allow editing of user profile fields
- Handle role changes
- Provide password update functionality
- Show associated resource counts

**Key Features**:
- Form validation with Zod schema
- Optimistic UI updates
- Toast notifications for success/error
- Disabled state during submission
- Password update modal

**Component Structure**:
```typescript
// Server Component
async function UserDetailPage({ params }) {
  const user = await fetchUserWithCounts(params.id);
  return <UserEditForm user={user} />;
}

// Client Component
function UserEditForm({ user }) {
  const form = useForm({
    resolver: zodResolver(userEditSchema),
    defaultValues: user,
  });
  
  // Form submission logic
  // Password modal logic
  // Render form fields
}
```

### 3. Delete Confirmation Modal

**Type**: Client Component

**Responsibilities**:
- Display deletion warning
- Require ownership transfer selection
- Confirm irreversible action
- Handle deletion API call

**Key Features**:
- Dropdown for selecting new owner
- Validation to ensure owner is selected
- Loading state during deletion
- Error handling

**Component Structure**:
```typescript
function DeleteUserModal({ 
  isOpen, 
  onClose, 
  userId, 
  userName,
  onSuccess 
}) {
  const [newOwnerId, setNewOwnerId] = useState('');
  const [transferCandidates, setTransferCandidates] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch transfer candidates
  // Handle deletion
  // Render modal with dropdown
}
```

### 4. API Routes

#### GET `/api/admin/users`

**Purpose**: Fetch all users with recipe and cookbook counts

**Response**:
```typescript
{
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    recipeCount: number;
    cookbookCount: number;
    createdAt: string;
    updatedAt: string;
  }>
}
```

**Implementation**:
```typescript
// Use Drizzle ORM with joins and aggregations
const users = await db
  .select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    recipeCount: sql<number>`count(distinct ${recipes.id})`,
    cookbookCount: sql<number>`count(distinct ${cookbooks.id})`,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  })
  .from(users)
  .leftJoin(recipes, eq(recipes.authorId, users.id))
  .leftJoin(cookbooks, eq(cookbooks.ownerId, users.id))
  .groupBy(users.id);
```

#### GET `/api/admin/users/[id]`

**Purpose**: Fetch detailed user information

**Response**:
```typescript
{
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
    recipeCount: number;
    cookbookCount: number;
    createdAt: string;
    updatedAt: string;
  }
}
```

#### PUT `/api/admin/users/[id]`

**Purpose**: Update user profile and role

**Request Body**:
```typescript
{
  name: string;
  email: string;
  role: 'regular' | 'elevated' | 'admin';
  password?: string; // Optional, only if updating password
}
```

**Validation**:
- Email format validation
- Email uniqueness check (excluding current user)
- Role enum validation
- Password hashing if provided

**Response**:
```typescript
{
  success: true;
  user: UpdatedUser;
}
```

#### DELETE `/api/admin/users/[id]`

**Purpose**: Delete user and transfer ownership

**Request Body**:
```typescript
{
  newOwnerId: string;
}
```

**Implementation Flow**:
1. Validate new owner exists and is not the user being deleted
2. Check that user being deleted is not the last admin
3. Begin database transaction
4. Transfer recipe ownership
5. Transfer cookbook ownership
6. Remove user from collaborator lists
7. Delete user account
8. Commit transaction
9. Return success

**Response**:
```typescript
{
  success: true;
  message: string;
}
```

#### GET `/api/admin/users/transfer-candidates`

**Purpose**: Get list of users who can receive transferred content

**Query Parameters**:
- `excludeUserId`: User ID to exclude from list

**Response**:
```typescript
{
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>
}
```

## Data Models

### User Model (Existing)

```typescript
{
  id: string;              // UUID
  name: string;            // Max 255 chars
  email: string;           // Max 255 chars, unique
  emailVerified: Date | null;
  password: string | null; // Hashed, null for OAuth users
  image: string | null;
  role: string;            // 'regular' | 'elevated' | 'admin'
  createdAt: Date;
  updatedAt: Date;
}
```

### Extended User Model (with counts)

```typescript
{
  ...User,
  recipeCount: number;     // Count of recipes authored
  cookbookCount: number;   // Count of cookbooks owned
}
```

### Validation Schemas

#### User Edit Schema

```typescript
const userEditSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email format').max(255),
  role: z.enum(['regular', 'elevated', 'admin']),
});
```

#### Password Update Schema

```typescript
const passwordUpdateSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
```

#### User Delete Schema

```typescript
const userDeleteSchema = z.object({
  newOwnerId: z.string().uuid('Invalid user ID'),
});
```

## Error Handling

### Client-Side Error Handling

1. **Form Validation Errors**: Display inline validation messages using React Hook Form
2. **API Errors**: Show toast notifications with error details
3. **Network Errors**: Display user-friendly messages and retry options
4. **Loading States**: Disable buttons and show loading indicators

### Server-Side Error Handling

1. **Authentication Errors**: Return 401 Unauthorized
2. **Authorization Errors**: Return 403 Forbidden
3. **Validation Errors**: Return 400 Bad Request with details
4. **Database Errors**: Return 500 Internal Server Error, rollback transactions
5. **Not Found Errors**: Return 404 Not Found

### Error Response Format

```typescript
{
  error: string;           // Error message
  details?: string;        // Additional details
  code?: string;          // Error code for client handling
}
```

### Transaction Rollback

For user deletion, all database operations are wrapped in a transaction:

```typescript
await db.transaction(async (tx) => {
  // Transfer recipes
  await tx.update(recipes)
    .set({ authorId: newOwnerId })
    .where(eq(recipes.authorId, userId));
  
  // Transfer cookbooks
  await tx.update(cookbooks)
    .set({ ownerId: newOwnerId })
    .where(eq(cookbooks.ownerId, userId));
  
  // Remove from collaborators
  await tx.delete(cookbookCollaborators)
    .where(eq(cookbookCollaborators.userId, userId));
  
  // Delete user
  await tx.delete(users)
    .where(eq(users.id, userId));
});
```

## Testing Strategy

### Unit Tests

1. **Validation Schemas**: Test all validation rules
2. **Utility Functions**: Test sorting, filtering, and search logic
3. **Service Functions**: Test ownership transfer logic

### Integration Tests

1. **API Routes**: Test all endpoints with various scenarios
   - Successful operations
   - Validation failures
   - Authorization failures
   - Database errors
2. **Database Operations**: Test transaction rollback on errors
3. **Ownership Transfer**: Verify all content is transferred correctly

### Component Tests

1. **User List**: Test search, filter, and sort functionality
2. **User Edit Form**: Test form validation and submission
3. **Delete Modal**: Test validation and confirmation flow

### E2E Tests (Optional)

1. Complete user management workflow
2. User deletion with ownership transfer
3. Role change and permission updates

### Test Data Setup

```typescript
// Create test users with various roles
const testUsers = [
  { name: 'Admin User', email: 'admin@test.com', role: 'admin' },
  { name: 'Regular User', email: 'user@test.com', role: 'regular' },
  { name: 'Elevated User', email: 'elevated@test.com', role: 'elevated' },
];

// Create test recipes and cookbooks
const testRecipes = [
  { title: 'Test Recipe', authorId: regularUser.id },
];

const testCookbooks = [
  { title: 'Test Cookbook', ownerId: regularUser.id },
];
```

## Security Considerations

### Authentication and Authorization

1. **Middleware Protection**: Admin routes protected at middleware level
2. **API Route Protection**: Double-check admin role in API routes
3. **Session Validation**: Verify JWT token on every request
4. **Role Hierarchy**: Enforce role-based access control

### Data Protection

1. **Password Hashing**: Use bcrypt with appropriate salt rounds
2. **SQL Injection Prevention**: Use parameterized queries via Drizzle ORM
3. **XSS Prevention**: Sanitize user inputs, use React's built-in escaping
4. **CSRF Protection**: NextAuth.js handles CSRF tokens

### Business Logic Protection

1. **Last Admin Check**: Prevent deletion of last admin user
2. **Self-Deletion Check**: Consider preventing admins from deleting themselves
3. **Email Uniqueness**: Enforce at database and application level
4. **Transaction Integrity**: Use database transactions for multi-step operations

### Audit Logging (Future Enhancement)

Consider adding audit logs for:
- User role changes
- User deletions
- Ownership transfers
- Failed authorization attempts

## Performance Considerations

### Database Optimization

1. **Indexes**: Ensure indexes on frequently queried columns
   - `users.email` (already unique, indexed)
   - `users.role`
   - `recipes.authorId`
   - `cookbooks.ownerId`

2. **Query Optimization**: Use joins and aggregations efficiently
   - Fetch counts in single query using SQL aggregations
   - Limit data fetched to only required fields

3. **Pagination**: Implement pagination for user list if user count grows large
   - Server-side pagination for scalability
   - Client-side pagination for better UX with moderate data

### Client-Side Optimization

1. **Debounced Search**: Debounce search input to reduce re-renders
2. **Memoization**: Use React.memo for table rows
3. **Virtual Scrolling**: Consider for very large user lists (future)

### Caching Strategy

1. **Server-Side Caching**: Cache user list with short TTL
2. **Client-Side Caching**: Use SWR or React Query for data fetching (future)
3. **Revalidation**: Revalidate after mutations

## UI/UX Design

### User List Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ User Management                                          │
├─────────────────────────────────────────────────────────┤
│ [Search...] [Role Filter ▼] [Sort ▼]                   │
├─────────────────────────────────────────────────────────┤
│ Name     │ Email        │ Role    │ Recipes │ Cookbooks │
├──────────┼──────────────┼─────────┼─────────┼───────────┤
│ John Doe │ john@ex.com  │ Admin   │ 5       │ 2         │
│ Jane Doe │ jane@ex.com  │ Regular │ 12      │ 3         │
│ ...                                                      │
└─────────────────────────────────────────────────────────┘
```

### User Detail Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Users                                          │
├─────────────────────────────────────────────────────────┤
│ Edit User: John Doe                                      │
├─────────────────────────────────────────────────────────┤
│ User ID: abc-123 (read-only)                            │
│ Name: [John Doe                    ]                    │
│ Email: [john@example.com           ]                    │
│ Role: [Admin ▼]                                         │
│ Password: [Update Password...]                          │
│                                                          │
│ Created: 2024-01-01                                     │
│ Updated: 2024-01-15                                     │
│                                                          │
│ Resources:                                              │
│ - Recipes: 5                                            │
│ - Cookbooks: 2                                          │
│                                                          │
│ [Save Changes] [Delete User]                            │
└─────────────────────────────────────────────────────────┘
```

### Delete Confirmation Modal

```
┌─────────────────────────────────────────────────────────┐
│ ⚠ Delete User                                      [×]  │
├─────────────────────────────────────────────────────────┤
│ Are you sure you want to delete John Doe?               │
│                                                          │
│ This action is irreversible. All recipes and cookbooks  │
│ owned by this user will be transferred to the selected  │
│ user.                                                    │
│                                                          │
│ Transfer content to:                                    │
│ [Select user ▼]                                         │
│                                                          │
│                              [Cancel] [Delete User]     │
└─────────────────────────────────────────────────────────┘
```

### Accessibility Features

1. **Keyboard Navigation**: Full keyboard support for all interactions
2. **Screen Reader Support**: Proper ARIA labels and roles
3. **Focus Management**: Logical focus order, visible focus indicators
4. **Color Contrast**: WCAG AA compliant color contrast ratios
5. **Error Announcements**: Screen reader announcements for errors

## Migration and Deployment

### Database Migrations

No schema changes required - using existing tables:
- `users`
- `recipes`
- `cookbooks`
- `cookbook_collaborators`

### Deployment Steps

1. Deploy API routes
2. Deploy admin pages
3. Test in staging environment
4. Deploy to production
5. Monitor for errors

### Rollback Plan

1. Revert API route changes
2. Revert page changes
3. No database rollback needed (no schema changes)

## Future Enhancements

1. **Bulk Operations**: Select and update multiple users
2. **Audit Logs**: Track all admin actions
3. **User Activity**: Show last login, activity metrics
4. **Email Notifications**: Notify users of role changes
5. **Advanced Filtering**: Filter by date ranges, activity level
6. **Export Functionality**: Export user list to CSV
7. **User Impersonation**: Allow admins to view app as specific user
8. **Two-Factor Authentication**: Add 2FA management for users
