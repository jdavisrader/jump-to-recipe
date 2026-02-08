/**
 * Position Management Utilities for Recipe Sections
 * 
 * Provides functions for managing positions of sections and items within sections,
 * including validation, reindexing, and conflict resolution for multi-user scenarios.
 * 
 * Performance optimizations (Requirement 8.4):
 * - Efficient array operations with minimal copying
 * - Early returns for edge cases
 * - Stable sorting for consistent results
 * - Optimized position calculations
 */

interface PositionedItem {
  id: string;
  position: number;
  [key: string]: any;
}

interface PositionedSection<T = PositionedItem> {
  id: string;
  position: number;
  items: T[];
  [key: string]: any;
}

interface PositionValidationResult {
  isValid: boolean;
  errors: string[];
  duplicates: number[];
  invalid: number[];
}

/**
 * Reindexes section positions to ensure sequential ordering starting from 0
 * 
 * Performance: O(n log n) due to sorting, optimized with stable sort
 * 
 * @param sections - Array of sections with position property
 * @returns Array of sections with sequential positions (0, 1, 2, ...)
 * 
 * @example
 * const sections = [
 *   { id: 'a', position: 5, name: 'First' },
 *   { id: 'b', position: 2, name: 'Second' }
 * ];
 * const reindexed = reindexSectionPositions(sections);
 * // Result: [{ id: 'a', position: 0, ... }, { id: 'b', position: 1, ... }]
 */
export function reindexSectionPositions<T extends PositionedSection>(
  sections: T[]
): T[] {
  // Early return for empty arrays (Requirement 8.4)
  if (!sections || sections.length === 0) {
    return sections;
  }

  // Sort by current position, then by id for stability
  const sorted = [...sections].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return a.id.localeCompare(b.id);
  });

  // Assign sequential positions
  return sorted.map((section, index) => ({
    ...section,
    position: index,
  }));
}

/**
 * Reindexes item positions within a section to ensure sequential ordering starting from 0
 * 
 * @param items - Array of items with position property
 * @returns Array of items with sequential positions (0, 1, 2, ...)
 * 
 * @example
 * const items = [
 *   { id: 'x', position: 10, text: 'First' },
 *   { id: 'y', position: 3, text: 'Second' }
 * ];
 * const reindexed = reindexItemPositions(items);
 * // Result: [{ id: 'x', position: 0, ... }, { id: 'y', position: 1, ... }]
 */
export function reindexItemPositions<T extends PositionedItem>(
  items: T[]
): T[] {
  if (!items || items.length === 0) {
    return items;
  }

  // Sort by current position, then by id for stability
  const sorted = [...items].sort((a, b) => {
    if (a.position !== b.position) {
      return a.position - b.position;
    }
    return a.id.localeCompare(b.id);
  });

  // Assign sequential positions
  return sorted.map((item, index) => ({
    ...item,
    position: index,
  }));
}

/**
 * Validates positions in an array to check for duplicates or invalid values
 * 
 * @param items - Array of items with position property
 * @returns Validation result with errors and problematic positions
 * 
 * @example
 * const items = [
 *   { id: 'a', position: 0 },
 *   { id: 'b', position: 0 },  // duplicate
 *   { id: 'c', position: -1 }  // invalid
 * ];
 * const result = validatePositions(items);
 * // result.isValid === false
 * // result.duplicates === [0]
 * // result.invalid === [-1]
 */
export function validatePositions<T extends PositionedItem>(
  items: T[]
): PositionValidationResult {
  const result: PositionValidationResult = {
    isValid: true,
    errors: [],
    duplicates: [],
    invalid: [],
  };

  if (!items || items.length === 0) {
    return result;
  }

  const positionCounts = new Map<number, number>();
  const seenPositions = new Set<number>();

  // Check each position
  items.forEach((item) => {
    const pos = item.position;

    // Check for invalid positions (negative or non-integer)
    if (pos < 0 || !Number.isInteger(pos)) {
      result.invalid.push(pos);
      result.errors.push(`Invalid position: ${pos} (must be non-negative integer)`);
      result.isValid = false;
    }

    // Track position counts for duplicate detection
    positionCounts.set(pos, (positionCounts.get(pos) || 0) + 1);
  });

  // Find duplicates
  positionCounts.forEach((count, position) => {
    if (count > 1) {
      result.duplicates.push(position);
      result.errors.push(`Duplicate position: ${position} (used ${count} times)`);
      result.isValid = false;
    }
  });

  return result;
}

