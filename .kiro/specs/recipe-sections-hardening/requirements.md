# Requirements Document

## Introduction

This feature update hardens the existing Recipe Sections functionality by implementing strict validation rules, improving data integrity, and ensuring multi-user safety. The update adds comprehensive validation at both client and server levels, implements proper import normalization for external recipe data, and enforces clear invariants that prevent invalid recipe states. This change ensures recipes are always in a valid state, provides clear user feedback when validation fails, and maintains backward compatibility with existing recipes.

## Requirements

### Requirement 1: Section Name Validation

**User Story:** As a user creating or editing recipe sections, I want the system to require section names, so that all my sections are clearly labeled and identifiable.

#### Acceptance Criteria

1. WHEN a user creates a new section THEN the system SHALL require a non-empty section name before saving
2. WHEN a user attempts to save a recipe with an empty section name THEN the system SHALL display an inline error message "Section name is required"
3. WHEN a user attempts to save a recipe with a section name containing only whitespace THEN the system SHALL treat it as empty and show a validation error
4. WHEN a section name validation error is displayed THEN the save button SHALL be disabled
5. WHEN a user corrects the section name THEN the validation error SHALL disappear and the save button SHALL be enabled

### Requirement 2: Empty Section Prevention

**User Story:** As a user organizing my recipes, I want the system to prevent empty sections from being saved, so that my recipe structure remains meaningful and organized.

#### Acceptance Criteria

1. WHEN a user attempts to save a recipe with a section containing no items THEN the system SHALL display an inline error message "This section must contain at least one ingredient" or "This section must contain at least one step"
2. WHEN an empty section validation error is displayed THEN the save button SHALL be disabled
3. WHEN a user adds an item to an empty section THEN the validation error SHALL disappear
4. WHEN a user deletes all items from a section THEN a validation error SHALL appear immediately
5. WHEN a user is typing in a new item field THEN empty validation SHALL NOT trigger until save is attempted

### Requirement 3: Recipe-Level Validation

**User Story:** As a user creating recipes, I want the system to ensure my recipe has at least one ingredient, so that I don't accidentally save incomplete recipes.

#### Acceptance Criteria

1. WHEN a user attempts to save a recipe with no ingredients THEN the system SHALL display an error message "At least one ingredient is required for a recipe"
2. WHEN a recipe has no ingredients THEN the save button SHALL be disabled
3. WHEN a user adds the first ingredient THEN the validation error SHALL disappear and save SHALL be enabled
4. WHEN a recipe has sections THEN at least one section SHALL contain at least one ingredient
5. WHEN a recipe has no sections THEN at least one unsectioned ingredient SHALL exist

### Requirement 4: Item-Level Validation

**User Story:** As a user entering recipe details, I want the system to prevent saving empty ingredients or steps, so that my recipes contain only meaningful content.

#### Acceptance Criteria

1. WHEN a user is typing in an ingredient or step field THEN empty text SHALL be allowed during editing
2. WHEN a user attempts to save a recipe with an empty ingredient text THEN the system SHALL display an inline error "Ingredient text cannot be empty"
3. WHEN a user attempts to save a recipe with an empty instruction step text THEN the system SHALL display an inline error "Instruction text cannot be empty"
4. WHEN a user leaves an ingredient or step field empty and clicks away THEN the empty item SHALL be automatically deleted
5. WHEN an item contains only whitespace THEN it SHALL be treated as empty

### Requirement 5: Inline Validation Feedback

**User Story:** As a user editing recipes, I want to see validation errors next to the fields that need correction, so that I can quickly understand and fix issues.

#### Acceptance Criteria

1. WHEN a validation error occurs THEN the error message SHALL appear inline near the invalid field
2. WHEN multiple validation errors exist THEN all errors SHALL be displayed simultaneously
3. WHEN a validation error is displayed THEN the invalid field SHALL be visually highlighted with a red border or background
4. WHEN a user corrects an invalid field THEN the error message SHALL disappear immediately
5. WHEN validation errors exist THEN the save button SHALL display a disabled state with a tooltip explaining why

### Requirement 6: Import Normalization

**User Story:** As a user importing recipes from external sources, I want the system to automatically fix common data issues, so that imported recipes work correctly without manual cleanup.

#### Acceptance Criteria

1. WHEN an imported recipe has a section with a missing name THEN the system SHALL assign the default name "Imported Section"
2. WHEN an imported recipe has an empty section THEN the system SHALL flatten its items into unsectioned items
3. WHEN an imported recipe has items with missing position values THEN the system SHALL auto-assign sequential positions
4. WHEN an imported recipe has an ingredient with empty text THEN the system SHALL drop that item
5. WHEN an imported recipe has no sections THEN the system SHALL treat it as an unsectioned recipe and preserve all items

### Requirement 7: Server-Side Validation

**User Story:** As a system administrator, I want the server to validate all recipe data before saving, so that invalid data cannot bypass client-side validation.

#### Acceptance Criteria

