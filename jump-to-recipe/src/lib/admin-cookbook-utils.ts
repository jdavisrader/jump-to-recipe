import type { CookbookWithMetadata } from '@/types/admin';

export type CookbookSortKey =
  | 'title'
  | 'ownerName'
  | 'collaboratorCount'
  | 'recipeCount'
  | 'createdAt'
  | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface CookbookSortConfig {
  key: CookbookSortKey;
  direction: SortDirection;
}

/**
 * Filter cookbooks by search term (title)
 */
export function filterCookbooksBySearch(
  cookbooks: CookbookWithMetadata[],
  searchTerm: string
): CookbookWithMetadata[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return cookbooks;
  }

  const searchLower = searchTerm.toLowerCase().trim();
  return cookbooks.filter((cookbook) =>
    cookbook.title.toLowerCase().includes(searchLower)
  );
}

/**
 * Filter cookbooks by owner
 */
export function filterCookbooksByOwner(
  cookbooks: CookbookWithMetadata[],
  ownerId: string
): CookbookWithMetadata[] {
  if (ownerId === 'all' || !ownerId) {
    return cookbooks;
  }

  return cookbooks.filter((cookbook) => cookbook.owner.id === ownerId);
}

/**
 * Sort cookbooks by specified key and direction
 */
export function sortCookbooks(
  cookbooks: CookbookWithMetadata[],
  sortConfig: CookbookSortConfig
): CookbookWithMetadata[] {
  const { key, direction } = sortConfig;

  return [...cookbooks].sort((a, b) => {
    let aValue: string | number | Date;
    let bValue: string | number | Date;

    // Map sort keys to actual values
    switch (key) {
      case 'title':
        aValue = a.title;
        bValue = b.title;
        break;
      case 'ownerName':
        aValue = a.owner.name || '';
        bValue = b.owner.name || '';
        break;
      case 'collaboratorCount':
        aValue = a.collaboratorCount;
        bValue = b.collaboratorCount;
        break;
      case 'recipeCount':
        aValue = a.recipeCount;
        bValue = b.recipeCount;
        break;
      case 'createdAt':
      case 'updatedAt':
        aValue = new Date(a[key]).getTime();
        bValue = new Date(b[key]).getTime();
        break;
      default:
        return 0;
    }

    // Handle string comparisons (case-insensitive)
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * Apply all filters and sorting to cookbooks
 */
export function filterAndSortCookbooks(
  cookbooks: CookbookWithMetadata[],
  searchTerm: string,
  ownerFilter: string,
  sortConfig: CookbookSortConfig
): CookbookWithMetadata[] {
  let filtered = cookbooks;

  // Apply search filter
  filtered = filterCookbooksBySearch(filtered, searchTerm);

  // Apply owner filter
  filtered = filterCookbooksByOwner(filtered, ownerFilter);

  // Apply sorting
  filtered = sortCookbooks(filtered, sortConfig);

  return filtered;
}

/**
 * Get unique owners from cookbooks for filter dropdown
 */
export function getUniqueOwners(cookbooks: CookbookWithMetadata[]) {
  const ownersMap = new Map();
  
  cookbooks.forEach((cookbook) => {
    if (cookbook.owner.id && !ownersMap.has(cookbook.owner.id)) {
      ownersMap.set(cookbook.owner.id, {
        id: cookbook.owner.id,
        name: cookbook.owner.name || 'Unknown',
        email: cookbook.owner.email,
      });
    }
  });

  return Array.from(ownersMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
}