/**
 * Resolves position conflicts in concurrent edit scenarios
 * 
 * This function handles the case where multiple users edit the same recipe simultaneously.
 * It uses a last-write-wins strategy with automatic reindexing to maintain data integrity.
 * 
 * @param existingItems - Current items in the database
 * @param incomingItems - New items from the save request
 * @returns Merged and reindexed items with conflicts resolved
 * 
 * Strategy:
 * 1. Merge items by ID (incoming overwrites existing)
 * 2. Preserve items that exist in DB but not in incoming (other user's additions)
 * 3. Reindex all positions to ensure sequential order
 * 4. Sort by original position to maintain intended order
 * 
 * @example
 * const existing = [
 *   { id: 'a', position: 0, text: 'Old text' },
 *   { id: 'b', position: 1, text: 'Item B' }
 * ];
 * const incoming = [
 *   { id: 'a', position: 0, text: 'New text' },
 *   { id: 'c', position: 2, text: 'Item C' }
 * ];
 * const resolved = resolvePositionConflicts(existing, incoming);
 * // Result includes all items with updated positions
 */
export function resolvePositionConflicts<T extends PositionedItem>(
  existingItems: T[],
  incomingItems: T[]
): T[] {
  if (!incomingItems || incomingItems.length === 0) {
    return reindexItemPositions(existingItems || []);
  }

  if (!existingItems || existingItems.length === 0) {
    return reindexItemPositions(incomingItems);
  }

  // Create a map of incoming items by ID for quick lookup
  const incomingMap = new Map<string, T>();
  incomingItems.forEach((item) => {
    incomingMap.set(item.id, item);
  });

  // Create a map of existing items by ID
  const existingMap = new Map<string, T>();
  existingItems.forEach((item) => {
    existingMap.set(item.id, item);
  });

  // Merge: incoming items take precedence (last-write-wins)
  const mergedItems: T[] = [];

  // Add all incoming items (these are the user's intended changes)
  incomingItems.forEach((item) => {
    mergedItems.push(item);
  });

  // Add existing items that weren't in the incoming set
  // (these might be additions from other users)
  existingItems.forEach((item) => {
    if (!incomingMap.has(item.id)) {
      mergedItems.push(item);
    }
  });

  // Reindex to ensure sequential positions
  return reindexItemPositions(mergedItems);
}

/**
 * Resolves section-level position conflicts in concurrent edit scenarios
 * 
 * Similar to resolvePositionConflicts but operates on sections with nested items.
 * Resolves conflicts at both section and item levels.
 * 
 * @param existingSections - Current sections in the database
 * @param incomingSections - New sections from the save request
 * @returns Merged and reindexed sections with conflicts resolved
 */
