import { db } from '@/db';
import { recipePhotos } from '@/db/schema/recipe-photos';
import { and, eq, isNull, gt } from 'drizzle-orm';

/**
 * Utility functions for recipe photo operations
 */

export interface PhotoReorderOperation {
  id: string;
  position: number;
}

/**
 * Validates photo reorder operations
 */
export function validatePhotoReorder(
  operations: PhotoReorderOperation[],
  existingPhotoIds: string[]
): { isValid: boolean; error?: string } {
  // Check for empty operations
  if (operations.length === 0) {
    return { isValid: false, error: 'No photo operations provided' };
  }

  // Check for invalid photo IDs
  const existingIdSet = new Set(existingPhotoIds);
  const invalidIds = operations
    .map(op => op.id)
    .filter(id => !existingIdSet.has(id));

  if (invalidIds.length > 0) {
    return { 
      isValid: false, 
      error: `Invalid photo IDs: ${invalidIds.join(', ')}` 
    };
  }

  // Check for duplicate photo IDs in operations
  const operationIds = operations.map(op => op.id);
  const uniqueIds = new Set(operationIds);
  if (operationIds.length !== uniqueIds.size) {
    return { 
      isValid: false, 
      error: 'Duplicate photo IDs in reorder operations' 
    };
  }

  // Check for duplicate positions
  const positions = operations.map(op => op.position);
  const uniquePositions = new Set(positions);
  if (positions.length !== uniquePositions.size) {
    return { 
      isValid: false, 
      error: 'Duplicate positions in reorder operations' 
    };
  }

  // Check position range (should be 0 to n-1)
  const minPosition = Math.min(...positions);
  
  if (minPosition < 0) {
    return { 
      isValid: false, 
      error: 'Positions cannot be negative' 
    };
  }

  // Check for sequential positions (0, 1, 2, ..., n-1)
  const sortedPositions = [...positions].sort((a, b) => a - b);
  for (let i = 0; i < sortedPositions.length; i++) {
    if (sortedPositions[i] !== i) {
      return { 
        isValid: false, 
        error: `Positions must be sequential starting from 0. Missing position: ${i}` 
      };
    }
  }

  const maxPosition = Math.max(...positions);
  if (maxPosition >= operations.length) {
    return { 
      isValid: false, 
      error: `Maximum position (${maxPosition}) must be less than number of photos (${operations.length})` 
    };
  }

  return { isValid: true };
}

/**
 * Reorders photos for a recipe
 */
export async function reorderRecipePhotos(
  recipeId: string,
  operations: PhotoReorderOperation[]
): Promise<{ success: boolean; updatedPhotos?: any[]; error?: string }> {
  try {
    // Get existing photos for validation
    const existingPhotos = await db.query.recipePhotos.findMany({
      where: and(
        eq(recipePhotos.recipeId, recipeId),
        isNull(recipePhotos.deletedAt)
      ),
    });

    const existingPhotoIds = existingPhotos.map(p => p.id);

    // Validate operations
    const validation = validatePhotoReorder(operations, existingPhotoIds);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // Perform updates in a transaction
    const updatedPhotos = await db.transaction(async (tx) => {
      const updates = [];
      
      for (const operation of operations) {
        const result = await tx
          .update(recipePhotos)
          .set({ 
            position: operation.position,
            updatedAt: new Date(),
          })
          .where(and(
            eq(recipePhotos.id, operation.id),
            eq(recipePhotos.recipeId, recipeId),
            isNull(recipePhotos.deletedAt)
          ))
          .returning();
        
        updates.push(...result);
      }
      
      return updates;
    });

    return { success: true, updatedPhotos };

  } catch (error) {
    console.error('Error reordering photos:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reorder photos' 
    };
  }
}

/**
 * Soft deletes a photo and reorders remaining photos
 */
export async function softDeletePhoto(
  photoId: string,
  recipeId: string
): Promise<{ success: boolean; remainingPhotos?: any[]; error?: string }> {
  try {
    // Perform soft deletion and reordering in a transaction
    const result = await db.transaction(async (tx) => {
      // Soft delete the photo
      const deletedPhoto = await tx
        .update(recipePhotos)
        .set({ 
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(recipePhotos.id, photoId),
          isNull(recipePhotos.deletedAt)
        ))
        .returning();

      if (deletedPhoto.length === 0) {
        throw new Error('Photo not found or already deleted');
      }

      // Get remaining photos
      const remainingPhotos = await tx.query.recipePhotos.findMany({
        where: and(
          eq(recipePhotos.recipeId, recipeId),
          isNull(recipePhotos.deletedAt)
        ),
        orderBy: [recipePhotos.position],
      });

      // Reorder remaining photos to fill gaps
      for (let i = 0; i < remainingPhotos.length; i++) {
        if (remainingPhotos[i].position !== i) {
          await tx
            .update(recipePhotos)
            .set({ 
              position: i,
              updatedAt: new Date(),
            })
            .where(eq(recipePhotos.id, remainingPhotos[i].id));
          
          // Update the local array for return
          remainingPhotos[i].position = i;
        }
      }

      return remainingPhotos;
    });

    return { success: true, remainingPhotos: result };

  } catch (error) {
    console.error('Error soft deleting photo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete photo' 
    };
  }
}

/**
 * Gets the next available position for a new photo
 */
export async function getNextPhotoPosition(recipeId: string): Promise<number> {
  const existingPhotos = await db.query.recipePhotos.findMany({
    where: and(
      eq(recipePhotos.recipeId, recipeId),
      isNull(recipePhotos.deletedAt)
    ),
  });

  if (existingPhotos.length === 0) {
    return 0;
  }

  return Math.max(...existingPhotos.map(p => p.position)) + 1;
}

/**
 * Compacts photo positions to ensure they are sequential (0, 1, 2, ...)
 */
export async function compactPhotoPositions(recipeId: string): Promise<void> {
  const photos = await db.query.recipePhotos.findMany({
    where: and(
      eq(recipePhotos.recipeId, recipeId),
      isNull(recipePhotos.deletedAt)
    ),
    orderBy: [recipePhotos.position],
  });

  await db.transaction(async (tx) => {
    for (let i = 0; i < photos.length; i++) {
      if (photos[i].position !== i) {
        await tx
          .update(recipePhotos)
          .set({ 
            position: i,
            updatedAt: new Date(),
          })
          .where(eq(recipePhotos.id, photos[i].id));
      }
    }
  });
}