1. WHEN a recipe save request is received THEN the server SHALL validate all section names are non-empty
2. WHEN a recipe save request is received THEN the server SHALL validate all sections contain at least one item
3. WHEN a recipe save request is received THEN the server SHALL validate at least one ingredient exists
4. WHEN server validation fails THEN the API SHALL return a 400 Bad Request with detailed error messages
5. WHEN server validation passes THEN the recipe SHALL be saved to the database

### Requirement 8: Position Management

**User Story:** As a user managing recipe sections, I want the system to maintain stable ordering of sections and items, so that my recipe structure remains consistent across edits and saves.

#### Acceptance Criteria

1. WHEN a new section is created THEN it SHALL be assigned a position value equal to the current highest position plus one
2. WHEN a section is deleted THEN remaining sections SHALL have their positions reindexed sequentially
3. WHEN items are added to a section THEN they SHALL be assigned sequential position values within that section
4. WHEN items are deleted from a section THEN remaining items SHALL have their positions reindexed
5. WHEN a recipe is loaded THEN sections and items SHALL be ordered by their position values

### Requirement 9: Duplicate Section Names

**User Story:** As a user organizing complex recipes, I want to be able to use the same section name multiple times, so that I can structure my recipe in the way that makes most sense.

#### Acceptance Criteria

1. WHEN a user creates a section with a name that already exists THEN the system SHALL allow it without warning
2. WHEN multiple sections have the same name THEN they SHALL be distinguished by their position in the list
3. WHEN a user renames a section to match another section's name THEN the system SHALL allow it
4. WHEN sections have duplicate names THEN all validation rules SHALL still apply to each section independently
5. WHEN a recipe is saved with duplicate section names THEN the server SHALL accept it without error

### Requirement 10: Section Deletion Confirmation

**User Story:** As a user managing recipe sections, I want to be warned before deleting a section with content, so that I don't accidentally lose recipe data.

#### Acceptance Criteria

1. WHEN a user clicks delete on a section containing items THEN a confirmation modal SHALL appear
2. WHEN the confirmation modal appears THEN it SHALL display the message "Delete this section and all its contents?"
3. WHEN a user confirms deletion THEN the section and all its items SHALL be removed
4. WHEN a user cancels deletion THEN the section SHALL remain unchanged
5. WHEN a user deletes the last remaining section THEN the recipe SHALL fall back to unsectioned mode

### Requirement 11: Backward Compatibility

**User Story:** As a user with existing recipes, I want my current recipes to continue working after the validation update, so that I don't lose any data or functionality.

#### Acceptance Criteria

1. WHEN the system is updated THEN existing recipes SHALL be loaded without modification
2. WHEN an existing recipe is loaded for editing THEN it SHALL pass through normalization to fix any legacy data issues
3. WHEN an existing recipe has invalid data THEN normalization SHALL fix it automatically without user intervention
4. WHEN a normalized recipe is displayed THEN the user SHALL see the corrected data
5. WHEN a user saves a normalized recipe THEN the corrected data SHALL be persisted

### Requirement 12: Multi-User Safety

**User Story:** As a user collaborating on recipes with others, I want the system to handle concurrent edits safely, so that changes from multiple users don't corrupt recipe data.

#### Acceptance Criteria

1. WHEN multiple users edit the same recipe THEN each section and item SHALL be identified by a stable UUID
2. WHEN concurrent edits occur THEN the last save SHALL win for each field
3. WHEN position conflicts occur THEN the server SHALL reindex positions to maintain sequential order
4. WHEN a user saves a recipe THEN the server SHALL validate that all section and item IDs are unique
5. WHEN duplicate IDs are detected THEN the server SHALL reject the save with a clear error message

### Requirement 13: Validation Schema Sharing

**User Story:** As a developer maintaining the codebase, I want validation rules to be defined once and shared between client and server, so that validation logic stays consistent.

#### Acceptance Criteria

1. WHEN validation rules are defined THEN they SHALL be implemented using a shared schema library (Zod)
2. WHEN the client validates a recipe THEN it SHALL use the same schema as the server
3. WHEN validation rules change THEN both client and server SHALL automatically use the updated rules
4. WHEN a validation error occurs THEN the error message SHALL be consistent between client and server
5. WHEN new validation rules are added THEN they SHALL be added to the shared schema

### Requirement 14: Validation Error Summary

**User Story:** As a user attempting to save a recipe with multiple errors, I want to see a summary of all validation issues, so that I can fix them all at once.

#### Acceptance Criteria

1. WHEN a user attempts to save a recipe with validation errors THEN a summary message SHALL appear at the top of the form
2. WHEN the summary appears THEN it SHALL list the number of errors (e.g., "3 validation errors must be fixed")
3. WHEN the summary is displayed THEN it SHALL include a list of all error types present
4. WHEN a user fixes an error THEN the summary count SHALL update immediately
5. WHEN all errors are fixed THEN the summary SHALL disappear and save SHALL be enabled
