# Requirements Document

## Introduction

The Original Recipe Photos feature enables users to upload, manage, and view multiple photos associated with their recipes. This feature enhances the cookbook experience by allowing users to visually document their cooking results, share visual references with collaborators, and create more engaging recipe collections. The system supports multiple photo uploads, drag-and-drop reordering, soft deletion for data retention, and a lightbox viewer for optimal photo viewing.

## Requirements

### Requirement 1

**User Story:** As a recipe creator, I want to upload multiple original photos to my recipes, so that I can visually document my cooking results and share them with others.

#### Acceptance Criteria

1. WHEN a user is creating or editing a recipe THEN the system SHALL provide a photo upload interface with drag-and-drop functionality
2. WHEN a user uploads photos THEN the system SHALL accept JPEG, PNG, HEIC, WEBP and other browser-supported image formats
3. WHEN a user uploads a file larger than 10MB THEN the system SHALL display a user-friendly error message and reject the upload
4. WHEN a user attempts to upload more than 10 photos per recipe THEN the system SHALL prevent the upload and display an appropriate error message
5. WHEN photos are uploaded THEN the system SHALL store them locally using the path structure: recipe_photos/{recipeId}/{photoId}.{ext}

### Requirement 2

**User Story:** As a recipe viewer, I want to see original photos in an intuitive interface, so that I can better understand what the recipe should look like.

#### Acceptance Criteria

1. WHEN a user views a recipe with photos THEN the system SHALL display photos in a grid layout with thumbnail previews
2. WHEN a user clicks on any photo thumbnail THEN the system SHALL open a lightbox viewer with fullscreen display
3. WHEN the lightbox is open THEN the system SHALL provide next/previous navigation between photos
4. WHEN viewing on mobile THEN the system SHALL support pinch-to-zoom functionality in the lightbox
5. WHEN no photos exist THEN the system SHALL display a placeholder with "Add original photos" message

### Requirement 3

**User Story:** As a recipe editor, I want to reorder and manage my recipe photos, so that I can organize them in the most logical sequence.

#### Acceptance Criteria

1. WHEN a user is editing a recipe THEN the system SHALL provide drag-and-drop functionality to reorder photos
2. WHEN photos are reordered THEN the system SHALL persist the new order using a position column
3. WHEN a user deletes a photo THEN the system SHALL perform a soft delete by setting a deletedAt timestamp
4. WHEN photos are soft deleted THEN the system SHALL exclude them from normal display but retain the files on disk
5. WHEN displaying photos THEN the system SHALL show them in the correct order based on the position field

### Requirement 4

**User Story:** As a cookbook collaborator, I want appropriate permissions to manage photos based on my access level, so that I can contribute to or view recipe content appropriately.

#### Acceptance Criteria

1. WHEN a user has view-only access to a recipe THEN the system SHALL allow them to view all existing photos but not modify them
2. WHEN a user has edit access to a recipe THEN the system SHALL allow them to upload new photos, delete existing photos, and reorder photos
3. WHEN a collaborator uploads photos THEN the system SHALL apply the same validation rules as for recipe owners
4. WHEN a collaborator attempts unauthorized actions THEN the system SHALL prevent the action and display appropriate feedback

### Requirement 5

**User Story:** As a system administrator, I want configurable limits and validation, so that I can manage storage resources and ensure system performance.

#### Acceptance Criteria

1. WHEN the system starts THEN it SHALL read MAX_RECIPE_PHOTO_SIZE_MB from environment variables (default: 10MB)
2. WHEN the system starts THEN it SHALL read MAX_RECIPE_PHOTO_COUNT from environment variables (default: 10)
3. WHEN a file is uploaded THEN the system SHALL validate the MIME type to ensure it's an image format
4. WHEN validation fails THEN the system SHALL provide specific error messages for file size, count limits, and invalid file types
5. WHEN photos are uploaded THEN the system SHALL store metadata including filePath, fileName, fileSize, mimeType, and position

### Requirement 6

**User Story:** As a user, I want a responsive and intuitive photo management interface, so that I can easily work with photos across different devices.

#### Acceptance Criteria

1. WHEN uploading photos THEN the system SHALL show thumbnail previews before saving
2. WHEN upload errors occur THEN the system SHALL display inline error messages next to affected files
3. WHEN on mobile devices THEN the system SHALL provide touch-friendly drag handles for reordering
4. WHEN the lightbox is open THEN users SHALL be able to close it via close button or backdrop click
5. WHEN photos are loading THEN the system SHALL display appropriate loading states and progress indicators