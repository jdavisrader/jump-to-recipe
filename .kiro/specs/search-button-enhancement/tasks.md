# Implementation Plan: Search Button Enhancement

## Overview

This implementation plan converts the search button enhancement design into discrete coding tasks. The feature adds an explicit search button to the recipe search interface, replacing automatic debounced search with manual user-triggered search. All changes are isolated to the `RecipeSearch` component, with no modifications required to parent components.

## Tasks

- [x] 1. Remove debounced search behavior from RecipeSearch component
  - Remove `useDebounce` hook import and usage
  - Remove `debouncedQuery` state variable
  - Update search execution logic to not depend on debounced values
  - _Requirements: 2.1, 2.2_

- [ ] 2. Add search execution state management
  - [x] 2.1 Add `isSearching` state to track search execution
    - Add `useState` for `isSearching` boolean
    - Set to `true` when search starts, `false` when complete
    - _Requirements: 4.1_
  
  - [x] 2.2 Add `lastExecutedParams` state to track last search
    - Add `useState` for `lastExecutedParams` string (JSON stringified params)
    - Update when search is executed
    - Use to determine if button should be disabled
    - _Requirements: 2.1_
  
  - [ ]* 2.3 Write property test for search execution state
    - **Property 1: Manual Search Execution Only**
    - **Validates: Requirements 2.1, 2.2**

- [ ] 3. Implement search button UI component
  - [x] 3.1 Add search button element next to search input
    - Position button between search input and filters button
    - Use shadcn/ui Button component
    - Add Search icon from Lucide React
    - Implement responsive layout (vertical on mobile, horizontal on desktop)
    - _Requirements: 1.1, 1.2, 3.3_
  
  - [x] 3.2 Add button accessibility attributes
    - Add `aria-label="Search recipes"`
    - Add `aria-describedby` for screen reader help text
    - Ensure button has proper role (automatic with Button component)
    - _Requirements: 1.3, 5.2_
  
  - [x] 3.3 Implement button states and styling
    - Add minimum 44x44px touch target size via `min-h-[44px] min-w-[44px]`
    - Implement loading state with Loader2 spinner
    - Implement disabled state styling
    - Add hover and focus states
    - Make button text responsive (hidden on mobile, visible on desktop)
    - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.3_
  
  - [ ]* 3.4 Write unit tests for button rendering
    - Test button renders with search icon
    - Test button has proper aria-label
    - Test button has 44x44px minimum size
    - Test button text visibility at different viewports
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.4_

- [ ] 4. Implement search execution logic
  - [x] 4.1 Create handleSearchClick function
    - Build search parameters from current state
    - Compare with lastExecutedParams to prevent duplicate searches
    - Call onSearch callback with parameters
    - Update URL parameters
    - Update lastExecutedParams state
    - _Requirements: 2.1, 2.3, 2.4_
  
  - [x] 4.2 Create handleKeyDown function for Enter key
    - Listen for Enter key in search input
    - Call same search execution logic as button click
    - Prevent default form submission behavior
    - _Requirements: 5.1_
  
  - [x] 4.3 Implement button disabled logic
    - Disable when query is empty AND no filters are applied
    - Disable during loading state (isSearching or isLoading prop)
    - _Requirements: 4.2_
  
  - [ ]* 4.4 Write property tests for search execution
    - **Property 2: Complete Parameter Inclusion**
    - **Property 3: URL Synchronization**
    - **Property 7: Enter Key Equivalence**
    - **Validates: Requirements 2.3, 2.4, 5.1**

- [ ] 5. Update search trigger behavior
  - [x] 5.1 Remove automatic search on query change
    - Remove useEffect that triggers search on debouncedQuery change
    - Keep query state updates on input change
    - _Requirements: 2.1, 2.2_
  
  - [x] 5.2 Preserve sort dropdown immediate execution
    - Keep existing behavior where sort changes trigger immediate search
    - Ensure sort changes don't require button click
    - _Requirements: 6.2_
  
  - [x] 5.3 Preserve filter state without auto-execution
    - Keep filter state updates on filter changes
    - Don't trigger search when filters change
    - Wait for explicit button click or Enter key
    - _Requirements: 6.3_
  
  - [ ]* 5.4 Write property tests for trigger behavior
    - **Property 9: Sort Immediate Execution**
    - **Property 10: Filter State Preservation**
    - **Validates: Requirements 6.2, 6.3**

