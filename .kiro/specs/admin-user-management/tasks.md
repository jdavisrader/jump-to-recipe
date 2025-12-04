# Implementation Plan

- [x] 1. Create API routes for user management
  - Create API endpoints for fetching, updating, and deleting users
  - Implement server-side validation and authorization
  - _Requirements: 1.1, 2.1, 2.9, 2.10, 3.6, 3.7, 3.8, 3.9, 4.3, 5.1, 5.6_

- [x] 1.1 Create GET /api/admin/users endpoint
  - Implement endpoint to fetch all users with recipe and cookbook counts
  - Use Drizzle ORM with left joins and SQL aggregations
  - Return user list with counts in JSON format
  - _Requirements: 1.1, 1.2, 4.3_

- [x] 1.2 Create GET /api/admin/users/[id] endpoint
  - Implement endpoint to fetch single user details with counts
  - Validate user ID parameter
  - Return 404 if user not found
  - _Requirements: 2.1, 2.3, 4.3_

- [x] 1.3 Create PUT /api/admin/users/[id] endpoint
  - Implement endpoint to update user profile and role
  - Validate request body with Zod schema
  - Check email uniqueness (excluding current user)
  - Hash password if provided
  - Return updated user data
  - _Requirements: 2.7, 2.8, 2.9, 2.10, 4.3, 5.1, 5.2, 5.3, 5.4_

- [x] 1.4 Create DELETE /api/admin/users/[id] endpoint
  - Implement endpoint to delete user with ownership transfer
  - Validate new owner ID from request body
  - Check that user is not the last admin
  - Use database transaction for all operations
  - Transfer recipe ownership to new owner
  - Transfer cookbook ownership to new owner
  - Remove user from cookbook collaborator lists
  - Delete user account
  - Rollback on any error
  - _Requirements: 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 4.3, 5.5, 5.6, 5.7_

- [x] 1.5 Create GET /api/admin/users/transfer-candidates endpoint
  - Implement endpoint to fetch users for ownership transfer dropdown
  - Accept excludeUserId query parameter
  - Return list of users excluding the specified user
  - _Requirements: 3.2, 3.3_

- [x] 2. Create validation schemas and types
  - Define TypeScript types and Zod schemas for user management
  - Create validation schemas for API requests
  - _Requirements: 5.1, 5.2_

- [x] 2.1 Create user management types
  - Define UserWithCounts type extending base User type
  - Define UserEditRequest and UserDeleteRequest types
  - Define API response types
  - _Requirements: 1.2, 2.1, 2.3_

- [x] 2.2 Create Zod validation schemas
  - Create userEditSchema for profile updates
  - Create passwordUpdateSchema for password changes
  - Create userDeleteSchema for deletion with transfer
  - Export schemas for use in API routes and forms
  - _Requirements: 5.1, 5.2, 5.4_

- [x] 3. Build user list page
  - Create user list page with table, search, filter, and sort
  - Implement client-side filtering and sorting for performance
  - Add navigation to user detail page
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 3.1 Create server component for user list page
  - Create /admin/users/page.tsx as server component
  - Fetch users with counts on server side
  - Pass data to client component
  - Add authorization check
  - _Requirements: 1.1, 1.2, 4.1_

- [x] 3.2 Create client component for user table
  - Create UserListClient component with search input
  - Implement role filter dropdown
  - Implement sortable table headers
  - Add default sort by name
  - Display all required columns (name, email, role, counts, dates)
  - Add edit and delete action buttons
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 3.3 Implement search and filter logic
  - Add search state for filtering by name or email
  - Add role filter state
  - Implement client-side filtering function
  - Update table display based on filters
  - _Requirements: 1.4, 1.5_

- [x] 3.4 Implement sorting logic
  - Add sort state with key and direction
  - Implement sort function for all columns
  - Add visual indicators for sort direction
  - Handle click events on table headers
  - _Requirements: 1.6_

- [x] 4. Build user detail and edit page
  - Create user detail page with editable form
  - Implement form validation and submission
  - Add password update modal
  - Display resource counts
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

