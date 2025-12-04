import type { UserWithCounts } from '@/types/admin';

export type SortKey =
  | 'name'
  | 'email'
  | 'role'
  | 'recipeCount'
  | 'cookbookCount'
  | 'createdAt'
  | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

/**
 * Filter users by search term (name or email)
 */
export function filterUsersBySearch(
  users: UserWithCounts[],
  searchTerm: string
): UserWithCounts[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return users;
  }

  const searchLower = searchTerm.toLowerCase().trim();
  return users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
  );
}

/**
 * Filter users by role
 */
export function filterUsersByRole(
  users: UserWithCounts[],
  role: string
): UserWithCounts[] {
  if (role === 'all' || !role) {
    return users;
  }

  return users.filter((user) => user.role === role);
}

/**
 * Sort users by specified key and direction
 */
export function sortUsers(
  users: UserWithCounts[],
  sortConfig: SortConfig
): UserWithCounts[] {
  const { key, direction } = sortConfig;

  return [...users].sort((a, b) => {
    let aValue: string | number | Date = a[key];
    let bValue: string | number | Date = b[key];

    // Handle date comparisons
    if (key === 'createdAt' || key === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
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
 * Apply all filters and sorting to users
 */
export function filterAndSortUsers(
  users: UserWithCounts[],
  searchTerm: string,
  roleFilter: string,
  sortConfig: SortConfig
): UserWithCounts[] {
  let filtered = users;

  // Apply search filter
  filtered = filterUsersBySearch(filtered, searchTerm);

  // Apply role filter
  filtered = filterUsersByRole(filtered, roleFilter);

  // Apply sorting
  filtered = sortUsers(filtered, sortConfig);

  return filtered;
}
