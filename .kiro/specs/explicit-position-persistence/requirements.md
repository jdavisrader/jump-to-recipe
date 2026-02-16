# Requirements Document

## Introduction

This specification addresses critical architectural issues in the Recipe Sections feature where position tracking is implicit (via array order) rather than explicit (via a persisted property). The current implementation creates a semantic gap between runtime behavior and data persistence, leading to fragile code and type system mismatches.

## Glossary

- **Position**: An explicit, non-negative integer property that defines an item's order within its container (section or flat list)
- **Ingredient**: A recipe component with properties including id, name, amount, unit, and position
- **Instruction**: A recipe step with properties including id, step number, content, and position
- **Section**: A named container for ingredients or instructions with an explicit order property
- **Flat List**: A recipe structure without sections where items exist in a single array
- **Persistence Layer**: The database storage system (PostgreSQL with JSONB columns)
- **Runtime Layer**: The UI component state during user interactions
- **Position Scope**: The context in which a position is valid (within a section or within a flat list)

## Requirements

### Requirement 1: Explicit Position Property

**User Story:** As a developer, I want ingredients and instructions to have an explicit position property, so that item order is clearly defined and persisted.

#### Acceptance Criteria

1. WHEN an ingredient is created, THE system SHALL assign it an explicit position property
2. WHEN an instruction is created, THE system SHALL assign it an explicit position property
3. WHEN an item is saved to the database, THE system SHALL persist the position property
4. WHEN an item is loaded from the database, THE system SHALL include the position property
5. WHEN position is missing from legacy data, THE system SHALL auto-assign position based on array index

### Requirement 2: Type System Alignment

**User Story:** As a developer, I want the type definitions to accurately reflect the data model, so that TypeScript catches position-related errors at compile time.

#### Acceptance Criteria

1. WHEN the Ingredient type is defined, THE system SHALL include a required position property of type number
2. WHEN the Instruction type is defined, THE system SHALL include a required position property of type number
3. WHEN validation schemas are defined, THE system SHALL require position as a non-negative integer
4. WHEN position utilities are used, THE system SHALL not require runtime type coercion
5. WHEN legacy data is loaded, THE system SHALL transform it to include position before validation

### Requirement 3: Position Persistence

**User Story:** As a user, I want my ingredient and instruction order to be preserved exactly as I arranged it, so that my recipes maintain their structure across sessions.

#### Acceptance Criteria

1. WHEN a recipe is saved with sections, THE system SHALL persist position for each item within each section
2. WHEN a recipe is saved without sections, THE system SHALL persist position for each item in the flat list
3. WHEN a recipe is loaded, THE system SHALL restore items in the exact order defined by their position property
4. WHEN items are reordered via drag-and-drop, THE system SHALL update position values and persist them
5. WHEN position conflicts are detected, THE system SHALL auto-correct to sequential values before saving

### Requirement 4: Position Scope Management

**User Story:** As a developer, I want position to be scoped correctly to its container, so that position values are meaningful and unambiguous.

#### Acceptance Criteria

1. WHEN an item is in a section, THE system SHALL scope its position to that section (0 to N-1)
2. WHEN an item is in a flat list, THE system SHALL scope its position to the entire list (0 to M-1)
3. WHEN an item is moved between sections, THE system SHALL recalculate position within the new section
4. WHEN sections are converted to flat list, THE system SHALL recalculate global positions
5. WHEN flat list is converted to sections, THE system SHALL recalculate section-scoped positions

### Requirement 5: Backward Compatibility

**User Story:** As a system administrator, I want existing recipes to continue working, so that no data is lost during the migration to explicit positions.

#### Acceptance Criteria

1. WHEN a recipe without position properties is loaded, THE system SHALL auto-assign positions based on array order
2. WHEN legacy data is normalized, THE system SHALL add position properties without modifying other data
3. WHEN a recipe is saved after migration, THE system SHALL include position properties going forward
4. WHEN validation encounters missing positions, THE system SHALL provide clear error messages
5. WHEN position auto-assignment occurs, THE system SHALL log the operation for debugging

### Requirement 6: Position Validation

**User Story:** As a developer, I want position values to be validated strictly, so that data integrity is maintained.

#### Acceptance Criteria

1. WHEN position is validated, THE system SHALL reject negative values
2. WHEN position is validated, THE system SHALL reject non-integer values
3. WHEN position is validated, THE system SHALL reject duplicate values within the same scope
4. WHEN position conflicts are detected, THE system SHALL auto-correct to sequential values
5. WHEN validation fails, THE system SHALL provide detailed error messages with context

### Requirement 7: API Contract Updates

**User Story:** As an API consumer, I want clear documentation of position requirements, so that I can correctly format recipe data.

#### Acceptance Criteria

1. WHEN the API documentation is updated, THE system SHALL specify position as a required field
2. WHEN API requests are received, THE system SHALL validate position presence and format
3. WHEN API responses are sent, THE system SHALL include position in all item objects
4. WHEN API errors occur, THE system SHALL indicate position-related validation failures clearly
5. WHEN legacy clients send data without positions, THE system SHALL auto-assign and return corrected data

### Requirement 8: Migration Strategy

**User Story:** As a system administrator, I want a safe migration path for existing recipes, so that the transition to explicit positions is seamless.

#### Acceptance Criteria

1. WHEN the migration runs, THE system SHALL process all recipes in the database
2. WHEN a recipe is migrated, THE system SHALL add position properties based on current array order
3. WHEN migration completes, THE system SHALL report statistics (recipes processed, positions added)
4. WHEN migration encounters errors, THE system SHALL log failures without stopping the entire process
5. WHEN migration is complete, THE system SHALL verify all recipes have valid positions

## Non-Functional Requirements

### Performance

1. Position assignment SHALL complete in O(n) time where n is the number of items
2. Position validation SHALL complete in O(n) time where n is the number of items
3. Migration SHALL process at least 100 recipes per second
4. Position updates during drag-and-drop SHALL feel instantaneous (< 100ms)

### Reliability

1. Position data SHALL be persisted atomically with other recipe data
2. Position conflicts SHALL be auto-corrected without user intervention
3. Migration SHALL be idempotent (safe to run multiple times)
4. Position validation SHALL catch all invalid states before persistence

### Maintainability

1. Position logic SHALL be centralized in utility functions
2. Type definitions SHALL be the single source of truth for data structure
3. Validation schemas SHALL be derived from type definitions
4. Position-related code SHALL have 100% test coverage

## Success Criteria

The implementation will be considered successful when:

1. All ingredients and instructions have explicit position properties in the database
2. TypeScript compilation shows no type mismatches related to position
3. All existing tests pass with the new position model
4. New property-based tests verify position invariants
5. Migration completes successfully for all existing recipes
6. API documentation accurately reflects position requirements
7. No regression in drag-and-drop functionality
8. Position values are preserved across save/load cycles