export function resolveSectionConflicts<T extends PositionedSection>(
  existingSections: T[],
  incomingSections: T[]
): T[] {
  if (!incomingSections || incomingSections.length === 0) {
    return reindexSectionPositions(existingSections || []);
  }

  if (!existingSections || existingSections.length === 0) {
    // Reindex both sections and their items
    return reindexSectionPositions(
      incomingSections.map((section) => ({
        ...section,
        items: reindexItemPositions(section.items),
      }))
    );
  }

  // Create maps for quick lookup
  const incomingMap = new Map<string, T>();
  incomingSections.forEach((section) => {
    incomingMap.set(section.id, section);
  });

  const existingMap = new Map<string, T>();
  existingSections.forEach((section) => {
    existingMap.set(section.id, section);
  });

  // Merge sections
  const mergedSections: T[] = [];

  // Add all incoming sections with resolved item conflicts
  incomingSections.forEach((incomingSection) => {
    const existingSection = existingMap.get(incomingSection.id);

    if (existingSection) {
      // Section exists in both - resolve item conflicts
      mergedSections.push({
        ...incomingSection,
        items: resolvePositionConflicts(
          existingSection.items,
          incomingSection.items
        ),
      });
    } else {
      // New section - just reindex items
      mergedSections.push({
        ...incomingSection,
        items: reindexItemPositions(incomingSection.items),
      });
    }
  });

  // Add existing sections that weren't in the incoming set
  existingSections.forEach((existingSection) => {
    if (!incomingMap.has(existingSection.id)) {
      mergedSections.push({
        ...existingSection,
        items: reindexItemPositions(existingSection.items),
      });
    }
  });

  // Reindex section positions
  return reindexSectionPositions(mergedSections);
}

/**
 * Validates and auto-fixes positions for a complete recipe structure
 * 
 * This is a convenience function that validates and reindexes all positions
 * in a recipe's sections and items.
 * 
 * @param sections - Array of sections to validate and fix
 * @returns Object with validation results and fixed sections
 */
export function validateAndFixRecipePositions<T extends PositionedSection>(
  sections: T[]
): {
  isValid: boolean;
  errors: string[];
  fixedSections: T[];
} {
  if (!sections || sections.length === 0) {
    return {
      isValid: true,
      errors: [],
      fixedSections: sections || [],
    };
  }

  const allErrors: string[] = [];

  // Validate section positions
  const sectionValidation = validatePositions(sections);
  if (!sectionValidation.isValid) {
    allErrors.push(...sectionValidation.errors);
  }

  // Validate item positions within each section
  sections.forEach((section, index) => {
    const itemValidation = validatePositions(section.items);
    if (!itemValidation.isValid) {
      itemValidation.errors.forEach((error) => {
        allErrors.push(`Section ${index} (${section.id}): ${error}`);
      });
    }
  });

  // Fix all positions
  const fixedSections = reindexSectionPositions(
    sections.map((section) => ({
      ...section,
      items: reindexItemPositions(section.items),
    }))
  );

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    fixedSections,
  };
}

/**
 * Reorders items within a single section
 * 
 * Handles drag-and-drop reordering within a section by moving an item from
 * sourceIndex to destinationIndex and updating all affected positions.
 * 
 * @param items - Array of items in the section
 * @param sourceIndex - Original index of the item being moved
 * @param destinationIndex - Target index for the item
 * @returns Array of items with updated positions
 * 
 * @example
 * const items = [
 *   { id: 'a', position: 0, name: 'First' },
 *   { id: 'b', position: 1, name: 'Second' },
 *   { id: 'c', position: 2, name: 'Third' }
 * ];
 * const reordered = reorderWithinSection(items, 0, 2);
 * // Result: [{ id: 'b', position: 0 }, { id: 'c', position: 1 }, { id: 'a', position: 2 }]
 */
export function reorderWithinSection<T extends PositionedItem>(
  items: T[],
  sourceIndex: number,
  destinationIndex: number
): T[] {
  if (!items || items.length === 0) {
    return items;
  }

  // Validate indices
  if (
    sourceIndex < 0 ||
    sourceIndex >= items.length ||
    destinationIndex < 0 ||
    destinationIndex >= items.length
  ) {
    throw new Error(
      `Invalid indices: sourceIndex=${sourceIndex}, destinationIndex=${destinationIndex}, length=${items.length}`
    );
  }

  // If source and destination are the same, no change needed
  if (sourceIndex === destinationIndex) {
    return items;
  }

  // Create a copy of the array
  const result = Array.from(items);

  // Remove the item from source position
  const [movedItem] = result.splice(sourceIndex, 1);

  // Insert at destination position
  result.splice(destinationIndex, 0, movedItem);

  // Reindex all positions to be sequential
  return result.map((item, index) => ({
    ...item,
    position: index,
  }));
}

