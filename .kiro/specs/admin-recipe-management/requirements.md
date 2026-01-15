# Requirements Document

## Introduction

The Admin Recipe Management feature provides administrators with comprehensive tools to oversee, manage, and control all recipes in the Jump to Recipe platform. This feature enables admins to view all recipes system-wide, search and filter through them efficiently, edit any recipe using the existing user interface, reassign recipe ownership when necessary, and delete inappropriate or outdated content. By reusing existing user-facing components and workflows, this feature maintains consistency while providing elevated administrative capabilities. The goal is to centralize recipe governance, ensure content quality, and provide admins with the tools needed to manage the recipe ecosystem effectively.

## Requirements

### Requirement 1: Admin Recipe List and Discovery

**User Story:** As an admin, I want to browse all recipes in the system with comprehensive filtering, sorting, and search capabilities, so that I can quickly locate and manage any recipe regardless of ownership.

#### Acceptance Criteria

1. WHEN an admin navigates to `/admin/recipes` THEN the system SHALL display a paginated table of all recipes in the system
2. WHEN the recipe list is displayed THEN the system SHALL show columns for Recipe Title, Owner Name, Date Created, Date Updated, and Visibility status
3. WHEN an admin enters text in the search bar THEN the system SHALL filter recipes by title and tags in real-time
4. WHEN an admin applies the owner filter THEN the system SHALL display only recipes belonging to the selected user
5. WHEN an admin applies the visibility filter THEN the system SHALL display only recipes matching the selected visibility status
6. WHEN an admin clicks a column header THEN the system SHALL sort the recipe list by that column in ascending or descending order
7. WHEN the recipe list exceeds the page limit THEN the system SHALL provide pagination controls to navigate through results
8. WHEN an admin clicks on a recipe row THEN the system SHALL navigate to the public recipe detail page at `/recipes/[id]`

### Requirement 2: Admin Access to Recipe Details

**User Story:** As an admin, I want to view any recipe using the standard recipe detail page, so that I can see the recipe as users see it and access editing capabilities without a separate admin interface.

#### Acceptance Criteria

1. WHEN an admin clicks a recipe from the admin list THEN the system SHALL navigate to `/recipes/[id]` using the existing recipe detail page
2. WHEN an admin views a recipe detail page THEN the system SHALL display the Edit and Delete buttons regardless of recipe ownership
3. WHEN an admin clicks the Edit button THEN the system SHALL navigate to the existing recipe edit page
4. WHEN an admin views a recipe THEN the system SHALL NOT display any admin-specific UI elements on the detail page itself

### Requirement 3: Admin Recipe Editing

**User Story:** As an admin, I want to edit any recipe using the existing recipe edit interface, so that I can make corrections or adjustments without learning a separate admin editing workflow.

#### Acceptance Criteria

1. WHEN an admin accesses the edit page for any recipe THEN the system SHALL display the same edit interface used by recipe owners
2. WHEN an admin edits a recipe THEN the system SHALL allow modification of title, ingredients, sections, steps, tags, and metadata
3. WHEN an admin saves recipe changes THEN the system SHALL persist the changes to the database
4. WHEN an admin saves recipe changes THEN the system SHALL update the "Date Updated" timestamp
5. IF the admin is not changing ownership THEN the system SHALL NOT modify the recipe's owner field

### Requirement 4: Recipe Ownership Reassignment

**User Story:** As an admin, I want to reassign recipe ownership to different users, so that I can correct ownership issues or transfer recipes when users leave the platform.

#### Acceptance Criteria

1. WHEN an admin views the recipe edit page THEN the system SHALL display an "Assign Owner" section visible only to admins
2. WHEN the "Assign Owner" section is displayed THEN the system SHALL show a searchable dropdown listing all active users
3. WHEN the "Assign Owner" dropdown is rendered THEN the system SHALL preselect the current recipe owner
4. WHEN an admin types in the owner dropdown THEN the system SHALL filter users by name or email
5. WHEN an admin selects a new owner and saves THEN the system SHALL update the recipe's `ownerId` field to the selected user
6. WHEN an admin attempts to save without selecting an owner THEN the system SHALL display a validation error indicating owner is required
7. WHEN a non-admin user views the recipe edit page THEN the system SHALL NOT display the "Assign Owner" section
8. WHEN the backend receives an ownership change request THEN the system SHALL verify the requester has admin privileges before applying the change
9. WHEN the backend receives an invalid `ownerId` THEN the system SHALL return a validation error

### Requirement 5: Admin Recipe Deletion

**User Story:** As an admin, I want to delete any recipe from the system, so that I can remove inappropriate, duplicate, or outdated content to maintain platform quality.

#### Acceptance Criteria

1. WHEN an admin views any recipe edit page THEN the system SHALL display the existing Delete button
2. WHEN an admin clicks the Delete button THEN the system SHALL display the existing delete confirmation modal
3. WHEN an admin confirms deletion THEN the system SHALL permanently remove the recipe from the database
4. WHEN an admin confirms deletion THEN the system SHALL remove all associated recipe data including photos, sections, and relationships
5. WHEN a recipe is successfully deleted THEN the system SHALL redirect the admin to the admin recipe list page
6. WHEN the backend receives a delete request THEN the system SHALL verify the requester has admin privileges or is the recipe owner before allowing deletion

### Requirement 6: Performance and Scalability

**User Story:** As an admin managing a large recipe database, I want the recipe list to load quickly and handle searches efficiently, so that I can work productively without delays.

#### Acceptance Criteria

1. WHEN the admin recipe list loads THEN the system SHALL execute server-side queries with database-level filtering
2. WHEN an admin applies filters or searches THEN the system SHALL return results within 2 seconds for databases up to 10,000 recipes
3. WHEN pagination is used THEN the system SHALL load only the current page of results to minimize data transfer
4. WHEN sorting is applied THEN the system SHALL perform sorting at the database level rather than client-side

### Requirement 7: Security and Authorization

**User Story:** As a system administrator, I want to ensure that only authorized admins can access recipe management features, so that regular users cannot manipulate recipes they don't own.

#### Acceptance Criteria

1. WHEN a non-admin user attempts to access `/admin/recipes` THEN the system SHALL redirect to an unauthorized error page
2. WHEN a non-admin user attempts to edit another user's recipe THEN the system SHALL deny access and return a 403 error
3. WHEN a non-admin user attempts to change recipe ownership via API THEN the system SHALL reject the request and return a 403 error
4. WHEN an admin session expires THEN the system SHALL require re-authentication before allowing admin actions
5. WHEN the backend receives any admin action request THEN the system SHALL verify admin role from the authenticated session
