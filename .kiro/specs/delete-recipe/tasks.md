# Implementation Plan

- [x] 1. Create DeleteRecipeSection component
  - Create new component file at `src/components/recipes/delete-recipe-section.tsx`
  - Implement component with delete button and modal integration
  - Add state management for modal visibility and loading state
  - Implement delete API call with proper error handling
  - Add toast notifications for success and error cases
  - Implement navigation to /my-recipes on successful deletion
  - Export component from `src/components/recipes/index.ts`
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 2. Integrate delete functionality into edit page
  - [x] 2.1 Add permission check logic to edit page
    - Import necessary hooks and utilities
    - Create `canDelete` computed value based on user role and ownership
    - Check for owner, admin, or elevated role
    - _Requirements: 1.4, 1.5, 7.1, 7.2, 7.3, 7.4_
  
  - [x] 2.2 Add DeleteRecipeSection to page layout
    - Import DeleteRecipeSection component
    - Add "Danger Zone" section below the recipe form
    - Conditionally render based on `canDelete` permission
    - Style the danger zone section with appropriate visual hierarchy
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Verify API endpoint functionality
  - Review existing DELETE endpoint implementation
  - Verify authorization checks include elevated role
  - Confirm 404 responses are handled correctly
  - Test cascade deletion of related data (photos, comments, cookbook associations)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 4. Write component tests
  - [ ]* 4.1 Create test file for DeleteRecipeSection
    - Test delete button renders correctly
    - Test modal opens on button click
    - Test modal closes on cancel
    - Test API call on delete confirmation
    - Test loading state during deletion
    - Test successful deletion flow (toast, redirect)
    - Test error handling scenarios
    - Test 404 treated as success
    - Test network error handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 4.2 Add tests for edit page permission logic
    - Test delete section shows for recipe owner
    - Test delete section shows for admin
    - Test delete section shows for elevated user
    - Test delete section hidden for non-owner
    - _Requirements: 1.4, 1.5, 7.1, 7.2, 7.3, 7.4_

- [ ]* 5. Add integration tests
  - Verify DELETE endpoint with elevated role
  - Test cascade deletions work correctly
  - Test idempotency (multiple delete calls)
  - Test authorization edge cases
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4_

- [ ]* 6. Accessibility testing and improvements
  - Verify ARIA labels on delete button
  - Test keyboard navigation in modal
  - Test screen reader announcements
  - Verify focus management
  - Test color contrast for destructive styling
  - Ensure Escape key closes modal
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.5_
