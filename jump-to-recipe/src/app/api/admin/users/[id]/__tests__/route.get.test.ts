/**
 * Integration tests for GET /api/admin/users/[id] endpoint
 * Tests successful fetch, authorization, validation, and error handling
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('GET /api/admin/users/[id]', () => {
  let mockRequest: NextRequest;
  const validUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = new NextRequest(`http://localhost:3000/api/admin/users/${validUserId}`);
  });

  describe('Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET(mockRequest, { params: Promise.resolve({ id: validUserId }) });
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

      const response = await GET(mockRequest, { params: Promise.resolve({ id: validUserId }) });
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

      const response = await GET(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Forbidden: Admin role required');
    });
  });

  describe('Validation', () => {
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

    it('should return 400 when user ID is not a valid UUID', async () => {
      const invalidIds = ['invalid-id', '123', 'not-a-uuid', ''];

      for (const invalidId of invalidIds) {
        const response = await GET(mockRequest, { params: Promise.resolve({ id: invalidId }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Invalid user ID format');
      }
    });

    it('should accept valid UUID formats', async () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        '00000000-0000-0000-0000-000000000000',
      ];

      for (const uuid of validUUIDs) {
        const mockSelect = jest.fn().mockReturnThis();
        const mockFrom = jest.fn().mockReturnThis();
        const mockLeftJoin = jest.fn().mockReturnThis();
        const mockWhere = jest.fn().mockReturnThis();
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
          where: mockWhere,
        });
        mockWhere.mockReturnValue({
          groupBy: mockGroupBy,
        });

        const response = await GET(mockRequest, { params: Promise.resolve({ id: uuid }) });
        
        // Should not return 400 for valid UUIDs
        expect(response.status).not.toBe(400);
      }
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

    it('should return user details with counts when user exists', async () => {
      const mockUser = {
        id: validUserId,
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
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue([mockUser]);

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
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toMatchObject({
        id: validUserId,
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
        recipeCount: 5,
        cookbookCount: 2,
      });
    });

    it('should return user with zero counts when they have no content', async () => {
      const mockUser = {
        id: validUserId,
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
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue([mockUser]);

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
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.recipeCount).toBe(0);
      expect(data.user.cookbookCount).toBe(0);
    });

    it('should return admin user details correctly', async () => {
      const mockUser = {
        id: validUserId,
        name: 'Admin User',
        email: 'admin@test.com',
        emailVerified: new Date('2024-01-01'),
        password: 'hashed',
        image: 'https://example.com/avatar.jpg',
        role: 'admin',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        recipeCount: 10,
        cookbookCount: 5,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue([mockUser]);

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
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.role).toBe('admin');
      expect(data.user.image).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('Not found', () => {
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

    it('should return 404 when user does not exist', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
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
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return 404 when query returns null', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue(null);

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
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
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
      const mockWhere = jest.fn().mockReturnThis();
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
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch user details. Please try again later.');
      expect(data.details).toBe('Database connection failed');
    });

    it('should handle unknown errors gracefully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
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
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        groupBy: mockGroupBy,
      });

      const response = await GET(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch user details. Please try again later.');
      expect(data.details).toBe('Unknown error occurred');
    });
  });
});
