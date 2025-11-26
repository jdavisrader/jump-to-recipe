import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { recipePhotos } from '@/db/schema/recipe-photos';
import { uploadRecipePhotos, validateRecipePhotos, FILE_STORAGE_CONFIG } from '@/lib/file-storage';
import { and, eq, isNull, desc } from 'drizzle-orm';
import { withRecipePermission, getRecipePermissionForSession } from '@/lib/recipe-permissions';
import { validatePhotoFiles, validatePhotoCount } from '@/lib/validations/photo-validation';

/**
 * GET /api/recipes/[id]/photos
 * 
 * Retrieves all photos for a specific recipe
 * Respects recipe visibility and user permissions
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params;

    // Get current user from session
    const session = await getServerSession(authOptions);

    // Check if user has permission to view this recipe
    const permission = await getRecipePermissionForSession(recipeId, session);

    if (permission === 'none') {
      return NextResponse.json(
        { error: 'Not authorized to view this recipe' },
        { status: 403 }
      );
    }

    // Fetch photos for the recipe (excluding soft-deleted ones)
    const photos = await db.query.recipePhotos.findMany({
      where: and(
        eq(recipePhotos.recipeId, recipeId),
        isNull(recipePhotos.deletedAt)
      ),
      orderBy: [recipePhotos.position, desc(recipePhotos.createdAt)],
    });

    return NextResponse.json({
      success: true,
      photos,
      count: photos.length,
      permission, // Include permission level in response for UI
    });

  } catch (error) {
    console.error('Error fetching recipe photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe photos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/recipes/[id]/photos
 * 
 * Uploads multiple photos for a specific recipe
 * Requires authentication and edit permissions
 */
const postHandler = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> | Promise<{ photoId: string }> | { id: string } | { photoId: string } }
) => {
  try {
    // Await params if it's a Promise (Next.js 15)
    const params = context.params instanceof Promise ? await context.params : context.params;
    
    // Extract id from params
    if (!('id' in params)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    const { id: recipeId } = params;

    // Parse form data with error handling
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Failed to parse form data. Request may be too large.',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    }

    const files: File[] = [];
    
    // Extract all files from form data
    formData.forEach((value, key) => {
      if (key.startsWith('photos') && value instanceof File) {
        files.push(value);
      }
    });

    // Validate files exist
    if (files.length === 0) {
      return NextResponse.json(
        { 
          error: 'No photos provided',
          details: 'Please select at least one photo to upload'
        },
        { status: 400 }
      );
    }

    // Check current photo count to enforce limits
    const existingPhotos = await db.query.recipePhotos.findMany({
      where: and(
        eq(recipePhotos.recipeId, recipeId),
        isNull(recipePhotos.deletedAt)
      ),
    });

    // Validate photo count
    const countValidation = validatePhotoCount(files.length, existingPhotos.length);
    if (!countValidation.isValid) {
      return NextResponse.json(
        { 
          error: countValidation.error,
          currentCount: existingPhotos.length,
          attemptedCount: files.length,
          maxCount: FILE_STORAGE_CONFIG.MAX_RECIPE_PHOTO_COUNT
        },
        { status: 400 }
      );
    }

    // Validate files using comprehensive validation
    const filesValidation = validatePhotoFiles(files, existingPhotos.length);
    if (!filesValidation.isValid) {
      return NextResponse.json(
        { 
          error: filesValidation.error,
          errors: filesValidation.errors,
          details: 'One or more files failed validation'
        },
        { status: 400 }
      );
    }

    // Additional validation using existing file storage validation
    const storageValidation = validateRecipePhotos(files);
    if (!storageValidation.isValid) {
      return NextResponse.json(
        { 
          error: storageValidation.error,
          details: 'File storage validation failed'
        },
        { status: 400 }
      );
    }

    // Upload files to storage with error handling
    let uploadResults;
    try {
      uploadResults = await uploadRecipePhotos(files, recipeId);
    } catch (error) {
      console.error('File upload error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to upload files to storage',
          details: error instanceof Error ? error.message : 'Unknown storage error'
        },
        { status: 500 }
      );
    }

    // Calculate starting position for new photos
    const maxPosition = existingPhotos.length > 0 
      ? Math.max(...existingPhotos.map(p => p.position))
      : -1;

    // Save photo metadata to database
    const photoRecords = uploadResults.map((result, index) => ({
      recipeId,
      filePath: result.url,
      fileName: result.filename,
      fileSize: result.size,
      mimeType: result.type,
      position: maxPosition + 1 + index,
    }));

    let savedPhotos;
    try {
      savedPhotos = await db.insert(recipePhotos)
        .values(photoRecords)
        .returning();
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to save photo metadata',
          details: error instanceof Error ? error.message : 'Database error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      photos: savedPhotos,
      message: `Successfully uploaded ${savedPhotos.length} photo${savedPhotos.length > 1 ? 's' : ''}`,
      count: savedPhotos.length,
    });

  } catch (error) {
    console.error('Error uploading recipe photos:', error);
    
    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload photos';
    const errorDetails = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : 'An unexpected error occurred',
        success: false 
      },
      { status: 500 }
    );
  }
};

export const POST = withRecipePermission(postHandler, 'edit');

// Note: In Next.js 15 App Router, body size limits are configured in next.config.ts
// The default limit is 4MB. For larger uploads, configure in next.config.ts:
// experimental: { serverActions: { bodySizeLimit: '10mb' } }