Original Recipe Photos — Feature Specification (Markdown)
Overview
This feature enables users to upload, manage, and view original photos associated with a recipe. These photos help users visually understand the recipe outcome and improve the cookbook experience. The system supports multiple uploads, ordering, soft deletion, Lightbox viewing, and collaborative editing.

Goals
Allow users to attach original photos to recipes.
Store photos locally (consistent with existing system patterns).
Provide a smooth upload, reorder, and edit experience.
Ensure performance and safety via file count/size limits.
Support collaborators with edit permissions.

Requirements
1. Storage
Store uploaded images locally (same storage pattern as existing app media).
Use a directory structure like:
recipe_photos/{recipeId}/{photoId}.{ext}

2. File Types & Size Limits
Allowed file types: Allow all image formats supported by the browser (JPEG, PNG, HEIC, WEBP, etc.).
File size limit:
10 MB per file (configurable via environment variable).
If over limit → show user-friendly error message.

3. Photo Count Limits
Hard limit: 10 photos per recipe.
Configurable via environment variable.

4. Viewing Permissions
All users (viewers, collaborators, owners) can view original recipe photos.

5. Photo Reordering
Users can reorder photos:
During recipe creation
During recipe editing
Reordering should use a simple drag-and-drop UI.
Persist order using an order or position column.

6. Deletion Behavior
Photos should be soft deleted, not permanently removed.
Soft delete approach:
Add a deletedAt timestamp.
Exclude deleted photos from normal display.
Keep file on disk for retention or future restore tooling.

7. Photo Viewer
Add a Lightbox viewer when tapping/clicking any photo.
Lightbox features:
Fullscreen view
Next/previous navigation
Zoom / pinch-to-zoom (mobile)
Close button / backdrop click

8. Duplicate Behavior
Allow duplicate photos.
Store each upload as a separate file with its own unique ID.

9. Versioning
No versioning support needed at this time.

10. Collaboration
Collaborators with edit access should be able to:
Upload new original photos
Delete (soft delete) existing photos
Reorder photos
Collaborators with view-only access can:
View all existing photos

Data Model Proposal
Table: recipe_photos
Field	Type	Description
id	uuid	Primary key
recipeId	uuid	FK → recipes table
filePath	string	Local path to image
fileName	string	Original file name
fileSize	int	Bytes
mimeType	string	Browser-reported mime type
position	int	Ordering index
deletedAt	datetime | null	Soft delete timestamp
createdAt	datetime	Upload timestamp
updatedAt	datetime	Update timestamp

API Endpoints (High-Level)
POST /api/recipes/:id/photos
Upload one or more photos.
PATCH /api/recipes/:id/photos/reorder
Save updated order array.
DELETE /api/recipes/photos/:photoId
Soft delete a photo.
GET /api/recipes/:id/photos
Fetch all non-deleted photos.

UI/UX Requirements
Upload UI
Drag-and-drop zone + “Add Photos” button.
Show file size errors inline.
Show thumbnail previews before saving.

Recipe View Page
Grid of thumbnails.
Clicking opens Lightbox.

Recipe Edit Page
Photo grid with:
Drag handles (reorder)
Delete icons
Add new photo button

Empty States
No photos → show placeholder with “Add original photos”.

Validation Rules
Reject files > max file size.
Reject upload if exceeding max count.
Reject non-image files based on MIME validation.
Apply business rules at both frontend & backend.

Environment Variables
MAX_RECIPE_PHOTO_SIZE_MB=10
MAX_RECIPE_PHOTO_COUNT=10
LOCAL_PHOTO_STORAGE_PATH=./storage/recipe_photos
