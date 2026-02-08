/**
 * Error Recovery Utilities for Drag-and-Drop Operations
 * 
 * Provides snapshot management, error detection, and recovery mechanisms
 * for ingredient drag-and-drop operations to ensure data integrity.
 */

import { toast } from '@/components/ui/use-toast';
import type { Ingredient } from '@/types/recipe';
import type { IngredientSection } from '@/types/sections';
import { validatePositions, normalizePositions } from './section-position-utils';

/**
 * Snapshot of ingredient state for rollback purposes
 */
export interface IngredientSnapshot {
  timestamp: number;
  ingredients?: Ingredient[];
  sections?: IngredientSection[];
  mode: 'flat' | 'sectioned';
}

/**
 * Error types for drag-and-drop operations
 */
export enum DragErrorType {
  INVALID_DESTINATION = 'INVALID_DESTINATION',
  POSITION_CONFLICT = 'POSITION_CONFLICT',
  MISSING_SECTION = 'MISSING_SECTION',
  INVALID_INDEX = 'INVALID_INDEX',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  SAVE_FAILURE = 'SAVE_FAILURE',
}

/**
 * Drag operation error with context
 */
export class DragOperationError extends Error {
  constructor(
    public type: DragErrorType,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'DragOperationError';
  }
}

/**
 * Snapshot manager for ingredient state
 */
export class SnapshotManager {
  private snapshots: IngredientSnapshot[] = [];
  private maxSnapshots = 10;

