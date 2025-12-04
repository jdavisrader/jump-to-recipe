import { describe, it, expect } from '@jest/globals';
import {
  filterUsersBySearch,
  filterUsersByRole,
  sortUsers,
  filterAndSortUsers,
  type SortConfig,
} from '../admin-user-utils';
import type { UserWithCounts } from '@/types/admin';

// Mock user data for testing
const mockUsers: UserWithCounts[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    emailVerified: null,
    password: 'hashed',
    image: null,
    role: 'admin',
    recipeCount: 10,
    cookbookCount: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob@test.com',
    emailVerified: null,
    password: 'hashed',
    image: null,
    role: 'user',
    recipeCount: 5,
    cookbookCount: 1,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    emailVerified: null,
    password: 'hashed',
    image: null,
    role: 'elevated',
    recipeCount: 15,
    cookbookCount: 5,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-01'),
  },
  {
    id: '4',
    name: 'Diana Prince',
    email: 'diana@test.com',
    emailVerified: null,
    password: 'hashed',
    image: null,
    role: 'user',
    recipeCount: 8,
    cookbookCount: 2,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
  },
];

describe('Admin User Utils', () => {
  describe('filterUsersBySearch', () => {
    it('should return all users when search term is empty', () => {
      const result = filterUsersBySearch(mockUsers, '');
      expect(result).toEqual(mockUsers);
    });

    it('should return all users when search term is whitespace', () => {
      const result = filterUsersBySearch(mockUsers, '   ');
      expect(result).toEqual(mockUsers);
    });

    it('should filter users by name (case-insensitive)', () => {
      const result = filterUsersBySearch(mockUsers, 'alice');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Johnson');
    });

    it('should filter users by name with uppercase search', () => {
      const result = filterUsersBySearch(mockUsers, 'ALICE');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Johnson');
    });

    it('should filter users by partial name match', () => {
      const result = filterUsersBySearch(mockUsers, 'bro');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Charlie Brown');
    });

    it('should filter users by email', () => {
      const result = filterUsersBySearch(mockUsers, 'bob@test.com');
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('bob@test.com');
    });

    it('should filter users by partial email match', () => {
      const result = filterUsersBySearch(mockUsers, 'example.com');
      expect(result).toHaveLength(2);
      expect(result.map((u) => u.email)).toContain('alice@example.com');
      expect(result.map((u) => u.email)).toContain('charlie@example.com');
    });

    it('should filter users by email domain', () => {
      const result = filterUsersBySearch(mockUsers, 'test.com');
      expect(result).toHaveLength(2);
      expect(result.map((u) => u.email)).toContain('bob@test.com');
      expect(result.map((u) => u.email)).toContain('diana@test.com');
    });

    it('should return empty array when no matches found', () => {
      const result = filterUsersBySearch(mockUsers, 'nonexistent');
      expect(result).toHaveLength(0);
    });

    it('should handle special characters in search term', () => {
      const usersWithSpecialChars: UserWithCounts[] = [
        {
          ...mockUsers[0],
          name: "O'Brien",
          email: 'obrien+test@example.com',
        },
      ];
      const result = filterUsersBySearch(usersWithSpecialChars, "o'brien");
      expect(result).toHaveLength(1);
    });

    it('should trim whitespace from search term', () => {
      const result = filterUsersBySearch(mockUsers, '  alice  ');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Johnson');
    });

    it('should match users by first name only', () => {
      const result = filterUsersBySearch(mockUsers, 'diana');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Diana Prince');
    });

    it('should match users by last name only', () => {
      const result = filterUsersBySearch(mockUsers, 'smith');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Bob Smith');
    });
  });

  describe('filterUsersByRole', () => {
    it('should return all users when role is "all"', () => {
      const result = filterUsersByRole(mockUsers, 'all');
      expect(result).toEqual(mockUsers);
    });

    it('should return all users when role is empty string', () => {
      const result = filterUsersByRole(mockUsers, '');
      expect(result).toEqual(mockUsers);
    });

    it('should filter users by admin role', () => {
      const result = filterUsersByRole(mockUsers, 'admin');
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('admin');
    });

    it('should filter users by user role', () => {
      const result = filterUsersByRole(mockUsers, 'user');
      expect(result).toHaveLength(2);
      expect(result.every((u) => u.role === 'user')).toBe(true);
    });

    it('should filter users by elevated role', () => {
      const result = filterUsersByRole(mockUsers, 'elevated');
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('elevated');
    });

    it('should return empty array when no users have the specified role', () => {
      const result = filterUsersByRole(mockUsers, 'nonexistent');
      expect(result).toHaveLength(0);
    });
  });

  describe('sortUsers', () => {
    describe('sorting by name', () => {
      it('should sort users by name in ascending order', () => {
        const sortConfig: SortConfig = { key: 'name', direction: 'asc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].name).toBe('Alice Johnson');
        expect(result[1].name).toBe('Bob Smith');
        expect(result[2].name).toBe('Charlie Brown');
        expect(result[3].name).toBe('Diana Prince');
      });

      it('should sort users by name in descending order', () => {
        const sortConfig: SortConfig = { key: 'name', direction: 'desc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].name).toBe('Diana Prince');
        expect(result[1].name).toBe('Charlie Brown');
        expect(result[2].name).toBe('Bob Smith');
        expect(result[3].name).toBe('Alice Johnson');
      });

      it('should sort names case-insensitively', () => {
        const usersWithMixedCase: UserWithCounts[] = [
          { ...mockUsers[0], name: 'alice' },
          { ...mockUsers[1], name: 'ALICE' },
          { ...mockUsers[2], name: 'Alice' },
        ];
        const sortConfig: SortConfig = { key: 'name', direction: 'asc' };
        const result = sortUsers(usersWithMixedCase, sortConfig);
        // All should be treated equally, order should be stable
        expect(result).toHaveLength(3);
      });
    });

    describe('sorting by email', () => {
      it('should sort users by email in ascending order', () => {
        const sortConfig: SortConfig = { key: 'email', direction: 'asc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].email).toBe('alice@example.com');
        expect(result[1].email).toBe('bob@test.com');
        expect(result[2].email).toBe('charlie@example.com');
        expect(result[3].email).toBe('diana@test.com');
      });

      it('should sort users by email in descending order', () => {
        const sortConfig: SortConfig = { key: 'email', direction: 'desc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].email).toBe('diana@test.com');
        expect(result[3].email).toBe('alice@example.com');
      });
    });

    describe('sorting by role', () => {
      it('should sort users by role in ascending order', () => {
        const sortConfig: SortConfig = { key: 'role', direction: 'asc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].role).toBe('admin');
        expect(result[1].role).toBe('elevated');
        expect(result[2].role).toBe('user');
        expect(result[3].role).toBe('user');
      });

      it('should sort users by role in descending order', () => {
        const sortConfig: SortConfig = { key: 'role', direction: 'desc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].role).toBe('user');
        expect(result[1].role).toBe('user');
        expect(result[2].role).toBe('elevated');
        expect(result[3].role).toBe('admin');
      });
    });

    describe('sorting by recipeCount', () => {
      it('should sort users by recipe count in ascending order', () => {
        const sortConfig: SortConfig = { key: 'recipeCount', direction: 'asc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].recipeCount).toBe(5);
        expect(result[1].recipeCount).toBe(8);
        expect(result[2].recipeCount).toBe(10);
        expect(result[3].recipeCount).toBe(15);
      });

      it('should sort users by recipe count in descending order', () => {
        const sortConfig: SortConfig = { key: 'recipeCount', direction: 'desc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].recipeCount).toBe(15);
        expect(result[1].recipeCount).toBe(10);
        expect(result[2].recipeCount).toBe(8);
        expect(result[3].recipeCount).toBe(5);
      });
    });

    describe('sorting by cookbookCount', () => {
      it('should sort users by cookbook count in ascending order', () => {
        const sortConfig: SortConfig = { key: 'cookbookCount', direction: 'asc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].cookbookCount).toBe(1);
        expect(result[1].cookbookCount).toBe(2);
        expect(result[2].cookbookCount).toBe(3);
        expect(result[3].cookbookCount).toBe(5);
      });

      it('should sort users by cookbook count in descending order', () => {
        const sortConfig: SortConfig = {
          key: 'cookbookCount',
          direction: 'desc',
        };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].cookbookCount).toBe(5);
        expect(result[3].cookbookCount).toBe(1);
      });
    });

    describe('sorting by dates', () => {
      it('should sort users by createdAt in ascending order', () => {
        const sortConfig: SortConfig = { key: 'createdAt', direction: 'asc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].name).toBe('Alice Johnson'); // 2024-01-01
        expect(result[1].name).toBe('Charlie Brown'); // 2024-01-15
        expect(result[2].name).toBe('Bob Smith'); // 2024-02-01
        expect(result[3].name).toBe('Diana Prince'); // 2024-03-01
      });

      it('should sort users by createdAt in descending order', () => {
        const sortConfig: SortConfig = { key: 'createdAt', direction: 'desc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].name).toBe('Diana Prince'); // 2024-03-01
        expect(result[3].name).toBe('Alice Johnson'); // 2024-01-01
      });

      it('should sort users by updatedAt in ascending order', () => {
        const sortConfig: SortConfig = { key: 'updatedAt', direction: 'asc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].name).toBe('Alice Johnson'); // 2024-01-15
        expect(result[1].name).toBe('Bob Smith'); // 2024-02-10
        expect(result[2].name).toBe('Charlie Brown'); // 2024-03-01
        expect(result[3].name).toBe('Diana Prince'); // 2024-03-05
      });

      it('should sort users by updatedAt in descending order', () => {
        const sortConfig: SortConfig = { key: 'updatedAt', direction: 'desc' };
        const result = sortUsers(mockUsers, sortConfig);
        expect(result[0].name).toBe('Diana Prince'); // 2024-03-05
        expect(result[3].name).toBe('Alice Johnson'); // 2024-01-15
      });
    });

    it('should not mutate the original array', () => {
      const originalUsers = [...mockUsers];
      const sortConfig: SortConfig = { key: 'name', direction: 'desc' };
      sortUsers(mockUsers, sortConfig);
      expect(mockUsers).toEqual(originalUsers);
    });

    it('should handle empty array', () => {
      const sortConfig: SortConfig = { key: 'name', direction: 'asc' };
      const result = sortUsers([], sortConfig);
      expect(result).toEqual([]);
    });

    it('should handle single user', () => {
      const singleUser = [mockUsers[0]];
      const sortConfig: SortConfig = { key: 'name', direction: 'asc' };
      const result = sortUsers(singleUser, sortConfig);
      expect(result).toEqual(singleUser);
    });
  });

  describe('filterAndSortUsers', () => {
    it('should apply search, role filter, and sort together', () => {
      const sortConfig: SortConfig = { key: 'name', direction: 'asc' };
      const result = filterAndSortUsers(mockUsers, 'test.com', 'user', sortConfig);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Bob Smith');
      expect(result[1].name).toBe('Diana Prince');
    });

    it('should apply only search when other filters are default', () => {
      const sortConfig: SortConfig = { key: 'name', direction: 'asc' };
      const result = filterAndSortUsers(mockUsers, 'alice', 'all', sortConfig);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice Johnson');
    });

    it('should apply only role filter when search is empty', () => {
      const sortConfig: SortConfig = { key: 'name', direction: 'asc' };
      const result = filterAndSortUsers(mockUsers, '', 'admin', sortConfig);
      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('admin');
    });

    it('should apply only sort when no filters are active', () => {
      const sortConfig: SortConfig = { key: 'recipeCount', direction: 'desc' };
      const result = filterAndSortUsers(mockUsers, '', 'all', sortConfig);
      expect(result).toHaveLength(4);
      expect(result[0].recipeCount).toBe(15);
      expect(result[3].recipeCount).toBe(5);
    });

    it('should return empty array when filters match nothing', () => {
      const sortConfig: SortConfig = { key: 'name', direction: 'asc' };
      const result = filterAndSortUsers(
        mockUsers,
        'nonexistent',
        'admin',
        sortConfig
      );
      expect(result).toHaveLength(0);
    });

    it('should handle complex filtering and sorting', () => {
      const sortConfig: SortConfig = { key: 'recipeCount', direction: 'desc' };
      const result = filterAndSortUsers(mockUsers, 'example', 'all', sortConfig);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Charlie Brown'); // 15 recipes
      expect(result[1].name).toBe('Alice Johnson'); // 10 recipes
    });
  });
});
