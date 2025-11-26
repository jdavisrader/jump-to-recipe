z# Implementation Plan

- [x] 1. Create core section data types and utilities
  - Define TypeScript interfaces for IngredientSection and InstructionSection
  - Create Section generic type and related utility types
  - Implement data transformation functions for converting between flat and sectioned structures
  - Write unit tests for data transformation logic
  - _Requirements: 1.1, 2.1, 6.1, 7.1_

- [x] 2. Build reusable section management components
  - [x] 2.1 Create EditableTitle component for inline section renaming
    - Implement controlled input that switches between display and edit modes
    - Handle Enter key and blur events for saving changes
    - Add fallback logic for empty section names
    - Write unit tests for EditableTitle behavior
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.2 Create SectionHeader component with drag and delete functionality
    - Implement section header with editable title, drag handle, and delete button
    - Integrate EditableTitle component for section renaming
    - Add drag handle using @hello-pangea/dnd library
    - Implement delete confirmation modal
    - Write unit tests for SectionHeader interactions
    - _Requirements: 3.1, 4.1, 5.1, 5.2_

  - [x] 2.3 Create SectionManager component for organizing items within sections
    - Build generic component that manages a list of sections with items
    - Implement drag-and-drop reordering for sections using @hello-pangea/dnd
    - Add "Add Section" functionality with default naming
    - Handle section deletion with confirmation
    - Write unit tests for section management operations
    - _Requirements: 1.1, 2.1, 4.2, 4.3, 5.3, 5.4_

- [x] 3. Extend recipe form validation schema
  - Update Zod schema to support optional ingredientSections and instructionSections
  - Maintain backward compatibility with existing flat ingredient/instruction arrays
  - Add validation rules for section names and empty sections
  - Implement validation warning for empty sections during save
  - Write unit tests for extended validation schema
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 4. Create recipe ingredients section component
  - [x] 4.1 Build RecipeIngredientsWithSections component
    - Create component that wraps existing ingredient form fields with section management
    - Integrate SectionManager for organizing ingredient sections
    - Implement "Add Ingredient" functionality within sections
    - Handle switching between sectioned and non-sectioned modes
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.2_

  - [x] 4.2 Integrate with React Hook Form field arrays
    - Use useFieldArray for managing dynamic ingredient sections
    - Implement proper form state management for nested section data
    - Handle form validation for sectioned ingredients
    - Add proper error handling and display for ingredient sections
    - Write unit tests for form integration
    - _Requirements: 1.5, 6.3, 7.1_

- [x] 5. Create recipe instructions section component
  - [x] 5.1 Build RecipeInstructionsWithSections component
    - Create component that wraps existing instruction form fields with section management
    - Integrate SectionManager for organizing instruction sections
    - Implement "Add Step" functionality within sections
    - Handle switching between sectioned and non-sectioned modes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.2_

  - [x] 5.2 Integrate with React Hook Form field arrays
    - Use useFieldArray for managing dynamic instruction sections
    - Implement proper form state management for nested section data
    - Handle form validation for sectioned instructions
    - Add proper error handling and display for instruction sections
    - Write unit tests for form integration
    - _Requirements: 2.5, 6.3, 7.2_

- [x] 6. Update RecipeForm component to support sections
  - Replace existing ingredients Card with RecipeIngredientsWithSections component
  - Replace existing instructions Card with RecipeInstructionsWithSections component
  - Implement mode switching logic (sectioned vs non-sectioned)
  - Update form submission to handle sectioned data structure
  - Maintain backward compatibility with existing recipe creation flow
  - Write integration tests for updated RecipeForm
  - _Requirements: 1.1, 2.1, 6.1, 6.2, 6.3, 7.1, 7.2_

- [x] 7. Update RecipeEditor component to support sections
  - Integrate section components into existing inline editing workflow
  - Update section-based editing modes for ingredients and instructions
  - Implement proper state management for sectioned editing
  - Handle conversion between sectioned and non-sectioned formats during editing
  - Maintain existing edit/save/cancel functionality for sections
  - Write integration tests for updated RecipeEditor
  - _Requirements: 1.1, 2.1, 6.1, 6.2, 6.3, 7.1, 7.2_

- [x] 8. Implement empty section validation and warnings
  - Add validation logic to detect empty sections before recipe save
  - Create confirmation modal for saving recipes with empty sections
  - Implement user choice handling (continue or cancel save)
  - Add visual indicators for empty sections during editing
  - Write unit tests for empty section validation flow
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Add data migration utilities for existing recipes
  - Create utility functions to convert existing flat recipes to sectioned format
  - Implement backward compatibility layer for reading existing recipes
  - Add optional conversion feature for users to upgrade existing recipes
  - Handle edge cases in data migration (empty ingredients/instructions)
  - Write unit tests for migration utilities
  - _Requirements: 6.4, 7.3, 7.4_

- [x] 10. Enhance user experience with animations and feedback
  - Add smooth drag-and-drop animations for section reordering
  - Implement visual feedback during drag operations
  - Add loading states for section operations
  - Improve empty state messaging for sections
  - Write accessibility tests for enhanced interactions
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2_

- [ ] 11. Write comprehensive integration tests
  - Create end-to-end tests for complete recipe creation with sections
  - Test recipe editing workflows with section management
  - Verify backward compatibility with existing recipes
  - Test data persistence and retrieval for sectioned recipes
  - Add performance tests for recipes with many sections
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1_