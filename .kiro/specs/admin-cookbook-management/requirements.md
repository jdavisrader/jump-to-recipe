# Requirements Document

## Introduction

This feature provides administrators with comprehensive control over cookbooks across the platform. Administrators need the ability to browse, edit, reassign ownership, manage collaborators, and delete cookbooks while maintaining data consistency and leveraging existing user-facing components. This ensures proper content moderation and platform management capabilities without introducing unnecessary complexity or duplicate UI patterns.

## Requirements

### Requirement 1

**User Story:** As an admin, I want to browse all cookbooks in the system so that I can quickly identify and manage platform content.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/cookbooks` THEN the system SHALL display a paginated table of all cookbooks
2. WHEN viewing the cookbook list THEN the system SHALL show cookbook title, owner, collaborator count, recipe count, and date created for each cookbook
3. WHEN an admin searches by cookbook title THEN the system SHALL filter results to match the search query
4. WHEN an admin applies owner filters THEN the system SHALL show only cookbooks owned by the selected user
5. WHEN an admin sorts by title THEN the system SHALL order cookbooks alphabetically (A-Z or Z-A)
6. WHEN an admin sorts by date created THEN the system SHALL order cookbooks chronologically (newest or oldest first)
7. WHEN there are more than 20 cookbooks THEN the system SHALL provide pagination controls

### Requirement 2

**User Story:** As an admin, I want to view cookbook details using the existing user interface so that I can understand cookbook contents without learning new navigation patterns.

#### Acceptance Criteria

1. WHEN an admin clicks on a cookbook from the list THEN the system SHALL navigate to the existing cookbook detail page
2. WHEN an admin views a cookbook THEN the system SHALL display the same interface that regular users see
3. WHEN an admin views a cookbook they don't own THEN the system SHALL show edit and delete actions normally restricted to owners
4. WHEN an admin accesses cookbook functionality THEN the system SHALL bypass normal ownership permission checks

### Requirement 3

**User Story:** As an admin, I want to edit cookbook metadata using existing components so that I can correct or update cookbook information efficiently.

#### Acceptance Criteria

1. WHEN an admin accesses cookbook edit functionality THEN the system SHALL reuse the existing cookbook edit UI
2. WHEN an admin edits a cookbook THEN the system SHALL allow modification of title, description, and cover image
3. WHEN an admin saves cookbook changes THEN the system SHALL use existing validation logic and save behavior
4. WHEN an admin edits any cookbook THEN the system SHALL treat the admin as having owner-level permissions

### Requirement 4

**User Story:** As an admin, I want to manage cookbook collaborators so that I can control access permissions appropriately.

#### Acceptance Criteria

1. WHEN an admin accesses cookbook edit page THEN the system SHALL display an admin-only collaborator management section
2. WHEN an admin views collaborators THEN the system SHALL show all current cookbook collaborators
3. WHEN an admin adds a collaborator THEN the system SHALL provide user search and selection functionality
4. WHEN an admin removes a collaborator THEN the system SHALL immediately revoke their cookbook access
5. WHEN managing collaborators THEN the system SHALL reuse existing collaborator logic where possible
6. WHEN a non-admin user accesses cookbook edit THEN the system SHALL NOT display the admin collaborator management section

### Requirement 5

**User Story:** As an admin, I want to reassign cookbook ownership so that I can fix ownership issues or transfer cookbook data between users.

#### Acceptance Criteria

1. WHEN an admin accesses cookbook edit page THEN the system SHALL display an admin-only ownership assignment section
2. WHEN an admin selects a new owner THEN the system SHALL provide a searchable dropdown of all platform users
3. WHEN an admin changes cookbook ownership THEN the system SHALL require a valid user selection (cannot be empty)
4. WHEN ownership is reassigned THEN the system SHALL update the cookbook owner in the database
5. WHEN a non-admin attempts to change ownership THEN the system SHALL reject the request with appropriate error messaging
6. WHEN ownership changes THEN the system SHALL maintain all existing recipes within the cookbook

### Requirement 6

**User Story:** As an admin, I want to delete cookbooks so that I can remove outdated or inappropriate content from the platform.

#### Acceptance Criteria

1. WHEN an admin accesses cookbook actions THEN the system SHALL display delete functionality using existing UI patterns
2. WHEN an admin initiates cookbook deletion THEN the system SHALL show the existing confirmation dialog
3. WHEN an admin confirms cookbook deletion THEN the system SHALL perform a hard delete of the cookbook
4. WHEN a cookbook is deleted THEN the system SHALL NOT delete the individual recipes contained within it
5. WHEN cookbook deletion completes THEN the system SHALL redirect the admin to the cookbook list page
6. WHEN deletion fails THEN the system SHALL display appropriate error messaging to the admin