- [x] 4.1 Create server component for user detail page
  - Create /admin/users/[id]/page.tsx as server component
  - Fetch user details with counts on server side
  - Pass data to client component
  - Add authorization check
  - Handle user not found case
  - _Requirements: 2.1, 2.3, 4.2_

- [x] 4.2 Create user edit form component
  - Create UserEditForm client component
  - Use React Hook Form with Zod resolver
  - Add input fields for name, email, and role
  - Display non-editable fields (ID, dates)
  - Display resource counts
  - Add Save button with disabled state during submission
  - _Requirements: 2.2, 2.3, 2.4, 2.6, 2.7_

- [x] 4.3 Implement form submission logic
  - Handle form submit event
  - Call PUT API endpoint
  - Disable Save button during submission
  - Show success toast on successful update
  - Show error toast on failure
  - Re-enable button on error
  - _Requirements: 2.7, 2.8, 2.9_

- [x] 4.4 Create password update modal
  - Create PasswordUpdateModal component
  - Add password input field with validation
  - Show modal when password field is clicked
  - Submit password update to API
  - Show success/error feedback
  - _Requirements: 2.5_

- [x] 4.5 Add delete user button
  - Add Delete User button to form
  - Trigger delete confirmation modal on click
  - Pass user data to modal
  - _Requirements: 3.1_

- [x] 5. Build delete confirmation modal
  - Create modal for user deletion with ownership transfer
  - Implement transfer candidate selection
  - Handle deletion API call
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.10, 3.11, 3.12_

- [x] 5.1 Create delete user modal component
  - Create DeleteUserModal client component
  - Accept props for user data and callbacks
  - Extend existing ConfirmationModal or create custom modal
  - Display warning about irreversible action
  - _Requirements: 3.1, 3.4_

- [x] 5.2 Add ownership transfer dropdown
  - Fetch transfer candidates on modal open
  - Create dropdown with user list
  - Exclude user being deleted from list
  - Add state for selected new owner
  - _Requirements: 3.2, 3.3_

- [x] 5.3 Implement deletion logic
  - Validate that new owner is selected
  - Show validation error if not selected
  - Call DELETE API endpoint with new owner ID
  - Show loading state during deletion
  - Show success toast on completion
  - Show error toast on failure
  - Redirect to user list on success
  - _Requirements: 3.5, 3.10, 3.11, 3.12_

- [x] 6. Add navigation and integration
  - Connect all pages and components
  - Add navigation links
  - Ensure proper routing
  - _Requirements: 1.7, 2.1_

- [x] 6.1 Update admin dashboard with user management link
  - Add link to /admin/users from admin dashboard
  - Update admin navigation if exists
  - _Requirements: 1.1_

- [x] 6.2 Add back navigation to user detail page
  - Add back button to return to user list
  - Preserve any filters or search state if possible
  - _Requirements: 2.1_

- [x] 6.3 Wire up edit action from user list
  - Implement navigation to user detail page on edit click
  - Pass user ID in URL
  - _Requirements: 1.7_

- [x] 6.4 Wire up delete action from user list
  - Open delete confirmation modal on delete click
  - Pass user data to modal
  - Refresh user list after successful deletion
  - _Requirements: 1.8_

- [x] 7. Add error handling and loading states
  - Implement comprehensive error handling
  - Add loading indicators
  - Show user-friendly error messages
  - _Requirements: 2.8, 2.9, 3.12_

- [x] 7.1 Add loading states to user list
  - Show skeleton loader while fetching users
  - Handle empty state when no users exist
  - Handle error state if fetch fails
  - _Requirements: 1.1_

- [x] 7.2 Add loading states to user detail page
  - Show skeleton loader while fetching user
  - Handle user not found error
  - Show loading indicator during form submission
  - _Requirements: 2.1, 2.7_

- [x] 7.3 Add error handling to API routes
  - Catch and handle database errors
  - Return appropriate HTTP status codes
  - Return user-friendly error messages
  - Log errors for debugging
  - _Requirements: 2.8, 2.9, 3.12, 4.3, 5.7_

- [x] 8. Implement authorization checks
  - Add admin role checks to all routes
  - Ensure middleware protection is working
  - Add defense-in-depth checks
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8.1 Verify middleware protection
  - Confirm middleware redirects non-admin users
  - Test with different user roles
  - _Requirements: 4.1, 4.2_

