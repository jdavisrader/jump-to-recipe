import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipePhotos } from '@/db/schema/recipe-photos';
import { and, eq, isNull } from 'drizzle-orm';
import { softDeletePhoto } from '@/lib/photo-operations';
import { withRecipePermission } from '@/lib/recipe-permissions';

/**
 * DELETE /api/recipes/photos/[photoId]
 * 
 * Soft deletes a specific recipe photo
 * Requires authentication and edit permissions on the recipe
 */
const deleteHandler = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | Promise<{ photoId: string }> | { id: string } | { photoId: string } }
) => {
  try {
    // Await params if it's a Promise (Next.js 15)
    const params = context.params instanceof Promise ? await context.params : context.params;
    
    // Extract photoId from params
    if (!('photoId' in params)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    const { photoId } = params;

    // Validate photoId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(photoId)) {
      return NextResponse.json(
        {
          error: 'Invalid photo ID format',
          details: 'Photo ID must be a valid UUID'
        },
        { status: 400 }
      );
    }

    // Find the photo
    const photo = await db.query.recipePhotos.findFirst({
      where: and(
        eq(recipePhotos.id, photoId),
        isNull(recipePhotos.deletedAt)
      ),
    });

    if (!photo) {
      return NextResponse.json(
        {
          error: 'Photo not found',
          details: 'Photo does not exist or has already been deleted'
        },
        { status: 404 }
      );
    }

    // Use utility function to soft delete and reorder
    let deleteResult;
    try {
      deleteResult = await softDeletePhoto(photoId, photo.recipeId);
    } catch (error) {
      console.error('Error in softDeletePhoto:', error);
      return NextResponse.json(
        {
          error: 'Failed to delete photo',
          details: error instanceof Error ? error.message : 'Database operation failed'
        },
        { status: 500 }
      );
    }

    if (!deleteResult.success) {
      return NextResponse.json(
        {
          error: deleteResult.error || 'Failed to delete photo',
          details: 'Photo deletion operation failed'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
      deletedPhotoId: photoId,
      remainingPhotos: deleteResult.remainingPhotos || [],
      remainingCount: deleteResult.remainingPhotos?.length || 0,
    });

  } catch (error) {
    console.error('Error deleting recipe photo:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to delete photo';
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

export const DELETE = withRecipePermission(deleteHandler, 'edit', {
  getRecipeIdFromPhotoId: true,
});

/**
 * GET /api/recipes/photos/[photoId]
 * 
 * Retrieves a specific recipe photo
 * Respects recipe visibility and user permissions
 */
const getHandler = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | Promise<{ photoId: string }> | { id: string } | { photoId: string } }
) => {
  try {
    // Await params if it's a Promise (Next.js 15)
    const params = context.params instanceof Promise ? await context.params : context.params;
    
    // Extract photoId from params
    if (!('photoId' in params)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    const { photoId } = params;

    // Validate photoId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(photoId)) {
      return NextResponse.json(
        {
          error: 'Invalid photo ID format',
          details: 'Photo ID must be a valid UUID'
        },
        { status: 400 }
      );
    }

    // Find the photo
    const photo = await db.query.recipePhotos.findFirst({
      where: and(
        eq(recipePhotos.id, photoId),
        isNull(recipePhotos.deletedAt)
      ),
    });

    if (!photo) {
      return NextResponse.json(
        {
          error: 'Photo not found',
          details: 'Photo does not exist or has been deleted'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      photo,
    });

  } catch (error) {
    console.error('Error fetching recipe photo:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch photo';
    const errorDetails = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
};

export const GET = withRecipePermission(getHandler, 'view', {
  getRecipeIdFromPhotoId: true,
});