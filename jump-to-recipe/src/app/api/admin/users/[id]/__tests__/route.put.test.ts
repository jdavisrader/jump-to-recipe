/**
 * Integration tests for PUT /api/admin/users/[id] endpoint
 * Tests user updates, validation, authorization, and error handling
 */

import { PUT } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import bcrypt from 'bcrypt';

// Mock dependencies
jest.mock('next-auth');
jest.mock('bcrypt');
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    query: {
      users: {
        findFirst: jest.fn(),
      },
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

describe('PUT /api/admin/users/[id]', () => {
  const validUserId = '123e4567-e89b-12d3-a456-426614174000';
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: any) => {
    return new NextRequest(`http://localhost:3000/api/admin/users/${validUserId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  describe('Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
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
      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
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
      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid user ID format');
    });

    it('should return 400 when request body is invalid JSON', async () => {
      mockRequest = new NextRequest(`http://localhost:3000/api/admin/users/${validUserId}`, {
        method: 'PUT',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body. Please provide valid JSON.');
    });

    it('should return 400 when name is missing', async () => {
      mockRequest = createMockRequest({
        email: 'john@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation failed');
    });

    it('should return 400 when name is empty', async () => {
      mockRequest = createMockRequest({
        name: '',
        email: 'john@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation failed');
    });

    it('should return 400 when email is invalid', async () => {
      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'invalid-email',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation failed');
      expect(data.details).toContain('Invalid email format');
    });

    it('should return 400 when role is invalid', async () => {
      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'invalid-role',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation failed');
    });

    it('should return 400 when password is too short', async () => {
      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
        password: 'short',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation failed');
      expect(data.details).toContain('Password must be at least 8 characters');
    });

    it('should accept valid roles', async () => {
      const validRoles = ['user', 'elevated', 'admin'];

      for (const role of validRoles) {
        (db.query.users.findFirst as jest.Mock)
          .mockResolvedValueOnce({
            id: validUserId,
            email: 'john@test.com',
          })
          .mockResolvedValueOnce(null);

        const mockUpdate = jest.fn().mockReturnThis();
        const mockSet = jest.fn().mockReturnThis();
        const mockWhere = jest.fn().mockResolvedValue(undefined);

        (db.update as jest.Mock).mockReturnValue({
          set: mockSet,
        });
        mockSet.mockReturnValue({
          where: mockWhere,
        });

        const mockSelect = jest.fn().mockReturnThis();
        const mockFrom = jest.fn().mockReturnThis();
        const mockLeftJoin = jest.fn().mockReturnThis();
        const mockWhereSelect = jest.fn().mockReturnThis();
        const mockGroupBy = jest.fn().mockResolvedValue([{
          id: validUserId,
          name: 'John Doe',
          email: 'john@test.com',
          role,
          recipeCount: 0,
          cookbookCount: 0,
        }]);

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
          where: mockWhereSelect,
        });
        mockWhereSelect.mockReturnValue({
          groupBy: mockGroupBy,
        });

        mockRequest = createMockRequest({
          name: 'John Doe',
          email: 'john@test.com',
          role,
        });

        const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
        expect(response.status).not.toBe(400);
      }
    });
  });

  describe('Successful updates', () => {
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

    it('should update user profile successfully', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          email: 'old@test.com',
        })
        .mockResolvedValueOnce(null);

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      (db.update as jest.Mock).mockReturnValue({
        set: mockSet,
      });
      mockSet.mockReturnValue({
        where: mockWhere,
      });

      const updatedUser = {
        id: validUserId,
        name: 'John Updated',
        email: 'john@test.com',
        emailVerified: null,
        password: 'hashed',
        image: null,
        role: 'user',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        recipeCount: 5,
        cookbookCount: 2,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhereSelect = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue([updatedUser]);

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
        where: mockWhereSelect,
      });
      mockWhereSelect.mockReturnValue({
        groupBy: mockGroupBy,
      });

      mockRequest = createMockRequest({
        name: 'John Updated',
        email: 'john@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.name).toBe('John Updated');
      expect(data.user.email).toBe('john@test.com');
    });

    it('should update user role successfully', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          email: 'john@test.com',
          role: 'user',
        })
        .mockResolvedValueOnce(null);

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      (db.update as jest.Mock).mockReturnValue({
        set: mockSet,
      });
      mockSet.mockReturnValue({
        where: mockWhere,
      });

      const updatedUser = {
        id: validUserId,
        name: 'John Doe',
        email: 'john@test.com',
        emailVerified: null,
        password: 'hashed',
        image: null,
        role: 'admin',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        recipeCount: 5,
        cookbookCount: 2,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhereSelect = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue([updatedUser]);

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
        where: mockWhereSelect,
      });
      mockWhereSelect.mockReturnValue({
        groupBy: mockGroupBy,
      });

      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'admin',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.role).toBe('admin');
    });

    it('should hash password when provided', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          email: 'john@test.com',
        })
        .mockResolvedValueOnce(null);

      mockBcryptHash.mockResolvedValue('hashed-password' as never);

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      (db.update as jest.Mock).mockReturnValue({
        set: mockSet,
      });
      mockSet.mockReturnValue({
        where: mockWhere,
      });

      const updatedUser = {
        id: validUserId,
        name: 'John Doe',
        email: 'john@test.com',
        emailVerified: null,
        password: 'hashed-password',
        image: null,
        role: 'user',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        recipeCount: 5,
        cookbookCount: 2,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhereSelect = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue([updatedUser]);

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
        where: mockWhereSelect,
      });
      mockWhereSelect.mockReturnValue({
        groupBy: mockGroupBy,
      });

      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
        password: 'newpassword123',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });

      expect(mockBcryptHash).toHaveBeenCalledWith('newpassword123', 10);
      expect(response.status).toBe(200);
    });

    it('should not update password when not provided', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          email: 'john@test.com',
        })
        .mockResolvedValueOnce(null);

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      (db.update as jest.Mock).mockReturnValue({
        set: mockSet,
      });
      mockSet.mockReturnValue({
        where: mockWhere,
      });

      const updatedUser = {
        id: validUserId,
        name: 'John Doe',
        email: 'john@test.com',
        emailVerified: null,
        password: 'old-hashed-password',
        image: null,
        role: 'user',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        recipeCount: 5,
        cookbookCount: 2,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhereSelect = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue([updatedUser]);

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
        where: mockWhereSelect,
      });
      mockWhereSelect.mockReturnValue({
        groupBy: mockGroupBy,
      });

      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
      });

      await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });

      expect(mockBcryptHash).not.toHaveBeenCalled();
    });
  });

  describe('Email uniqueness', () => {
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

    it('should return 400 when email is already in use by another user', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          email: 'old@test.com',
        })
        .mockResolvedValueOnce({
          id: 'other-user-id',
          email: 'taken@test.com',
        });

      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'taken@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email already in use');
    });

    it('should allow keeping the same email', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce({
        id: validUserId,
        email: 'john@test.com',
      });

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      (db.update as jest.Mock).mockReturnValue({
        set: mockSet,
      });
      mockSet.mockReturnValue({
        where: mockWhere,
      });

      const updatedUser = {
        id: validUserId,
        name: 'John Updated',
        email: 'john@test.com',
        emailVerified: null,
        password: 'hashed',
        image: null,
        role: 'user',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date(),
        recipeCount: 5,
        cookbookCount: 2,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockLeftJoin = jest.fn().mockReturnThis();
      const mockWhereSelect = jest.fn().mockReturnThis();
      const mockGroupBy = jest.fn().mockResolvedValue([updatedUser]);

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
        where: mockWhereSelect,
      });
      mockWhereSelect.mockReturnValue({
        groupBy: mockGroupBy,
      });

      mockRequest = createMockRequest({
        name: 'John Updated',
        email: 'john@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });

      expect(response.status).toBe(200);
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

    it('should return 404 when user does not exist', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce(null);

      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return 500 when password hashing fails', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          email: 'john@test.com',
        })
        .mockResolvedValueOnce(null);

      mockBcryptHash.mockRejectedValue(new Error('Hashing failed') as never);

      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
        password: 'newpassword123',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to process password. Please try again.');
    });

    it('should return 500 when database update fails', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          email: 'john@test.com',
        })
        .mockResolvedValueOnce(null);

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockRejectedValue(new Error('Database error'));

      (db.update as jest.Mock).mockReturnValue({
        set: mockSet,
      });
      mockSet.mockReturnValue({
        where: mockWhere,
      });

      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'john@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update user. Please try again later.');
    });

    it('should handle unique constraint errors', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          email: 'old@test.com',
        })
        .mockResolvedValueOnce(null);

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockRejectedValue(new Error('unique constraint violation'));

      (db.update as jest.Mock).mockReturnValue({
        set: mockSet,
      });
      mockSet.mockReturnValue({
        where: mockWhere,
      });

      mockRequest = createMockRequest({
        name: 'John Doe',
        email: 'taken@test.com',
        role: 'user',
      });

      const response = await PUT(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email address is already in use by another account.');
    });
  });
});
