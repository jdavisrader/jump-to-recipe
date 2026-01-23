# Implementation Plan

- [x] 1. Create shared validation schema with strict rules
  - Create new file `src/lib/validations/recipe-sections.ts`
  - Define `strictIngredientSchema` with UUID validation, non-empty text validation, and position validation
  - Define `strictInstructionStepSchema` with UUID validation, non-empty text validation, and position validation
  - Define `strictIngredientSectionSchema` with name validation, minimum 1 item requirement, and position validation
  - Define `strictInstructionSectionSchema` with name validation, minimum 1 item requirement, and position validation
  - Define `strictRecipeWithSectionsSchema` with recipe-level validation ensuring at least one ingredient exists
  - Add comprehensive error messages for each validation rule
  - Export all schemas for use in client and server code
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 2. Implement import normalization functions
  - Create new file `src/lib/recipe-import-normalizer.ts`
  - Implement `normalizeImportedRecipe` function that processes external recipe data
  - Implement `normalizeImportedSections` function that handles section-level normalization
  - Add logic to assign "Imported Section" name when section name is missing
  - Add logic to flatten empty sections into unsectioned items
  - Add logic to auto-assign sequential positions when missing
  - Add logic to drop items with empty text
  - Add logic to generate UUIDs for items missing IDs
  - Implement `normalizeExistingRecipe` function for backward compatibility
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 3. Create validation hook for client-side validation
  - Create new file `src/hooks/useRecipeValidation.ts`
  - Implement `useRecipeValidation` hook with validation state management
  - Implement `validate` function that uses strict schema and returns boolean
  - Implement `getFieldError` function that retrieves error for specific field path
  - Create error mapping logic to convert Zod errors to field-level errors
  - Implement `errorSummary` computed value with error count and types
  - Add memoization for performance optimization
  - Export hook interface and types
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 4. Update SectionManager component with validation support
  - Modify `src/components/sections/section-manager.tsx`
  - Add `validationErrors` prop of type `Map<string, string>` to component interface
  - Add `onValidate` callback prop to component interface
  - Add inline error display for empty section validation below section items
  - Add error styling for sections with validation errors
  - Display validation error message when section has no items
  - Add visual indicator (red border/background) for invalid sections
  - Trigger validation callback on section operations (add, delete, rename)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Update SectionHeader component with validation support
  - Modify `src/components/sections/section-header.tsx`
  - Add `hasError` boolean prop to component interface
  - Add `errorMessage` string prop to component interface
  - Add error styling to EditableTitle when `hasError` is true (red border, red background)
  - Display inline error message below section name when `errorMessage` is provided
  - Add visual feedback for invalid section names
  - Update component styling to highlight validation errors
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4_

- [x] 6. Integrate validation into recipe form components
  - Modify `src/components/recipes/recipe-form.tsx`
  - Import and use `useRecipeValidation` hook
  - Call validation on form blur events
  - Call validation before form submission
  - Pass validation errors to SectionManager components
  - Disable save button when validation fails
  - Add tooltip to disabled save button explaining validation errors
  - Display error summary banner at top of form when errors exist
  - Clear errors when user fixes invalid fields
  - _Requirements: 1.5, 2.2, 3.2, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 7. Add server-side validation to recipe API routes
  - Modify `src/app/api/recipes/route.ts` (POST endpoint)
  - Import strict validation schema from `recipe-sections.ts`
  - Add validation logic before database insert
  - Return 400 Bad Request with structured error details when validation fails
  - Format error response with path and message for each validation error
  - Ensure successful validation before saving to database
  - Add error logging for validation failures
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 13.1, 13.2, 13.3, 13.4_

