# Implementation Plan

- [x] 1. Set up database schema and types
  - Create recipe_photos table schema using Drizzle ORM
  - Add database migration for the new table with proper indexes
  - Define TypeScript types for RecipePhoto and related interfaces
  - Update existing Recipe types to include photos relationship
  - _Requirements: 1.5, 5.5_

- [x] 2. Extend file storage system for recipe photos
  - Add 'recipe-photos' category to existing file storage configuration
  - Update environment variables for photo-specific limits (MAX_RECIPE_PHOTO_SIZE_MB, MAX_RECIPE_PHOTO_COUNT)
  - Modify file storage utility to handle recipe photo subdirectories (recipe_photos/{recipeId}/)
  - Add photo-specific image processing settings (1200x800 max, 85% quality)
  - _Requirements: 1.1, 1.4, 5.1, 5.2_

- [x] 3. Create core photo management API endpoints
  - Implement POST /api/recipes/[id]/photos endpoint for uploading multiple photos
  - Implement GET /api/recipes/[id]/photos endpoint for retrieving recipe photos
  - Add validation for file types, sizes, and count limits in API routes
  - Integrate with existing authentication and permission checking
  - _Requirements: 1.1, 1.2, 1.3, 4.2, 5.3, 5.4_

- [x] 4. Implement photo reordering and deletion APIs
  - Create PATCH /api/recipes/[id]/photos/reorder endpoint for updating photo positions
  - Create DELETE /api/recipes/photos/[photoId] endpoint for soft deletion
  - Add database operations for position management and soft deletion
  - Implement proper error handling and validation for reordering operations
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 5. Build photo upload component
  - Create RecipePhotosUpload component with drag-and-drop functionality using react-dropzone
  - Implement multiple file selection and preview before upload
  - Add progress indicators and error handling for upload states
  - Integrate file validation with user-friendly error messages
  - _Requirements: 1.1, 6.1, 6.2_

- [x] 6. Create photo grid and management interface
  - Build RecipePhotosManager component for editing mode with drag-and-drop reordering
  - Implement photo grid layout with delete buttons and reorder handles
  - Add confirmation dialogs for photo deletion using existing confirmation modal
  - Create responsive design that works on mobile and desktop
  - _Requirements: 3.1, 3.2, 6.3, 6.4_

- [x] 7. Implement photo lightbox viewer
  - Create PhotoLightbox component with fullscreen modal display
  - Add next/previous navigation with keyboard and touch support
  - Implement zoom functionality and pinch-to-zoom for mobile
  - Add backdrop click and ESC key handling for closing lightbox
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 8. Build photo viewer for recipe display
  - Create RecipePhotosViewer component for read-only photo display
  - Implement responsive grid layout with thumbnail optimization
  - Add click handlers to open lightbox from thumbnails
  - Handle empty state with appropriate placeholder messaging
  - _Requirements: 2.1, 2.5_

- [x] 9. Integrate photo management into recipe forms
  - Add RecipePhotosManager to recipe creation and editing forms
  - Update recipe form validation to handle photo data
  - Implement proper form state management for photos
  - Add photo management to recipe editor component
  - _Requirements: 1.1, 3.1, 4.2_

- [x] 10. Add photo display to recipe view pages
  - Integrate RecipePhotosViewer into recipe display components
  - Update recipe page layouts to accommodate photo sections
  - Ensure photos display correctly in different recipe contexts (cookbook view, search results)
  - Add loading states and error handling for photo fetching
  - _Requirements: 2.1, 4.1_

- [x] 11. Implement permission-based photo access
  - Add permission checks to photo API endpoints based on recipe access
  - Update UI components to show/hide photo management based on user permissions
  - Ensure collaborators can manage photos according to their access level
  - Add proper error handling for unauthorized photo operations
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 12. Add comprehensive error handling and validation
  - Implement client-side validation with immediate feedback for file constraints
  - Add server-side validation with detailed error responses
  - Create error boundary components for photo-related failures
  - Add retry mechanisms for failed uploads and network errors
  - _Requirements: 5.3, 5.4, 6.2_

- [x] 13. Write unit tests for photo functionality
  - Create tests for photo upload validation logic
  - Write tests for photo reordering algorithms and position management
  - Add tests for soft deletion functionality and database operations
  - Test permission checking utilities and access control
  - _Requirements: All requirements - testing coverage_

- [x] 14. Write integration tests for photo APIs
  - Test photo upload API endpoints with various file types and sizes
  - Test photo reordering and deletion API functionality
  - Add tests for authentication and authorization flows
  - Test error handling and edge cases in API responses
  - _Requirements: All requirements - API testing_

- [x] 15. Create component tests for photo UI
  - Test photo upload component behavior and user interactions
  - Test lightbox navigation, zoom, and keyboard controls
  - Test drag-and-drop reordering functionality
  - Test responsive layout rendering across different screen sizes
  - _Requirements: All requirements - UI testing_