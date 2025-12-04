/**
 * Integration tests for DELETE /api/admin/users/[id] endpoint
 * Tests user deletion with ownership transfer, transaction rollback, and error handling
 */

import { DELETE } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
    query: {
      users: {
        findFirst: jest.fn(),
      },
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('DELETE /api/admin/users/[id]', () => {
  const validUserId = '123e4567-e89b-12d3-a456-426614174000';
  const newOwnerId = '987e6543-e21b-12d3-a456-426614174999';
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: any) => {
    return new NextRequest(`http://localhost:3000/api/admin/users/${validUserId}`, {
      method: 'DELETE',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  describe('Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);
      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
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
      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
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
      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: 'invalid-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid user ID format');
    });

    it('should return 400 when request body is invalid JSON', async () => {
      mockRequest = new NextRequest(`http://localhost:3000/api/admin/users/${validUserId}`, {
        method: 'DELETE',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request body. Please provide valid JSON.');
    });

    it('should return 400 when newOwnerId is missing', async () => {
      mockRequest = createMockRequest({});

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation failed');
    });

    it('should return 400 when newOwnerId is not a valid UUID', async () => {
      mockRequest = createMockRequest({ newOwnerId: 'invalid-uuid' });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Validation failed');
      expect(data.details).toContain('Invalid user ID');
    });

    it('should return 400 when newOwnerId is the same as user being deleted', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce({
        id: validUserId,
        name: 'User to Delete',
        email: 'delete@test.com',
        role: 'user',
      });

      mockRequest = createMockRequest({ newOwnerId: validUserId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot transfer ownership to the user being deleted');
    });
  });

  describe('User existence checks', () => {
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

    it('should return 404 when user to delete does not exist', async () => {
      (db.query.users.findFirst as jest.Mock).mockResolvedValueOnce(null);

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return 404 when new owner does not exist', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          name: 'User to Delete',
          email: 'delete@test.com',
          role: 'user',
        })
        .mockResolvedValueOnce(null);

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('New owner not found');
    });
  });

  describe('Last admin protection', () => {
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

    it('should return 400 when trying to delete the last admin', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          name: 'Last Admin',
          email: 'admin@test.com',
          role: 'admin',
        })
        .mockResolvedValueOnce({
          id: newOwnerId,
          name: 'New Owner',
          email: 'owner@test.com',
          role: 'user',
        });

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([{ count: 1 }]);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot delete the last admin user');
    });

    it('should allow deleting an admin when there are multiple admins', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          name: 'Admin to Delete',
          email: 'admin@test.com',
          role: 'admin',
        })
        .mockResolvedValueOnce({
          id: newOwnerId,
          name: 'New Owner',
          email: 'owner@test.com',
          role: 'user',
        });

      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([{ count: 2 }]);

      (db.select as jest.Mock).mockReturnValue({
        from: mockFrom,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(undefined),
        };
        mockTx.update.mockReturnValue({
          set: mockTx.set,
        });
        mockTx.set.mockReturnValue({
          where: mockTx.where,
        });
        mockTx.delete.mockReturnValue({
          where: mockTx.where,
        });
        return callback(mockTx);
      });

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });

      expect(response.status).toBe(200);
    });
  });

  describe('Successful deletion with ownership transfer', () => {
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

      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          name: 'User to Delete',
          email: 'delete@test.com',
          role: 'user',
        })
        .mockResolvedValueOnce({
          id: newOwnerId,
          name: 'New Owner',
          email: 'owner@test.com',
          role: 'user',
        });
    });

    it('should successfully delete user and transfer ownership', async () => {
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(undefined),
        };
        mockTx.update.mockReturnValue({
          set: mockTx.set,
        });
        mockTx.set.mockReturnValue({
          where: mockTx.where,
        });
        mockTx.delete.mockReturnValue({
          where: mockTx.where,
        });
        return callback(mockTx);
      });

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('User to Delete');
      expect(data.message).toContain('New Owner');
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should transfer recipes to new owner', async () => {
      const mockTx = {
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };
      mockTx.update.mockReturnValue({
        set: mockTx.set,
      });
      mockTx.set.mockReturnValue({
        where: mockTx.where,
      });
      mockTx.delete.mockReturnValue({
        where: mockTx.where,
      });

      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      mockRequest = createMockRequest({ newOwnerId });

      await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });

      // Verify recipes were transferred (first update call)
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({
          authorId: newOwnerId,
        })
      );
    });

    it('should transfer cookbooks to new owner', async () => {
      const mockTx = {
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };
      mockTx.update.mockReturnValue({
        set: mockTx.set,
      });
      mockTx.set.mockReturnValue({
        where: mockTx.where,
      });
      mockTx.delete.mockReturnValue({
        where: mockTx.where,
      });

      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      mockRequest = createMockRequest({ newOwnerId });

      await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });

      // Verify cookbooks were transferred (second update call)
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: newOwnerId,
        })
      );
    });

    it('should remove user from collaborator lists', async () => {
      const mockTx = {
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };
      mockTx.update.mockReturnValue({
        set: mockTx.set,
      });
      mockTx.set.mockReturnValue({
        where: mockTx.where,
      });
      mockTx.delete.mockReturnValue({
        where: mockTx.where,
      });

      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      mockRequest = createMockRequest({ newOwnerId });

      await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });

      // Verify collaborator removal (first delete call)
      expect(mockTx.delete).toHaveBeenCalled();
    });

    it('should delete user account', async () => {
      const mockTx = {
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue(undefined),
      };
      mockTx.update.mockReturnValue({
        set: mockTx.set,
      });
      mockTx.set.mockReturnValue({
        where: mockTx.where,
      });
      mockTx.delete.mockReturnValue({
        where: mockTx.where,
      });

      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        return callback(mockTx);
      });

      mockRequest = createMockRequest({ newOwnerId });

      await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });

      // Verify user deletion (second delete call)
      expect(mockTx.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('Transaction rollback', () => {
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

      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          name: 'User to Delete',
          email: 'delete@test.com',
          role: 'user',
        })
        .mockResolvedValueOnce({
          id: newOwnerId,
          name: 'New Owner',
          email: 'owner@test.com',
          role: 'user',
        });
    });

    it('should rollback transaction on error', async () => {
      (db.transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to delete user');
      expect(data.error).toContain('rolled back');
    });

    it('should handle recipe transfer errors', async () => {
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          update: jest.fn().mockRejectedValue(new Error('Recipe transfer failed')),
          delete: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(undefined),
        };
        mockTx.update.mockReturnValue({
          set: mockTx.set,
        });
        return callback(mockTx);
      });

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('rolled back');
    });

    it('should handle cookbook transfer errors', async () => {
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          update: jest.fn()
            .mockReturnValueOnce({
              set: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue(undefined),
              }),
            })
            .mockRejectedValueOnce(new Error('Cookbook transfer failed')),
          delete: jest.fn().mockReturnThis(),
        };
        return callback(mockTx);
      });

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('rolled back');
    });

    it('should handle collaborator removal errors', async () => {
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          update: jest.fn().mockReturnThis(),
          delete: jest.fn().mockRejectedValue(new Error('Collaborator removal failed')),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(undefined),
        };
        mockTx.update.mockReturnValue({
          set: mockTx.set,
        });
        mockTx.set.mockReturnValue({
          where: mockTx.where,
        });
        return callback(mockTx);
      });

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('rolled back');
    });

    it('should handle user deletion errors', async () => {
      (db.transaction as jest.Mock).mockImplementation(async (callback) => {
        const mockTx = {
          update: jest.fn().mockReturnThis(),
          delete: jest.fn()
            .mockReturnValueOnce({
              where: jest.fn().mockResolvedValue(undefined),
            })
            .mockReturnValueOnce({
              where: jest.fn().mockRejectedValue(new Error('User deletion failed')),
            }),
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(undefined),
        };
        mockTx.update.mockReturnValue({
          set: mockTx.set,
        });
        mockTx.set.mockReturnValue({
          where: mockTx.where,
        });
        return callback(mockTx);
      });

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('rolled back');
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

    it('should handle foreign key constraint errors', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          name: 'User to Delete',
          email: 'delete@test.com',
          role: 'user',
        })
        .mockResolvedValueOnce({
          id: newOwnerId,
          name: 'New Owner',
          email: 'owner@test.com',
          role: 'user',
        });

      (db.transaction as jest.Mock).mockRejectedValue(
        new Error('foreign key constraint violation')
      );

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('data dependencies');
    });

    it('should handle transaction-specific errors', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          name: 'User to Delete',
          email: 'delete@test.com',
          role: 'user',
        })
        .mockResolvedValueOnce({
          id: newOwnerId,
          name: 'New Owner',
          email: 'owner@test.com',
          role: 'user',
        });

      (db.transaction as jest.Mock).mockRejectedValue(new Error('transaction deadlock'));

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('rolled back');
    });

    it('should handle unknown errors gracefully', async () => {
      (db.query.users.findFirst as jest.Mock)
        .mockResolvedValueOnce({
          id: validUserId,
          name: 'User to Delete',
          email: 'delete@test.com',
          role: 'user',
        })
        .mockResolvedValueOnce({
          id: newOwnerId,
          name: 'New Owner',
          email: 'owner@test.com',
          role: 'user',
        });

      (db.transaction as jest.Mock).mockRejectedValue('Unknown error');

      mockRequest = createMockRequest({ newOwnerId });

      const response = await DELETE(mockRequest, { params: Promise.resolve({ id: validUserId }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete user. Please try again later.');
    });
  });
});
