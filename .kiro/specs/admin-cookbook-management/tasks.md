# Implementation Plan

- [x] 1. Set up admin cookbook API endpoints
  - Create `/api/admin/cookbooks` route for fetching all cookbooks with metadata
  - Implement database query with joins to get owner, collaborator count, and recipe count
  - Add proper error handling and admin authorization checks
  - _Requirements: 1.1, 1.2_

- [x] 2. Create admin cookbook list page
  - [x] 2.1 Implement server component for `/admin/cookbooks` page
    - Set up page structure with admin breadcrumb and header
    - Fetch cookbooks data using optimized database query
    - Handle authorization and error states
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 Build cookbook list client component
    - Create table layout with title, owner, collaborator count, recipe count, and date columns
    - Implement search functionality for cookbook titles
    - Add owner filter dropdown with user selection
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.3 Add sorting and pagination functionality
    - Implement title sorting (A-Z, Z-A) and date sorting (newest, oldest)
    - Add pagination controls with configurable page size
    - Maintain URL state for bookmarking and navigation
    - _Requirements: 1.5, 1.6, 1.7_

- [x] 3. Extend cookbook permissions for admin access
  - [x] 3.1 Update cookbook permission utilities
    - Modify `getCookbookPermission` function to grant admin universal access
    - Update `hasMinimumPermission` to bypass checks for admin users
    - Add admin role validation helpers
    - _Requirements: 2.4, 3.4, 4.6_

  - [x] 3.2 Enhance existing cookbook pages for admin access
    - Update cookbook detail page to show admin actions for non-owned cookbooks
    - Modify cookbook edit page to display admin-only sections
    - Ensure admin can access edit functionality regardless of ownership
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [x] 4. Implement admin collaborator management
  - [x] 4.1 Create admin collaborator manager component
    - Build UI to display current cookbook collaborators
    - Implement user search functionality for adding collaborators
    - Add remove collaborator functionality with confirmation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 Create collaborator management API endpoints
    - Implement `POST /api/admin/cookbooks/[id]/collaborators` for adding collaborators
    - Create `DELETE /api/admin/cookbooks/[id]/collaborators/[userId]` for removal
    - Add proper validation and admin authorization
    - _Requirements: 4.3, 4.4, 4.6_

- [x] 5. Implement admin ownership transfer
  - [x] 5.1 Create ownership transfer component
    - Build searchable user dropdown for selecting new owner
    - Add validation to ensure owner selection is required
    - Implement confirmation dialog for ownership changes
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 5.2 Create ownership transfer API endpoint
    - Implement `PUT /api/admin/cookbooks/[id]/owner` endpoint
    - Add database transaction for safe ownership updates
    - Validate admin permissions and user existence
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [x] 6. Enhance cookbook deletion for admin access
  - Update existing cookbook delete functionality to work for admin users
  - Ensure admin can delete any cookbook regardless of ownership
  - Maintain existing confirmation dialog and error handling
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 7. Add admin cookbook management types and validation
  - Create TypeScript interfaces for admin cookbook data structures
  - Add Zod schemas for API request validation
  - Define proper error types and response formats
  - _Requirements: 1.2, 4.3, 5.3_

- [ ]* 8. Write unit tests for admin cookbook functionality
  - Test admin cookbook list component search and filter functionality
  - Test collaborator management component add/remove operations
  - Test ownership transfer component user selection and validation
  - Test permission utility functions for admin access
  - _Requirements: 1.3, 1.4, 4.3, 4.4, 5.2, 5.3_

- [ ]* 9. Write integration tests for admin cookbook API endpoints
  - Test admin cookbook list endpoint with proper data aggregation
  - Test collaborator management endpoints with database updates
  - Test ownership transfer endpoint with transaction handling
  - Test admin permission bypass in existing cookbook endpoints
  - _Requirements: 1.1, 4.3, 4.4, 5.4, 5.5_