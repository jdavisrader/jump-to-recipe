/**
 * Integration tests for GET /api/admin/users/transfer-candidates endpoint
 * Tests fetching transfer candidates with exclusion logic and authorization
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

describe('GET /api/admin/users/transfer-candidates', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockRequest = new NextRequest('http://localhost:3000/api/admin/users/transfer-candidates');

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
      mockRequest = new NextRequest('http://localhost:3000/api/admin/users/transfer-candidates');

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
      mockRequest = new NextRequest('http://localhost:3000/api/admin/users/transfer-candidates');

      const response = await GET(mockRequest);
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

    it('should return 400 when excludeUserId is not a valid UUID', async () => {
      mockRequest = new NextRequest(
        'http://localhost:3000/api/admin/users/transfer-candidates?excludeUserId=invalid-id'
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid user ID format');
    });

    it('should accept valid UUID for excludeUserId', async () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest = new NextRequest(
        `http://localhost:3000/api/admin/users/transfer-candidates?excludeUserId=${validUUID}`
      );

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockResolvedValue([]);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);

      expect(response.status).not.toBe(400);
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

    it('should return all users when no excludeUserId is provided', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/admin/users/transfer-candidates');

      const mockUsers = [
        {
          id: 'user-1',
          name: 'Alice Johnson',
          email: 'alice@test.com',
        },
        {
          id: 'user-2',
          name: 'Bob Smith',
          email: 'bob@test.com',
        },
        {
          id: 'user-3',
          name: 'Charlie Brown',
          email: 'charlie@test.com',
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockResolvedValue(mockUsers);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(3);
      expect(data.users).toEqual(mockUsers);
    });

    it('should exclude specified user when excludeUserId is provided', async () => {
      const excludeUserId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest = new NextRequest(
        `http://localhost:3000/api/admin/users/transfer-candidates?excludeUserId=${excludeUserId}`
      );

      const mockUsers = [
        {
          id: 'user-2',
          name: 'Bob Smith',
          email: 'bob@test.com',
        },
        {
          id: 'user-3',
          name: 'Charlie Brown',
          email: 'charlie@test.com',
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockResolvedValue(mockUsers);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.users.every((u: any) => u.id !== excludeUserId)).toBe(true);
    });

    it('should return users sorted by name', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/admin/users/transfer-candidates');

      const mockUsers = [
        {
          id: 'user-1',
          name: 'Alice Johnson',
          email: 'alice@test.com',
        },
        {
          id: 'user-2',
          name: 'Bob Smith',
          email: 'bob@test.com',
        },
        {
          id: 'user-3',
          name: 'Charlie Brown',
          email: 'charlie@test.com',
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockResolvedValue(mockUsers);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users[0].name).toBe('Alice Johnson');
      expect(data.users[1].name).toBe('Bob Smith');
      expect(data.users[2].name).toBe('Charlie Brown');
    });

    it('should return empty array when no users exist', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/admin/users/transfer-candidates');

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockResolvedValue([]);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toEqual([]);
    });

    it('should return empty array when only excluded user exists', async () => {
      const excludeUserId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest = new NextRequest(
        `http://localhost:3000/api/admin/users/transfer-candidates?excludeUserId=${excludeUserId}`
      );

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockResolvedValue([]);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toEqual([]);
    });

    it('should only return id, name, and email fields', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/admin/users/transfer-candidates');

      const mockUsers = [
        {
          id: 'user-1',
          name: 'Alice Johnson',
          email: 'alice@test.com',
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockResolvedValue(mockUsers);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users[0]).toHaveProperty('id');
      expect(data.users[0]).toHaveProperty('name');
      expect(data.users[0]).toHaveProperty('email');
      expect(data.users[0]).not.toHaveProperty('password');
      expect(data.users[0]).not.toHaveProperty('role');
      expect(data.users[0]).not.toHaveProperty('createdAt');
    });

    it('should handle multiple query parameters correctly', async () => {
      const excludeUserId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest = new NextRequest(
        `http://localhost:3000/api/admin/users/transfer-candidates?excludeUserId=${excludeUserId}&other=param`
      );

      const mockUsers = [
        {
          id: 'user-2',
          name: 'Bob Smith',
          email: 'bob@test.com',
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockResolvedValue(mockUsers);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(1);
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
      mockRequest = new NextRequest('http://localhost:3000/api/admin/users/transfer-candidates');

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch available users. Please try again later.');
      expect(data.details).toBe('Database connection failed');
    });

    it('should return 500 when database query fails with excludeUserId', async () => {
      const excludeUserId = '123e4567-e89b-12d3-a456-426614174000';
      mockRequest = new NextRequest(
        `http://localhost:3000/api/admin/users/transfer-candidates?excludeUserId=${excludeUserId}`
      );

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockRejectedValue(new Error('Database error'));

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });
      mockWhere.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch available users. Please try again later.');
      expect(data.details).toBe('Database error');
    });

    it('should handle unknown errors gracefully', async () => {
      mockRequest = new NextRequest('http://localhost:3000/api/admin/users/transfer-candidates');

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockOrderBy = jest.fn().mockRejectedValue('Unknown error');

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        orderBy: mockOrderBy,
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch available users. Please try again later.');
      expect(data.details).toBe('Unknown error occurred');
    });
  });
});
