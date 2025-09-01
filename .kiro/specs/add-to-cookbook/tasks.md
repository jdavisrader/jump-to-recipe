# Implementation Plan

- [ ] 1. Create API endpoints for recipe-cookbook operations
  - Create GET /api/recipes/[id]/cookbooks endpoint to fetch user's editable cookbooks with recipe status
  - Create POST /api/cookbooks/[id]/recipes endpoint to add a recipe to a cookbook
  - Create DELETE /api/cookbooks/[id]/recipes/[recipeId] endpoint to remove a recipe from a cookbook
  - Implement proper error handling and validation using Zod schemas
  - Integrate with existing cookbook permission system using getCookbookPermission and hasMinimumPermission
  - _Requirements: 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 5.3, 6.3, 6.4_

- [ ] 2. Build AddToCookbookButton component
  - Create reusable button component that triggers the modal
  - Implement modal open/close state management
  - Add proper styling to match existing button components
  - Include cookbook icon and appropriate text
  - Handle loading and disabled states
  - _Requirements: 1.1, 1.2_

- [ ] 3. Implement AddToCookbookModal component
  - Create modal component with search functionality and cookbook list
  - Implement real-time search filtering with case-insensitive substring matching
  - Build checkbox list with proper state management for each cookbook
  - Add cookbook sorting logic (recently used, owned, then collaborated)
  - Implement "Create Cookbook" button and navigation
  - Handle empty state when user has no editable cookbooks
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3_

- [ ] 4. Add optimistic UI updates and error handling
  - Implement immediate checkbox state updates before API calls complete
  - Add error recovery with state rollback on API failures
  - Create toast notifications for success and error states
  - Handle concurrent API operations gracefully
  - Add loading indicators for API operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 5. Integrate components into RecipeDisplay
  - Modify RecipeDisplay component to include AddToCookbookButton
  - Position button next to "View Original Recipe" button under recipe image
  - Center both buttons in the layout
  - Ensure responsive design for mobile devices
  - Maintain existing styling patterns and accessibility
  - _Requirements: 1.1, 1.2_

- [ ] 6. Create comprehensive test suite
  - Write unit tests for AddToCookbookButton component behavior
  - Create unit tests for AddToCookbookModal state management and interactions
  - Implement API endpoint tests for all new routes
  - Add integration tests for permission checking and database operations
  - Create end-to-end tests for complete add-to-cookbook workflow
  - Test error scenarios and edge cases
  - _Requirements: All requirements need testing coverage_

- [ ] 7. Add TypeScript interfaces and types
  - Create TypeScript interfaces for new API request/response types
  - Define component prop interfaces for type safety
  - Add cookbook option and recipe status interfaces
  - Extend existing types as needed for new functionality
  - Ensure proper type checking throughout the implementation
  - _Requirements: 1.3, 1.4, 2.1, 3.1, 3.2_

- [ ] 8. Implement accessibility and mobile optimizations
  - Add proper ARIA labels and keyboard navigation to modal
  - Ensure screen reader compatibility for all interactive elements
  - Implement responsive design for mobile devices
  - Add touch-friendly targets for mobile interactions
  - Test accessibility compliance with existing standards
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 4.1_