  /**
   * Create a snapshot of current ingredient state
   */
  createSnapshot(
    ingredients?: Ingredient[],
    sections?: IngredientSection[],
    mode: 'flat' | 'sectioned' = 'flat'
  ): IngredientSnapshot {
    const snapshot: IngredientSnapshot = {
      timestamp: Date.now(),
      mode,
      ingredients: ingredients ? JSON.parse(JSON.stringify(ingredients)) : undefined,
      sections: sections ? JSON.parse(JSON.stringify(sections)) : undefined,
    };

    this.snapshots.push(snapshot);

    // Keep only the most recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Get the most recent snapshot
   */
  getLatestSnapshot(): IngredientSnapshot | null {
    return this.snapshots.length > 0
      ? this.snapshots[this.snapshots.length - 1]
      : null;
  }

  /**
   * Get a snapshot by index (0 = oldest, -1 = newest)
   */
  getSnapshot(index: number): IngredientSnapshot | null {
    if (index < 0) {
      index = this.snapshots.length + index;
    }
    return this.snapshots[index] || null;
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this.snapshots = [];
  }

  /**
   * Get number of stored snapshots
   */
  getSnapshotCount(): number {
    return this.snapshots.length;
  }
}

/**
 * Validates a drag destination
 */
export function validateDragDestination(
  destination: { droppableId: string; index: number } | null | undefined,
  sections?: IngredientSection[],
  flatIngredients?: Ingredient[]
): { isValid: boolean; error?: DragOperationError } {
  // No destination means dropped outside valid area
  if (!destination) {
    return {
      isValid: false,
      error: new DragOperationError(
        DragErrorType.INVALID_DESTINATION,
        'Item was dropped outside a valid drop zone',
        { destination }
      ),
    };
  }

  // Validate index is non-negative
  if (destination.index < 0) {
    return {
      isValid: false,
      error: new DragOperationError(
        DragErrorType.INVALID_INDEX,
        'Invalid drop index',
        { index: destination.index }
      ),
    };
  }

  // For sectioned mode, validate section exists
  if (sections && destination.droppableId.startsWith('section-')) {
    const sectionId = destination.droppableId.replace('section-', '');
    const section = sections.find((s) => s.id === sectionId);

    if (!section) {
      return {
        isValid: false,
        error: new DragOperationError(
          DragErrorType.MISSING_SECTION,
          'Target section not found',
          { sectionId, droppableId: destination.droppableId }
        ),
      };
    }

    // Validate index is within bounds (can be equal to length for append)
    if (destination.index > section.items.length) {
      return {
        isValid: false,
        error: new DragOperationError(
          DragErrorType.INVALID_INDEX,
          'Drop index exceeds section length',
          {
            index: destination.index,
            sectionLength: section.items.length,
            sectionId,
          }
        ),
      };
    }
  }

  // For flat mode, validate index is within bounds
  if (flatIngredients && destination.droppableId === 'flat-ingredients-list') {
    if (destination.index > flatIngredients.length) {
      return {
        isValid: false,
        error: new DragOperationError(
          DragErrorType.INVALID_INDEX,
          'Drop index exceeds list length',
          {
            index: destination.index,
            listLength: flatIngredients.length,
          }
        ),
      };
    }
  }

  return { isValid: true };
}

/**
 * Detects position conflicts in ingredient data
 */
export function detectPositionConflicts(
  items: Array<{ id: string; position?: number }>
): {
  hasConflicts: boolean;
  conflicts: Array<{ position: number; ids: string[] }>;
} {
  const positionMap = new Map<number, string[]>();

  items.forEach((item) => {
    if (typeof item.position === 'number') {
      const ids = positionMap.get(item.position) || [];
      ids.push(item.id);
      positionMap.set(item.position, ids);
    }
  });

  const conflicts: Array<{ position: number; ids: string[] }> = [];

  positionMap.forEach((ids, position) => {
    if (ids.length > 1) {
      conflicts.push({ position, ids });
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Auto-corrects position conflicts by reindexing
 */
export function autoCorrectPositions<T extends { id: string; position?: number }>(
  items: T[]
): T[] {
  // Add positions if missing
  const itemsWithPositions = items.map((item, index) => ({
    ...item,
    position: typeof item.position === 'number' ? item.position : index,
  }));

  // Sort by position, then by id for stability
  const sorted = [...itemsWithPositions].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return a.id.localeCompare(b.id);
  });

  // Reindex to sequential positions
  return sorted.map((item, index) => ({
    ...item,
    position: index,
  }));
}

/**
 * Validates ingredient data integrity
 */
export function validateIngredientData(
  ingredients: Ingredient[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  ingredients.forEach((ingredient, index) => {
    // Check for required ID
    if (!ingredient.id) {
      errors.push(`Ingredient at index ${index} is missing an ID`);
    }

    // Check for duplicate IDs
    const duplicateIndex = ingredients.findIndex(
      (ing, idx) => idx !== index && ing.id === ingredient.id
    );
    if (duplicateIndex >= 0) {
      errors.push(
        `Duplicate ingredient ID found: ${ingredient.id} at indices ${index} and ${duplicateIndex}`
      );
    }

    // Check for negative amounts
    if (ingredient.amount < 0) {
      errors.push(
        `Ingredient "${ingredient.name || 'unnamed'}" has negative amount: ${ingredient.amount}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates section data integrity
 */
export function validateSectionData(
  sections: IngredientSection[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  sections.forEach((section, index) => {
    // Check for required ID
    if (!section.id) {
      errors.push(`Section at index ${index} is missing an ID`);
    }

    // Check for duplicate section IDs
    const duplicateIndex = sections.findIndex(
      (sec, idx) => idx !== index && sec.id === section.id
    );
    if (duplicateIndex >= 0) {
      errors.push(
        `Duplicate section ID found: ${section.id} at indices ${index} and ${duplicateIndex}`
      );
    }

    // Check for empty section name
    if (!section.name || section.name.trim() === '') {
      errors.push(`Section at index ${index} has empty name`);
    }

    // Validate items in section
    const itemValidation = validateIngredientData(section.items);
    if (!itemValidation.isValid) {
      itemValidation.errors.forEach((error) => {
        errors.push(`Section "${section.name}" (index ${index}): ${error}`);
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Shows user-friendly error toast notification
 */
export function showDragErrorToast(error: DragOperationError): void {
  const errorMessages: Record<DragErrorType, { title: string; description: string }> = {
    [DragErrorType.INVALID_DESTINATION]: {
      title: 'Invalid Drop Location',
      description: 'Please drop the ingredient in a valid area.',
    },
    [DragErrorType.POSITION_CONFLICT]: {
      title: 'Position Conflict Detected',
      description: 'Ingredient positions have been automatically corrected.',
    },
    [DragErrorType.MISSING_SECTION]: {
      title: 'Section Not Found',
      description: 'The target section could not be found. Please try again.',
    },
    [DragErrorType.INVALID_INDEX]: {
      title: 'Invalid Position',
      description: 'The drop position is invalid. Please try again.',
    },
    [DragErrorType.DATA_CORRUPTION]: {
      title: 'Data Error',
      description: 'An error occurred with the ingredient data. Changes have been reverted.',
    },
    [DragErrorType.SAVE_FAILURE]: {
      title: 'Save Failed',
      description: 'Failed to save changes. Please try again.',
    },
  };

  const message = errorMessages[error.type] || {
    title: 'Operation Failed',
    description: error.message || 'An unexpected error occurred.',
  };

  toast({
    title: message.title,
    description: message.description,
    variant: 'destructive',
  });

  // Log detailed error for debugging
  console.error('Drag operation error:', {
    type: error.type,
    message: error.message,
    context: error.context,
  });
}

/**
 * Shows success toast notification
 */
export function showDragSuccessToast(message: string): void {
  toast({
    title: 'Success',
    description: message,
  });
}

/**
 * Recovers from a failed drag operation by reverting to snapshot
 */
export function recoverFromDragError(
  error: DragOperationError,
  snapshot: IngredientSnapshot | null,
  onRevert: (snapshot: IngredientSnapshot) => void
): void {
  // Show error toast
  showDragErrorToast(error);

  // Revert to snapshot if available
  if (snapshot) {
    onRevert(snapshot);
    console.log('Reverted to snapshot:', snapshot.timestamp);
  } else {
    console.warn('No snapshot available for recovery');
  }
}

/**
 * Safely executes a drag operation with error handling and recovery
 */
export async function executeDragOperationSafely<T>(
  operation: () => T | Promise<T>,
  snapshotManager: SnapshotManager,
  onError?: (error: DragOperationError) => void
): Promise<{ success: boolean; result?: T; error?: DragOperationError }> {
  try {
    const result = await Promise.resolve(operation());
    return { success: true, result };
  } catch (error) {
    const dragError =
      error instanceof DragOperationError
        ? error
        : new DragOperationError(
            DragErrorType.DATA_CORRUPTION,
            error instanceof Error ? error.message : 'Unknown error occurred',
            { originalError: error }
          );

    // Call error handler if provided
    if (onError) {
      onError(dragError);
    } else {
      // Default error handling
      showDragErrorToast(dragError);
    }

    return { success: false, error: dragError };
  }
}