/**
 * Moves an item from one section to another
 * 
 * Handles cross-section drag-and-drop by removing an item from the source section
 * and adding it to the destination section at the specified index.
 * 
 * @param sourceItems - Array of items in the source section
 * @param destItems - Array of items in the destination section
 * @param sourceIndex - Index of the item in the source section
 * @param destinationIndex - Target index in the destination section
 * @returns Object with updated source and destination item arrays
 * 
 * @example
 * const source = [
 *   { id: 'a', position: 0, name: 'Item A' },
 *   { id: 'b', position: 1, name: 'Item B' }
 * ];
 * const dest = [
 *   { id: 'c', position: 0, name: 'Item C' }
 * ];
 * const result = moveBetweenSections(source, dest, 0, 1);
 * // result.sourceItems: [{ id: 'b', position: 0 }]
 * // result.destItems: [{ id: 'c', position: 0 }, { id: 'a', position: 1 }]
 */
export function moveBetweenSections<T extends PositionedItem>(
  sourceItems: T[],
  destItems: T[],
  sourceIndex: number,
  destinationIndex: number
): {
  sourceItems: T[];
  destItems: T[];
} {
  if (!sourceItems || sourceItems.length === 0) {
    throw new Error('Source items array is empty or undefined');
  }

  // Validate source index
  if (sourceIndex < 0 || sourceIndex >= sourceItems.length) {
    throw new Error(
      `Invalid source index: ${sourceIndex}, length=${sourceItems.length}`
    );
  }

  // Validate destination index
  const maxDestIndex = (destItems?.length || 0);
  if (destinationIndex < 0 || destinationIndex > maxDestIndex) {
    throw new Error(
      `Invalid destination index: ${destinationIndex}, max allowed=${maxDestIndex}`
    );
  }

  // Create copies of the arrays
  const sourceResult = Array.from(sourceItems);
  const destResult = Array.from(destItems || []);

  // Remove item from source
  const [movedItem] = sourceResult.splice(sourceIndex, 1);

  // Insert into destination
  destResult.splice(destinationIndex, 0, movedItem);

  // Reindex positions in both arrays
  return {
    sourceItems: sourceResult.map((item, index) => ({
      ...item,
      position: index,
    })),
    destItems: destResult.map((item, index) => ({
      ...item,
      position: index,
    })),
  };
}

/**
 * Normalizes positions to ensure sequential values starting from 0
 * 
 * This is an alias for reindexItemPositions for better semantic clarity
 * when used in the context of drag-and-drop operations.
 * 
 * @param items - Array of items with position property
 * @returns Array of items with sequential positions (0, 1, 2, ...)
 * 
 * @example
 * const items = [
 *   { id: 'a', position: 5, name: 'First' },
 *   { id: 'b', position: 10, name: 'Second' }
 * ];
 * const normalized = normalizePositions(items);
 * // Result: [{ id: 'a', position: 0 }, { id: 'b', position: 1 }]
 */
export function normalizePositions<T extends PositionedItem>(
  items: T[]
): T[] {
  return reindexItemPositions(items);
}

/**
 * Gets the next available position for a new item in a section
 * 
 * Calculates the position value that should be assigned to a new item
 * being added to a section. Returns 0 if the section is empty, otherwise
 * returns max position + 1.
 * 
 * @param items - Array of existing items in the section
 * @returns The position value for the new item
 * 
 * @example
 * const items = [
 *   { id: 'a', position: 0 },
 *   { id: 'b', position: 1 }
 * ];
 * const nextPos = getNextPosition(items);
 * // Result: 2
 * 
 * const emptyItems = [];
 * const firstPos = getNextPosition(emptyItems);
 * // Result: 0
 */
export function getNextPosition<T extends PositionedItem>(
  items: T[]
): number {
  if (!items || items.length === 0) {
    return 0;
  }

  const maxPosition = Math.max(...items.map((item) => item.position));
  return maxPosition + 1;
}
