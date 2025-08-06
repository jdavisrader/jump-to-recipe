# Image Upload Implementation

This document outlines the file upload and image handling functionality that has been implemented for the Jump to Recipe application.

## Overview

The implementation provides secure file upload capabilities with local storage (and optional S3 support), featuring automatic image optimization, resizing, and support for recipe images, cookbook covers, and user avatars.

## Components Implemented

### Core Upload Infrastructure

1. **File Storage System** (`src/lib/file-storage.ts`)
   - Local file storage with optional S3 support
   - Automatic image optimization and resizing using Sharp
   - Category-based organization (recipes, cookbooks, avatars)
   - File validation and security checks

2. **Upload API Route** (`src/app/api/upload/route.ts`)
   - Secure file upload endpoint with authentication
   - Form data processing and validation
   - Category-specific image optimization settings
   - Error handling and response formatting

3. **Image Management** (`src/app/api/images/delete/route.ts`)
   - Secure file deletion for both local and S3 storage
   - Authentication and ownership verification
   - Graceful error handling

### UI Components

1. **Generic Image Upload** (`src/components/ui/image-upload.tsx`)
   - Drag-and-drop file upload with preview
   - Progress indicators and error handling
   - Configurable for different upload endpoints
   - Supports image removal functionality

2. **Recipe Image Upload** (`src/components/recipes/recipe-image-upload.tsx`)
   - Specialized component for recipe images
   - Aspect ratio optimized for recipe cards
   - Integrated with recipe forms

3. **Cookbook Image Upload** (`src/components/cookbooks/cookbook-image-upload.tsx`)
   - Specialized component for cookbook covers
   - Portrait aspect ratio for book-like appearance
   - Integrated with cookbook forms

4. **Avatar Upload** (`src/components/ui/avatar-upload.tsx`)
   - User profile picture upload
   - Circular avatar display with camera overlay
   - Edit mode with preview functionality

### Image Display Components

1. **Recipe Image** (`src/components/recipes/recipe-image.tsx`)
   - Displays recipe images with fallback
   - Handles broken image URLs gracefully
   - Supports various aspect ratios

2. **Cookbook Image** (`src/components/cookbooks/cookbook-image.tsx`)
   - Displays cookbook covers with fallback
   - Gradient background for missing images
   - Book-themed fallback icon

### Utility Functions

1. **Image Validation** (`src/lib/image-validation.ts`)
   - File type and size validation
   - URL sanitization and validation
   - Trusted domain checking for external URLs
   - Image format validation

2. **File Storage System** (`src/lib/file-storage.ts`)
   - Local and S3 storage abstraction
   - Image processing and optimization with Sharp
   - File validation and security checks
   - Automatic directory management

### User Profile Integration

1. **User Profile Form** (`src/components/user-profile-form.tsx`)
   - Complete profile editing with avatar upload
   - Form validation and error handling
   - Integration with user profile API

2. **User Profile API** (`src/app/api/user/profile/route.ts`)
   - GET/PUT endpoints for user profile management
   - Avatar URL storage in database
   - Validation and error handling

## Integration Points

### Recipe Forms
- Recipe creation and editing forms now include image upload
- Replaces previous text-based image URL input
- Automatic image optimization and storage

### Cookbook Forms
- Cookbook creation and editing forms include cover image upload
- Replaces previous text-based image URL input
- Supports public/private cookbook sharing with images

### User Profiles
- Avatar upload functionality for user accounts
- Profile management with image handling
- Secure image storage and retrieval

## Environment Configuration

### Local Storage (Default)
No additional configuration required. Files are stored in `public/uploads/` directory.

### S3 Storage (Optional)
To use S3 storage, set the following environment variables:
```
USE_S3=true
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## File Size Limits

- **Avatars**: 2MB maximum
- **Recipe Images**: 4MB maximum  
- **Cookbook Covers**: 4MB maximum

## Supported File Types

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## Security Features

- Authentication required for all uploads
- File type validation on client and server
- File size limits enforced
- Secure file deletion with ownership verification
- URL sanitization and validation

## Error Handling

- Client-side validation before upload
- Progress indicators during upload
- Error messages for failed uploads
- Graceful fallbacks for missing images
- Broken image URL handling

## Future Enhancements

The implementation provides a solid foundation for:
- Image optimization and resizing
- Multiple image uploads per recipe
- Image galleries for cookbooks
- Batch image processing
- CDN integration for better performance

## Usage Examples

### Recipe Image Upload
```tsx
<RecipeImageUpload
  value={imageUrl}
  onChange={setImageUrl}
  onRemove={() => setImageUrl("")}
  disabled={isLoading}
/>
```

### Avatar Upload
```tsx
<AvatarUpload
  value={user.image}
  onChange={updateUserImage}
  userName={user.name}
  size="lg"
/>
```

### Generic Image Upload
```tsx
<ImageUpload
  endpoint="recipeImageUploader"
  value={imageUrl}
  onChange={handleImageChange}
  placeholder="Upload recipe image"
/>
```

This implementation successfully addresses all requirements from task 16, providing secure, user-friendly image upload and management capabilities across the application.