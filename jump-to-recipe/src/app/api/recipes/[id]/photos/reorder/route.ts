import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipePhotos } from '@/db/schema/recipe-photos';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { reorderRecipePhotos } from '@/lib/photo-operations';
import { withRecipePermission } from '@/lib/recipe-permissions';
import { validatePhotoReorder } from '@/lib/validations/photo-validation';

// Validation schema for reorder request
const reorderSchema = z.object({
  photoOrders: z.array(z.object({
    id: z.string().uuid('Invalid photo ID format'),
    position: z.number().int().min(0, 'Position must be non-negative'),
  })).min(1, 'At least one photo order must be provided'),
});

/**
 * PATCH /api/recipes/[id]/photos/reorder
 * 
 * Updates the position/order of photos for a specific recipe
 * Requires authentication and edit permissions
 */
const patchHandler = async (
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

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON in request body',
          details: error instanceof Error ? error.message : 'Failed to parse JSON'
        },
        { status: 400 }
      );
    }

    // Validate request schema
    const validation = reorderSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { photoOrders } = validation.data;

    // Fetch existing photos to validate reorder request
    const existingPhotos = await db.query.recipePhotos.findMany({
      where: and(
        eq(recipePhotos.recipeId, recipeId),
        isNull(recipePhotos.deletedAt)
      ),
    });

    if (existingPhotos.length === 0) {
      return NextResponse.json(
        { 
          error: 'No photos found for this recipe',
          details: 'Cannot reorder photos for a recipe with no photos'
        },
        { status: 404 }
      );
    }

    // Validate photo IDs and order
    const photoIds = photoOrders.map(p => p.id);
    const existingPhotoIds = existingPhotos.map(p => p.id);
    
    const reorderValidation = validatePhotoReorder(photoIds, existingPhotoIds);
    if (!reorderValidation.isValid) {
      return NextResponse.json(
        { 
          error: reorderValidation.error,
          details: 'Photo reorder validation failed',
          providedIds: photoIds,
          existingIds: existingPhotoIds
        },
        { status: 400 }
      );
    }

    // Validate positions are within range
    const maxPosition = existingPhotos.length - 1;
    const invalidPositions = photoOrders.filter(p => p.position < 0 || p.position > maxPosition);
    
    if (invalidPositions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid photo positions',
          details: `Positions must be between 0 and ${maxPosition}`,
          invalidPositions: invalidPositions.map(p => ({ id: p.id, position: p.position }))
        },
        { status: 400 }
      );
    }

    // Use utility function to reorder photos
    const reorderResult = await reorderRecipePhotos(recipeId, photoOrders);
    
    if (!reorderResult.success) {
      return NextResponse.json(
        { 
          error: reorderResult.error,
          details: 'Failed to update photo positions'
        },
        { status: 400 }
      );
    }

    // Fetch all photos for the recipe to return updated order
    const allPhotos = await db.query.recipePhotos.findMany({
      where: and(
        eq(recipePhotos.recipeId, recipeId),
        isNull(recipePhotos.deletedAt)
      ),
      orderBy: [recipePhotos.position],
    });

    return NextResponse.json({
      success: true,
      message: `Successfully reordered ${reorderResult.updatedPhotos?.length || 0} photo${reorderResult.updatedPhotos?.length !== 1 ? 's' : ''}`,
      photos: allPhotos,
      updatedCount: reorderResult.updatedPhotos?.length || 0,
    });

  } catch (error) {
    console.error('Error reordering recipe photos:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to reorder photos';
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

export const PATCH = withRecipePermission(patchHandler, 'edit');