# Implementation Plan

- [x] 1. Set up admin recipes API infrastructure
  - Create `/api/admin/recipes/route.ts` with GET endpoint that fetches all recipes with author information using a left join
  - Implement admin authorization check using `getServerSession` and role verification
  - Return recipes with author name, email, visibility, dates, and metadata
  - _Requirements: 1.1, 1.2, 7.1, 7.5_

- [x] 2. Enhance recipe permissions library
  - Add `canPerformAdminAction` function to verify admin privileges
  - Add `updateRecipeAsAdmin` function to handle ownership transfers with admin validation
  - Update existing `canEditRecipe` function to support admin role checks
  - _Requirements: 4.8, 6.1, 7.2_

- [ ]* 2.1 Write unit tests for admin permission functions
  - Test `canPerformAdminAction` with admin and non-admin roles
  - Test `updateRecipeAsAdmin` authorization and validation
  - Test ownership transfer rejection for non-admins
  - _Requirements: 4.8, 7.2_

- [x] 3. Create admin recipe list server page
  - Create `/admin/recipes/page.tsx` as a server component
  - Implement admin authorization check with redirect for unauthorized users
  - Fetch all recipes with author information using database query with left join
  - Pass recipe data to client component for rendering
  - Add error handling with try-catch and user-friendly error messages
  - _Requirements: 1.1, 1.2, 7.1_

- [x] 4. Build recipe list client component
  - Create `recipe-list-client.tsx` with search, filter, and sort state management
  - Implement search functionality for recipe title and tags
  - Add owner filter dropdown populated with unique authors
  - Add visibility filter dropdown (all, public, private)
  - Create sortable table headers for title, owner, created date, updated date, and visibility
  - Implement client-side filtering and sorting logic using useMemo
  - Add click handlers to navigate to recipe detail page on row click
  - Style using existing patterns from user-list-client component
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 6.1_

- [ ]* 4.1 Write component tests for recipe list client
  - Test search filtering functionality
  - Test owner and visibility filters
  - Test sorting by different columns
  - Test navigation on row click
  - Test empty state rendering
  - _Requirements: 1.3, 1.4, 1.5, 1.6_

- [x] 5. Create assign owner component
  - Create `assign-owner-section.tsx` component with admin-only visibility check
  - Fetch all users from `/api/admin/users` endpoint on component mount
  - Implement searchable dropdown using shadcn Select component
  - Add search/filter functionality for user name and email
  - Display current owner as preselected value
  - Add validation to ensure owner is always selected (required field)
  - Implement onChange handler to update parent component state
  - Style component with border and padding to match existing form sections
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 4.7_

- [ ]* 5.1 Write component tests for assign owner section
  - Test component does not render for non-admin users
  - Test user dropdown renders with all users
  - Test search filtering in dropdown
  - Test current owner is preselected
  - Test onChange callback is triggered
  - Test validation error for empty selection
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_

- [x] 6. Integrate assign owner into recipe edit page
  - Update `/recipes/[id]/edit/page.tsx` to include AssignOwnerSection component
  - Pass current recipe owner information as props
  - Add state management for selected owner ID
  - Update handleUpdateRecipe to include authorId in request body when changed
  - Position component below main recipe form and above danger zone
  - Ensure component only renders for admin users using session role check
  - _Requirements: 4.1, 4.5, 4.7_

- [x] 7. Enhance recipe update API for ownership transfer
  - Update `/api/recipes/[id]/route.ts` PUT handler to detect ownership changes
  - Add admin role verification when authorId is being modified
  - Validate new owner exists in database before applying change
  - Return 403 error for non-admin ownership change attempts
  - Return 400 error for invalid owner ID
  - Maintain backward compatibility for regular recipe updates
  - Update recipe's updatedAt timestamp on successful ownership transfer
  - _Requirements: 4.5, 4.8, 4.9, 7.3_

- [ ]* 7.1 Write integration tests for ownership transfer API
  - Test successful ownership transfer by admin
  - Test rejection of ownership transfer by non-admin
  - Test validation error for invalid owner ID
  - Test validation error for non-existent owner
  - Test backward compatibility for regular updates
  - _Requirements: 4.5, 4.8, 4.9_

- [x] 8. Update recipe edit authorization logic
  - Modify recipe edit page authorization to allow admins to edit any recipe
  - Update permission checks to use enhanced `canEditRecipe` function with role parameter
  - Remove owner-only restriction for admin users
  - Ensure edit and delete buttons are visible to admins on recipe detail page
  - _Requirements: 2.2, 3.1, 3.2, 3.5_

- [x] 9. Enhance recipe delete functionality for admins
  - Update delete authorization in DeleteRecipeSection to include admin role check
  - Verify admin users can delete any recipe regardless of ownership
  - Update API delete endpoint to allow admin deletions
  - Ensure existing delete confirmation modal works for admin deletions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1_

- [x] 10. Add admin navigation and UI polish
  - Add "Recipe Management" link to admin navigation menu
  - Update admin dashboard to include recipe management card
  - Add loading states to recipe list page
  - Add empty state message when no recipes exist
  - Add "no results" message when filters return empty
  - Implement responsive table layout for mobile devices
  - Add hover states and visual feedback for interactive elements
  - _Requirements: 1.1, 1.8_

- [ ]* 10.1 Perform accessibility audit
  - Add ARIA labels to all interactive elements
  - Test keyboard navigation through table and filters
  - Verify screen reader compatibility
  - Check color contrast ratios meet WCAG AA standards
  - Test with keyboard-only navigation
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6_

- [x] 11. Add error handling and user feedback
  - Implement toast notifications for successful ownership transfers
  - Add error toast for failed API requests
  - Display inline validation errors in assign owner component
  - Add loading indicators during API calls
  - Implement error boundaries for component failures
  - Add retry logic for failed network requests
  - _Requirements: 4.6, 4.9, 6.2_

- [ ]* 11.1 Write end-to-end tests for admin recipe management
  - Test complete flow: login as admin → navigate to recipe list → search → edit → change owner → save
  - Test authorization flow: regular user attempts to access admin pages
  - Test recipe deletion by admin
  - Test filter and sort combinations
  - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.8, 2.1, 2.2, 4.5, 5.1, 7.1_

- [x] 12. Performance optimization and caching
  - Implement memoization for filtered recipe results using useMemo
  - Add debounced search input to reduce re-renders
  - Optimize database queries with proper indexes
  - Add server-side caching for recipe list with 60-second revalidation
  - Implement optimistic UI updates for ownership changes
  - Cache user list for owner dropdown to avoid repeated fetches
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 12.1 Perform performance testing
  - Test recipe list load time with 1000+ recipes
  - Measure search and filter response times
  - Profile component re-renders
  - Test database query performance
  - Verify caching effectiveness
  - _Requirements: 6.1, 6.2, 6.3_