- [x] 6. Checkpoint - Ensure core functionality works
  - Test search button click triggers search
  - Test Enter key triggers search
  - Test sort dropdown triggers immediate search
  - Test filters don't auto-trigger search
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement responsive layout
  - [x] 7.1 Add mobile layout (vertical stack)
    - Use `flex flex-col` for mobile viewports (<640px)
    - Full-width button with icon and text
    - 8px gap between elements
    - _Requirements: 3.2, 3.3_
  
  - [x] 7.2 Add desktop layout (horizontal)
    - Use `flex flex-row` for desktop viewports (≥640px)
    - Auto-width button with icon and conditional text
    - Search input flex-grows to fill space
    - _Requirements: 3.3_
  
  - [ ]* 7.3 Write property test for responsive layout
    - **Property 4: Responsive Layout Consistency**
    - **Validates: Requirements 1.4, 3.3**

- [ ] 8. Implement accessibility features
  - [x] 8.1 Add screen reader announcements
    - Add live region for search status ("Searching recipes...")
    - Add sr-only help text for button purpose
    - _Requirements: 1.3_
  
  - [x] 8.2 Verify keyboard navigation
    - Ensure tab order: search input → search button → filters button
    - Verify button focusable and activatable with Space/Enter
    - Test focus indicators are visible
    - _Requirements: 5.2, 5.3_
  
  - [ ]* 8.3 Write unit tests for accessibility
    - Test tab order is correct
    - Test button keyboard activation
    - Test screen reader announcements
    - Test focus indicators
    - Run jest-axe for automated accessibility testing
    - _Requirements: 5.2, 5.3_

- [ ] 9. Implement backward compatibility features
  - [x] 9.1 Preserve URL parameter parsing on mount
    - Ensure existing URL parameter parsing logic unchanged
    - Verify initial search executes with URL parameters
    - _Requirements: 6.1_
  
  - [x] 9.2 Preserve clear filters functionality
    - Ensure clear filters button resets all state
    - Verify button disabled state updates after clear
    - _Requirements: 6.4_
  
  - [ ]* 9.3 Write property tests for backward compatibility
    - **Property 8: URL Parameter Restoration**
    - **Property 11: Clear Filters Reset**
    - **Validates: Requirements 6.1, 6.4**

- [ ] 10. Add loading and disabled state handling
  - [x] 10.1 Implement loading state display
    - Show Loader2 spinner when isSearching is true
    - Change button text to "Searching..." on desktop
    - Disable button during loading
    - _Requirements: 4.1_
  
  - [x] 10.2 Implement disabled state logic
    - Calculate disabled state based on query and filters
    - Apply disabled styling and cursor
    - Prevent click events when disabled
    - _Requirements: 4.2_
  
  - [ ]* 10.3 Write property tests for button states
    - **Property 5: Loading State Display**
    - **Property 6: Disabled State Logic**
    - **Validates: Requirements 4.1, 4.2**

- [x] 11. Checkpoint - Ensure all features work correctly
  - Test all search execution paths
  - Test all button states (default, hover, focus, disabled, loading)
  - Test responsive behavior at all breakpoints
  - Test keyboard navigation
  - Test backward compatibility
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Integration testing
  - [x] 12.1 Test in RecipesClient.tsx context
    - Verify search button works on Recipes page
    - Test with public recipes API
    - Verify pagination works
    - _Requirements: All_
  
  - [x] 12.2 Test in MyRecipesPage.tsx context
    - Verify search button works on My Recipes page
    - Test with user-specific recipes API
    - Verify error handling works
    - _Requirements: All_
  
  - [ ]* 12.3 Write integration tests
    - Test complete search flow (type → click → results)
    - Test Enter key flow
    - Test sort change flow
    - Test filter modification flow
    - Test clear filters flow
    - Test URL restoration flow
    - Test error recovery flow
    - _Requirements: All_

- [x] 13. Final verification and cleanup
  - Run all tests (unit, property, integration)
  - Run accessibility tests with jest-axe
  - Verify no TypeScript errors
  - Verify no ESLint warnings
  - Test in both local and Docker environments
  - Verify no regression in existing functionality
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional test-related sub-tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- No changes required to parent components (RecipesClient, MyRecipesPage)
- No changes required to API endpoints or TypeScript interfaces
- All changes isolated to RecipeSearch component
- Backward compatible with existing functionality
- Property tests should run minimum 100 iterations each
- Each property test must be tagged with: `Feature: search-button-enhancement, Property {N}: {description}`
