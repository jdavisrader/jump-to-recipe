# Design Document

## Overview

The Original Recipe Photos feature extends the existing recipe system to support multiple photo uploads per recipe. The design leverages the current file storage infrastructure while adding new database tables, API endpoints, and UI components for comprehensive photo management. The system maintains consistency with existing patterns for authentication, file handling, and UI components while introducing new capabilities for photo ordering, soft deletion, and lightbox viewing.

## Architecture

### Database Layer
The feature introduces a new `recipe_photos` table that references the existing `recipes` table. This maintains data integrity while allowing for flexible photo management:

```sql
CREATE TABLE recipe_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipe_photos_recipe_id ON recipe_photos(recipe_id);
CREATE INDEX idx_recipe_photos_position ON recipe_photos(recipe_id, position) WHERE deleted_at IS NULL;
```

### File Storage Integration
The feature extends the existing file storage system (`/lib/file-storage.ts`) by:
- Adding a new `recipe-photos` category to the upload system
- Using the existing local/S3 storage configuration
- Implementing photo-specific processing (resize to max 1200x800, 85% quality)
- Maintaining the current file naming convention with recipe-specific subdirectories

### API Layer
New API endpoints follow the existing REST patterns:
- `POST /api/recipes/[id]/photos` - Upload multiple photos
- `GET /api/recipes/[id]/photos` - Retrieve photos for a recipe
- `PATCH /api/recipes/[id]/photos/reorder` - Update photo positions
- `DELETE /api/recipes/photos/[photoId]` - Soft delete a photo

## Components and Interfaces

### Core Components

#### RecipePhotosManager
Main component for photo management during recipe editing:
```typescript
interface RecipePhotosManagerProps {
  recipeId: string;
  photos: RecipePhoto[];
  canEdit: boolean;
  onPhotosChange: (photos: RecipePhoto[]) => void;
}
```

Features:
- Drag-and-drop upload zone using react-dropzone
- Photo grid with reordering via drag-and-drop
- Delete buttons with confirmation
- Progress indicators for uploads
- Error handling and validation feedback

#### RecipePhotosViewer
Component for displaying photos in recipe view:
```typescript
interface RecipePhotosViewerProps {
  photos: RecipePhoto[];
  className?: string;
}
```

Features:
- Responsive grid layout (2-3 columns on mobile, 4-5 on desktop)
- Thumbnail optimization
- Click to open lightbox
- Empty state handling

#### PhotoLightbox
Modal component for fullscreen photo viewing:
```typescript
interface PhotoLightboxProps {
  photos: RecipePhoto[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}
```

Features:
- Fullscreen overlay with backdrop blur
- Next/previous navigation with keyboard support
- Zoom functionality (pinch-to-zoom on mobile)
- Swipe gestures for mobile navigation
- Close on backdrop click or ESC key

### Data Models

#### RecipePhoto Interface
```typescript
interface RecipePhoto {
  id: string;
  recipeId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  position: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RecipePhotoUpload {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}
```

#### Extended Recipe Types
```typescript
interface RecipeWithPhotos extends Recipe {
  photos: RecipePhoto[];
}
```

### Permission System Integration
The feature integrates with the existing cookbook permission system:
- Recipe owners can manage all photos
- Collaborators with edit permissions can upload, reorder, and delete photos
- View-only users can only view photos in the lightbox
- Permission checks occur at both API and component levels

## Error Handling

### Validation Strategy
- **Client-side**: Immediate feedback for file type, size, and count limits
- **Server-side**: Comprehensive validation with detailed error messages
- **Progressive enhancement**: Graceful degradation when JavaScript is disabled

### Error Types and Handling
1. **File Validation Errors**
   - Invalid file type → Show inline error with supported formats
   - File too large → Display size limit and suggest compression
   - Too many files → Prevent upload and show count limit

2. **Upload Errors**
   - Network failure → Retry mechanism with exponential backoff
   - Server error → Display user-friendly message with retry option
   - Authentication error → Redirect to login

3. **Permission Errors**
   - Unauthorized access → Hide edit controls, show read-only view
   - Insufficient permissions → Display appropriate messaging

## Testing Strategy

### Unit Tests
- Photo upload validation logic
- Photo reordering algorithms
- Soft deletion functionality
- Permission checking utilities

### Integration Tests
- API endpoint functionality
- File storage operations
- Database operations with transactions
- Authentication and authorization flows

### Component Tests
- Photo upload component behavior
- Lightbox navigation and controls
- Drag-and-drop reordering
- Responsive layout rendering

### End-to-End Tests
- Complete photo upload workflow
- Photo management in recipe editing
- Lightbox viewing experience
- Permission-based access control

## Performance Considerations

### Image Optimization
- Automatic resizing to 1200x800 maximum dimensions
- Quality compression to 85% for optimal file size
- WebP format conversion when supported
- Lazy loading for photo grids

### Database Optimization
- Indexed queries on recipe_id and position
- Soft deletion to avoid cascade operations
- Efficient pagination for recipes with many photos

### Caching Strategy
- Browser caching for uploaded images
- CDN integration for S3-stored photos
- Component-level caching for photo metadata

### Mobile Performance
- Touch-optimized drag handles
- Optimized image sizes for mobile viewports
- Efficient gesture handling for lightbox
- Progressive loading for large photo sets

## Security Considerations

### File Upload Security
- MIME type validation on both client and server
- File size limits enforced at multiple levels
- Virus scanning integration points (future enhancement)
- Secure file naming to prevent path traversal

### Access Control
- Recipe-level permissions for photo management
- User authentication required for all operations
- Rate limiting on upload endpoints
- CSRF protection for state-changing operations

### Data Privacy
- Soft deletion maintains audit trail
- Photo URLs are not guessable
- Private recipe photos respect recipe visibility settings
- GDPR compliance for user data deletion