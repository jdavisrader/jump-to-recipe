/**
 * Integration tests for GET /api/admin/users endpoint
 * Tests successful fetch, authorization, and error handling
 */

import { NextRequest } from 'next/server';

// Mock dependencies before imports
jest.mock('next-auth');
jest.mock('@/db');
jest.mock('@/db/schema/users');
jest.mock('@/db/schema/recipes');
jest.mock('@/db/schema/cookbooks');

import { GET } from '../route';
import { getServerSession } from 'next-auth';
import { db } from '@/db';

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('GET /api/admin/users', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new NextRequest('http://localhost:3000/api/admin/users');
  });

  describe('Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized: Authentication required');
    });

    it('should return 403 when user is not an admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-1',
          name: 'Regular User',
          email: 'user@test.com',
          role: 'user',
        },
        expires: '2024-12-31',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden: Admin role required');
    });

    it('should return 403 when user has elevated role', async () => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'user-1',
          name: 'Elevated User',
          email: 'elevated@test.com',
          role: 'elevated',
        },
        expires: '2024-12-31',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden: Admin role required');
    });
  });

  describe('Successful fetch', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
          role: 'admin',
        },
        expires: '2024-12-31',
      });
    });

    it('should return users with counts when admin is authenticated', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@test.com',
          emailVerified: null,
          password: 'hashed',
          image: null,
          role: 'user',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15'),
          recipeCount: 5,
          cookbookCount: 2,
        },
        {
          id: 'user-2',
          name: 'Jane Smith',
          email: 'jane@test.com',
          emailVerified: null,
          password: 'hashed',
          image: null,
          role: 'admin',
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-10'),
          recipeCount: 10,
          cookbookCount: 3,
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue(mockUsers);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        leftJoin: mockLeftJoin,
      });
      mockLeftJoin.mockReturnValue({
        leftJoin: mockLeftJoin,
      });
      mockLeftJoin.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.users[0]).toMatchObject({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
        recipeCount: 5,
        cookbookCount: 2,
      });
      expect(data.users[1]).toMatchObject({
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@test.com',
        role: 'admin',
        recipeCount: 10,
        cookbookCount: 3,
      });
    });

    it('should return empty array when no users exist', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue([]);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        leftJoin: mockLeftJoin,
      });
      mockLeftJoin.mockReturnValue({
        leftJoin: mockLeftJoin,
      });
      mockLeftJoin.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toEqual([]);
    });

    it('should return users with zero counts when they have no recipes or cookbooks', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          name: 'New User',
          email: 'new@test.com',
          emailVerified: null,
          password: 'hashed',
          image: null,
          role: 'user',
          createdAt: new Date('2024-03-01'),
          updatedAt: new Date('2024-03-01'),
          recipeCount: 0,
          cookbookCount: 0,
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue(mockUsers);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        leftJoin: mockLeftJoin,
      });
      mockLeftJoin.mockReturnValue({
        leftJoin: mockLeftJoin,
      });
      mockLeftJoin.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(1);
      expect(data.users[0].recipeCount).toBe(0);
      expect(data.users[0].cookbookCount).toBe(0);
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
          role: 'admin',
        },
        expires: '2024-12-31',
      });
    });

    it('should return 500 when database query fails', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        leftJoin: mockLeftJoin,
      });
      mockLeftJoin.mockReturnValue({
        leftJoin: mockLeftJoin,
      });
      mockLeftJoin.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch users. Please try again later.');
      expect(data.details).toBe('Database connection failed');
    });

    it('should handle unknown errors gracefully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockRejectedValue('Unknown error');

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        leftJoin: mockLeftJoin,
      });
      mockLeftJoin.mockReturnValue({
        leftJoin: mockLeftJoin,
      });
      mockLeftJoin.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch users. Please try again later.');
      expect(data.details).toBe('Unknown error occurred');
    });
  });
});