- [x] 8.2 Add authorization to API routes
  - Check admin role in all API route handlers
  - Return 403 Forbidden for non-admin users
  - Verify session exists before checking role
  - _Requirements: 4.3_

- [x] 8.3 Add last admin protection
  - Check if user being deleted is last admin
  - Prevent deletion if true
  - Return appropriate error message
  - _Requirements: 5.5_

- [x] 9. Write unit tests for validation and utilities
  - Test validation schemas
  - Test utility functions
  - Ensure edge cases are covered
  - _Requirements: All validation requirements_

- [x] 9.1 Test Zod validation schemas
  - Test userEditSchema with valid and invalid inputs
  - Test passwordUpdateSchema with various password lengths
  - Test userDeleteSchema with valid and invalid UUIDs
  - Test email format validation
  - Test role enum validation
  - _Requirements: 5.1, 5.2_

- [x] 9.2 Test search and filter utilities
  - Test search function with various inputs
  - Test role filter logic
  - Test sort function for all columns
  - Test edge cases (empty strings, special characters)
  - _Requirements: 1.4, 1.5, 1.6_

- [x] 10. Write integration tests for API routes
  - Test all API endpoints with various scenarios
  - Test authorization and error handling
  - Test database operations
  - _Requirements: All API-related requirements_

- [x] 10.1 Test GET /api/admin/users endpoint
  - Test successful fetch with counts
  - Test with no users in database
  - Test authorization (non-admin access)
  - Test database error handling
  - _Requirements: 1.1, 4.3_

- [x] 10.2 Test GET /api/admin/users/[id] endpoint
  - Test successful fetch of user details
  - Test with invalid user ID
  - Test with non-existent user (404)
  - Test authorization
  - _Requirements: 2.1, 4.3_

- [x] 10.3 Test PUT /api/admin/users/[id] endpoint
  - Test successful user update
  - Test email uniqueness validation
  - Test invalid email format
  - Test role update
  - Test password hashing
  - Test authorization
  - Test validation errors
  - _Requirements: 2.7, 2.8, 2.9, 4.3, 5.1, 5.2, 5.3, 5.4_

- [x] 10.4 Test DELETE /api/admin/users/[id] endpoint
  - Test successful deletion with ownership transfer
  - Test transaction rollback on error
  - Test last admin protection
  - Test invalid new owner ID
  - Test missing new owner ID
  - Test authorization
  - Verify recipes are transferred
  - Verify cookbooks are transferred
  - Verify collaborator removal
  - _Requirements: 3.5, 3.6, 3.7, 3.8, 3.9, 4.3, 5.5, 5.6, 5.7_

- [x] 10.5 Test GET /api/admin/users/transfer-candidates endpoint
  - Test successful fetch of candidates
  - Test exclusion of specified user
  - Test with no other users available
  - Test authorization
  - _Requirements: 3.2, 3.3, 4.3_

- [x] 11. Write component tests
  - Test React components with user interactions
  - Test form validation and submission
  - Test modal behavior
  - _Requirements: All UI-related requirements_

- [x] 11.1 Test UserListClient component
  - Test search input updates filter
  - Test role filter dropdown
  - Test table sorting on header click
  - Test edit button navigation
  - Test delete button opens modal
  - Test empty state display
  - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 11.2 Test UserEditForm component
  - Test form field rendering
  - Test form validation errors
  - Test successful form submission
  - Test error handling on submission failure
  - Test Save button disabled state
  - Test password modal trigger
  - Test delete button trigger
  - _Requirements: 2.2, 2.5, 2.6, 2.7, 2.8, 2.9_

- [x] 11.3 Test DeleteUserModal component
  - Test modal open/close behavior
  - Test transfer candidate dropdown
  - Test validation when no owner selected
  - Test successful deletion flow
  - Test error handling
  - Test loading state
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.10, 3.11, 3.12_

- [x] 11.4 Test PasswordUpdateModal component
  - Test modal open/close behavior
  - Test password validation
  - Test successful password update
  - Test error handling
  - _Requirements: 2.5, 5.4_