- [x] 8. Add server-side validation to recipe update API
  - Modify `src/app/api/recipes/[id]/route.ts` (PUT/PATCH endpoint)
  - Import strict validation schema from `recipe-sections.ts`
  - Add validation logic before database update
  - Return 400 Bad Request with structured error details when validation fails
  - Apply normalization for existing recipes on first edit
  - Ensure backward compatibility with existing recipe data
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 9. Implement position management utilities
  - Create new file `src/lib/section-position-utils.ts`
  - Implement `reindexSectionPositions` function that assigns sequential positions to sections
  - Implement `reindexItemPositions` function that assigns sequential positions to items within a section
  - Implement `validatePositions` function that checks for duplicate or invalid positions
  - Implement `resolvePositionConflicts` function for multi-user scenarios
  - Add logic to handle position conflicts in concurrent edits
  - Export utility functions for use in components and API routes
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 10. Add validation error styling and CSS
  - Create or modify `src/components/sections/section-validation.css`
  - Add `.validation-error` class for error text styling
  - Add `.field-invalid` class for invalid field borders
  - Add `.field-invalid-bg` class for invalid field backgrounds
  - Add `.error-summary` class for error summary banner
  - Add `.section-empty-error` class for empty section warnings
  - Add `error-fade-in` animation for smooth error appearance
  - Ensure dark mode compatibility for all error styles
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 11. Add accessibility features for validation errors
  - Update form components to use ARIA live regions for error announcements
  - Add `aria-describedby` attributes to associate errors with fields
  - Add `aria-invalid` attribute to invalid fields
  - Implement focus management to move focus to first invalid field on submit
  - Add screen reader announcements for validation state changes
  - Ensure keyboard navigation works with error messages
  - Test with screen readers (VoiceOver, NVDA)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 12. Integrate import normalization into recipe import flow
  - Modify `src/components/recipes/recipe-import-form.tsx`
  - Import `normalizeImportedRecipe` function
  - Apply normalization to imported recipe data before validation
  - Display normalization summary to user (e.g., "Fixed 2 empty sections")
  - Validate normalized data before allowing save
  - Handle edge cases (no sections, all empty sections, missing data)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13. Update recipe editor to apply normalization on load
  - Modify `src/components/recipes/recipe-editor.tsx`
  - Import `normalizeExistingRecipe` function
  - Apply normalization when loading existing recipes for editing
  - Silently fix invalid data without user intervention
  - Display normalized data in form
  - Ensure backward compatibility with legacy recipe data
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 14. Add duplicate section name support
  - Verify that current implementation allows duplicate section names
  - Update validation schema to explicitly allow duplicate names
  - Add tests to confirm duplicate names work correctly
  - Ensure sections with duplicate names are distinguished by position
  - Document that duplicate names are allowed
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 15. Enhance section deletion confirmation
  - Modify section deletion logic in `SectionManager`
  - Update confirmation modal message to "Delete this section and all its contents?"
  - Add special handling for deleting the last remaining section
  - Implement fallback to unsectioned mode when last section is deleted
  - Ensure confirmation is required for sections with items
  - Allow immediate deletion for empty sections (no confirmation)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 16. Implement multi-user safety features
  - Update section and item ID generation to use UUID v4
  - Add server-side validation to ensure all IDs are unique
  - Implement position conflict resolution in API routes
  - Add last-write-wins logic for concurrent edits
  - Reject saves with duplicate IDs and return clear error message
  - Add database constraints for ID uniqueness
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 17. Write unit tests for validation schemas
  - Create test file `src/lib/validations/__tests__/recipe-sections-validation.test.ts`
  - Test strict validation rules for all schemas
  - Test error messages are correct and helpful
  - Test edge cases (whitespace, empty strings, special characters)
  - Test position validation (negative, duplicate, missing)
  - Test ID validation (invalid UUIDs, missing IDs)
  - Test recipe-level validation (no ingredients, empty sections)
  - Achieve 100% code coverage for validation schemas
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3_

- [x] 18. Write unit tests for import normalization
  - Create test file `src/lib/__tests__/recipe-import-normalizer.test.ts`
  - Test missing section names are assigned "Imported Section"
  - Test empty sections are flattened to unsectioned items
  - Test missing positions are auto-assigned sequentially
  - Test empty items are dropped
  - Test missing IDs are generated as UUIDs
  - Test recipes with no sections are handled correctly
  - Test edge cases and error conditions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 19. Write unit tests for validation hook
  - Create test file `src/hooks/__tests__/useRecipeValidation.test.ts`
  - Test validation state management
  - Test error mapping from Zod errors to field errors
  - Test `getFieldError` function returns correct errors
  - Test `errorSummary` computation
  - Test validation with valid and invalid data
  - Test memoization and performance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 14.1, 14.2, 14.3_

- [x] 20. Write integration tests for recipe form validation
  - Create test file `src/components/recipes/__tests__/recipe-form-validation.test.tsx`
  - Test save button is disabled when validation fails
  - Test inline errors are displayed for invalid fields
  - Test errors clear when user fixes invalid fields
  - Test validation triggers on blur events
  - Test validation triggers on form submit
  - Test error summary banner displays correctly
  - Test save button tooltip shows validation errors
  - _Requirements: 1.5, 2.2, 3.2, 5.1, 5.2, 5.3, 5.4, 5.5, 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 21. Write integration tests for section validation
  - Create test file `src/components/sections/__tests__/section-manager-validation.test.tsx`
  - Test empty section error display
  - Test empty section name error display
  - Test error styling on invalid sections
  - Test validation after section operations (add, delete, rename)
  - Test error clearing when section becomes valid
  - Test multiple validation errors display simultaneously
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3_

- [x] 22. Write API tests for server-side validation
  - Create test file `src/app/api/recipes/__tests__/validation.test.ts`
  - Test POST endpoint rejects invalid recipes with 400 status
  - Test PUT endpoint rejects invalid updates with 400 status
  - Test error response format includes path and message
  - Test successful save with valid recipe data
  - Test normalization is applied to existing recipes on update
  - Test position conflict resolution
  - Test duplicate ID rejection
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 11.2, 11.3, 12.3, 12.4, 12.5_

- [x] 23. Write tests for position management utilities
  - Create test file `src/lib/__tests__/section-position-utils.test.ts`
  - Test `reindexSectionPositions` assigns sequential positions
  - Test `reindexItemPositions` assigns sequential positions within sections
  - Test `validatePositions` detects duplicate positions
  - Test `validatePositions` detects negative positions
  - Test `resolvePositionConflicts` handles concurrent edits
  - Test edge cases (empty arrays, single item, large arrays)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 12.2, 12.3_

- [x] 24. Update component documentation
  - Update JSDoc comments in `SectionManager` component
  - Update JSDoc comments in `SectionHeader` component
  - Document validation props and behavior
  - Document error handling and display
  - Create README in `src/lib/validations/` explaining validation architecture
  - Document import normalization process
  - Add code examples for common validation scenarios
  - _Requirements: 1.1, 2.1, 5.1, 6.1, 13.1_

- [x] 25. Create migration guide for existing recipes
  - Create document `docs/RECIPE-SECTIONS-MIGRATION.md`
  - Document backward compatibility approach
  - Explain normalization process for existing recipes
  - Provide examples of data transformations
  - Document rollout plan and phases
  - Add troubleshooting section for common issues
  - Include rollback procedures
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
