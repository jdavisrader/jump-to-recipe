# Requirements Document

## Introduction

The "Add to Cookbook" feature allows users to quickly add or remove recipes from their cookbooks directly from any recipe page. This feature provides a modal interface that shows all cookbooks the user can edit, displays which cookbooks already contain the recipe, and enables immediate add/remove actions with optimistic UI updates. The feature integrates seamlessly with the existing cookbook permission system and provides a more efficient workflow than the current cookbook-centric approach.

## Requirements

### Requirement 1

**User Story:** As a user viewing a recipe, I want to click an "Add to Cookbook" button to quickly add that recipe to one of my cookbooks, so that I can organize recipes efficiently without navigating away from the recipe page.

#### Acceptance Criteria

1. WHEN a user views any recipe page THEN the system SHALL display an "Add to Cookbook" button next to the "View Original Recipe" button under the recipe image, with both buttons centered
2. WHEN a user clicks the "Add to Cookbook" button THEN the system SHALL open a modal showing all cookbooks the user can edit
3. WHEN the modal opens THEN the system SHALL show checkboxes indicating which cookbooks already contain the recipe
4. WHEN a user checks a cookbook checkbox THEN the system SHALL immediately add the recipe to that cookbook with optimistic UI updates
5. WHEN a user unchecks a cookbook checkbox THEN the system SHALL immediately remove the recipe from that cookbook with optimistic UI updates

### Requirement 2

**User Story:** As a user with multiple cookbooks, I want to see which cookbooks already contain a recipe and search through my cookbooks, so that I can avoid duplicates and quickly find the right cookbook.

#### Acceptance Criteria

1. WHEN the modal displays cookbooks THEN the system SHALL show checked checkboxes for cookbooks that already contain the recipe
2. WHEN the modal displays cookbooks THEN the system SHALL provide a search input to filter cookbooks by name in real-time
3. WHEN a user types in the search input THEN the system SHALL filter the cookbook list using case-insensitive substring matching
4. WHEN displaying cookbooks THEN the system SHALL sort them by: recently used, owned cookbooks, then collaborated cookbooks
5. WHEN a cookbook contains the recipe THEN the system SHALL prevent duplicate entries through database constraints

### Requirement 3

**User Story:** As a user with appropriate permissions, I want to add recipes to shared cookbooks I can edit, so that I can contribute to collaborative cookbook collections.

#### Acceptance Criteria

1. WHEN the modal loads THEN the system SHALL only show cookbooks where the user has 'edit' or 'owner' permissions
2. WHEN a user has view-only access to a cookbook THEN the system SHALL NOT display that cookbook in the modal
3. WHEN a user adds a recipe to a shared cookbook THEN the system SHALL respect the existing cookbook permission system
4. WHEN checking permissions THEN the system SHALL use the existing `getCookbookPermission` and `hasMinimumPermission` functions
5. WHEN a user lacks edit permissions THEN the system SHALL return appropriate error responses

### Requirement 4

**User Story:** As a user with no editable cookbooks, I want to be directed to create a cookbook, so that I can start organizing my recipes.

#### Acceptance Criteria

1. WHEN a user has no cookbooks with edit permissions THEN the modal SHALL display only a "Create Cookbook" button
2. WHEN a user clicks "Create Cookbook" THEN the system SHALL navigate to the cookbook creation page
3. WHEN the modal shows no editable cookbooks THEN the system SHALL display helpful text explaining the user needs to create a cookbook first
4. WHEN a user creates a new cookbook THEN the system SHALL allow them to return and use the "Add to Cookbook" feature
5. WHEN determining editable cookbooks THEN the system SHALL include both owned cookbooks and collaborated cookbooks with edit permissions

### Requirement 5

**User Story:** As a user, I want immediate feedback when adding or removing recipes from cookbooks, so that I can see the results of my actions without waiting.

#### Acceptance Criteria

1. WHEN a user checks or unchecks a cookbook THEN the system SHALL update the UI immediately before the API call completes
2. WHEN an API call fails THEN the system SHALL revert the checkbox state and display an error toast notification
3. WHEN an API call succeeds THEN the system SHALL maintain the updated checkbox state
4. WHEN multiple rapid changes occur THEN the system SHALL handle concurrent API calls gracefully
5. WHEN displaying errors THEN the system SHALL provide clear, actionable error messages to the user

### Requirement 6

**User Story:** As a user, I want the recipe-to-cookbook relationship to be properly managed, so that deleted recipes or cookbooks are handled gracefully.

#### Acceptance Criteria

1. WHEN a recipe is deleted from the system THEN the system SHALL maintain cookbook entries as "deleted recipe placeholders"
2. WHEN a cookbook is deleted THEN the system SHALL remove all associated recipe relationships
3. WHEN adding a recipe to a cookbook THEN the system SHALL enforce uniqueness constraints to prevent duplicates
4. WHEN the database constraint prevents duplicate entries THEN the system SHALL handle the error gracefully
5. WHEN displaying cookbook entries with deleted recipes THEN the system SHALL show "Deleted Recipe" placeholders in cookbook views