import {
  getCookbookPermission,
  hasMinimumPermission,
  getUserAccessibleCookbooks,
  withCookbookPermission,
} from '@/lib/cookbook-permissions';
import { db } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/db');
jest.mock('next-auth');
jest.mock('@/lib/auth');

const mockDb = db as jest.Mocked<typeof db>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Cookbook Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCookbookPermission', () => {
    it('should return "none" for non-existent cookbook', async () => {
      mockDb.query = {
        cookbooks: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any;

      const permission = await getCookbookPermission('nonexistent', 'user1');
      expect(permission).toBe('none');
    });

    it('should return "owner" for cookbook owner', async () => {
      const mockCookbook = {
        id: 'cookbook1',
        title: 'My Cookbook',
        ownerId: 'user1',
        isPublic: false,
      };

      mockDb.query = {
        cookbooks: {
          findFirst: jest.fn().mockResolvedValue(mockCookbook),
        },
      } as any;

      const permission = await getCookbookPermission('cookbook1', 'user1');
      expect(permission).toBe('owner');
    });

    it('should return collaborator permission for collaborators', async () => {
      const mockCookbook = {
        id: 'cookbook1',
        title: 'Shared Cookbook',
        ownerId: 'user2',
        isPublic: false,
      };

      const mockCollaborator = {
        id: 'collab1',
        cookbookId: 'cookbook1',
        userId: 'user1',
        permission: 'edit',
      };

      mockDb.query = {
        cookbooks: {
          findFirst: jest.fn().mockResolvedValue(mockCookbook),
        },
        cookbookCollaborators: {
          findFirst: jest.fn().mockResolvedValue(mockCollaborator),
        },
      } as any;

      const permission = await getCookbookPermission('cookbook1', 'user1');
      expect(permission).toBe('edit');
    });

    it('should return "view" for public cookbooks', async () => {
      const mockCookbook = {
        id: 'cookbook1',
        title: 'Public Cookbook',
        ownerId: 'user2',
        isPublic: true,
      };

      mockDb.query = {
        cookbooks: {
          findFirst: jest.fn().mockResolvedValue(mockCookbook),
        },
        cookbookCollaborators: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any;

      const permission = await getCookbookPermission('cookbook1', 'user1');
      expect(permission).toBe('view');
    });

    it('should return "none" for private cookbooks without access', async () => {
      const mockCookbook = {
        id: 'cookbook1',
        title: 'Private Cookbook',
        ownerId: 'user2',
        isPublic: false,
      };

      mockDb.query = {
        cookbooks: {
          findFirst: jest.fn().mockResolvedValue(mockCookbook),
        },
        cookbookCollaborators: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any;

      const permission = await getCookbookPermission('cookbook1', 'user1');
      expect(permission).toBe('none');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.query = {
        cookbooks: {
          findFirst: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      } as any;

      const permission = await getCookbookPermission('cookbook1', 'user1');
      expect(permission).toBe('none');
    });
  });

  describe('hasMinimumPermission', () => {
    beforeEach(() => {
      // Mock getCookbookPermission by setting up the database queries
      const mockCookbook = {
        id: 'cookbook1',
        ownerId: 'owner1',
        isPublic: false,
      };

      mockDb.query = {
        cookbooks: {
          findFirst: jest.fn().mockResolvedValue(mockCookbook),
        },
        cookbookCollaborators: {
          findFirst: jest.fn().mockImplementation(({ where }) => {
            // Simulate different users having different permissions
            if (where.toString().includes('user1')) {
              return Promise.resolve({ permission: 'edit' });
            }
            if (where.toString().includes('user2')) {
              return Promise.resolve({ permission: 'view' });
            }
            return Promise.resolve(null);
          }),
        },
      } as any;
    });

    it('should return true when user has exact required permission', async () => {
      const hasPermission = await hasMinimumPermission('cookbook1', 'user1', 'edit');
      expect(hasPermission).toBe(true);
    });

    it('should return true when user has higher permission than required', async () => {
      // Owner should have access to everything
      mockDb.query.cookbooks.findFirst = jest.fn().mockResolvedValue({
        id: 'cookbook1',
        ownerId: 'user1', // user1 is owner
        isPublic: false,
      });

      const hasPermission = await hasMinimumPermission('cookbook1', 'user1', 'view');
      expect(hasPermission).toBe(true);
    });

    it('should return false when user has lower permission than required', async () => {
      const hasPermission = await hasMinimumPermission('cookbook1', 'user2', 'edit');
      expect(hasPermission).toBe(false);
    });

    it('should return false when user has no permission', async () => {
      const hasPermission = await hasMinimumPermission('cookbook1', 'user3', 'view');
      expect(hasPermission).toBe(false);
    });
  });

  describe('getUserAccessibleCookbooks', () => {
    it('should return owned, collaborated, and public cookbooks', async () => {
      const mockOwnedCookbooks = [
        {
          id: 'owned1',
          title: 'My Cookbook',
          ownerId: 'user1',
          owner: { id: 'user1', name: 'User 1', image: null },
        },
      ];

      const mockCollaboratedCookbooks = [
        {
          id: 'collab1',
          cookbookId: 'shared1',
          userId: 'user1',
          permission: 'edit',
          cookbook: {
            id: 'shared1',
            title: 'Shared Cookbook',
            ownerId: 'user2',
            owner: { id: 'user2', name: 'User 2', image: null },
          },
        },
      ];

      const mockPublicCookbooks = [
        {
          id: 'public1',
          title: 'Public Cookbook',
          ownerId: 'user3',
          isPublic: true,
          owner: { id: 'user3', name: 'User 3', image: null },
        },
      ];

      mockDb.query = {
        cookbooks: {
          findMany: jest.fn()
            .mockResolvedValueOnce(mockOwnedCookbooks) // First call for owned
            .mockResolvedValueOnce(mockPublicCookbooks), // Second call for public
        },
        cookbookCollaborators: {
          findMany: jest.fn().mockResolvedValue(mockCollaboratedCookbooks),
        },
      } as any;

      const result = await getUserAccessibleCookbooks('user1');

      expect(result.owned).toHaveLength(1);
      expect(result.collaborated).toHaveLength(1);
      expect(result.public).toHaveLength(1);
      expect(result.owned[0].title).toBe('My Cookbook');
      expect(result.collaborated[0].cookbook.title).toBe('Shared Cookbook');
      expect(result.public[0].title).toBe('Public Cookbook');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.query = {
        cookbooks: {
          findMany: jest.fn().mockRejectedValue(new Error('Database error')),
        },
        cookbookCollaborators: {
          findMany: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      } as any;

      const result = await getUserAccessibleCookbooks('user1');

      expect(result.owned).toHaveLength(0);
      expect(result.collaborated).toHaveLength(0);
      expect(result.public).toHaveLength(0);
    });

    it('should exclude owned and collaborated cookbooks from public list', async () => {
      const mockOwnedCookbooks = [
        { id: 'cookbook1', title: 'Owned', ownerId: 'user1' },
      ];

      const mockCollaboratedCookbooks = [
        {
          cookbookId: 'cookbook2',
          cookbook: { id: 'cookbook2', title: 'Collaborated' },
        },
      ];

      const mockPublicCookbooks = [
        { id: 'cookbook3', title: 'Public Only', ownerId: 'user3' },
      ];

      mockDb.query = {
        cookbooks: {
          findMany: jest.fn()
            .mockResolvedValueOnce(mockOwnedCookbooks)
            .mockResolvedValueOnce(mockPublicCookbooks),
        },
        cookbookCollaborators: {
          findMany: jest.fn().mockResolvedValue(mockCollaboratedCookbooks),
        },
      } as any;

      const result = await getUserAccessibleCookbooks('user1');

      expect(result.public).toHaveLength(1);
      expect(result.public[0].id).toBe('cookbook3');
    });
  });

  describe('withCookbookPermission middleware', () => {
    const mockHandler = jest.fn();
    const mockRequest = new NextRequest('http://localhost:3000/api/cookbooks/cookbook1');
    const mockContext = { params: { id: 'cookbook1' } };

    beforeEach(() => {
      mockHandler.mockClear();
    });

    it('should return 401 for unauthenticated users', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const middleware = withCookbookPermission(mockHandler, 'view');
      const response = await middleware(mockRequest, mockContext);

      expect(response.status).toBe(401);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent cookbook', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      mockDb.query = {
        cookbooks: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any;

      const middleware = withCookbookPermission(mockHandler, 'view');
      const response = await middleware(mockRequest, mockContext);

      expect(response.status).toBe(404);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should return 403 for insufficient permissions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const mockCookbook = {
        id: 'cookbook1',
        ownerId: 'user2',
        isPublic: false,
      };

      mockDb.query = {
        cookbooks: {
          findFirst: jest.fn().mockResolvedValue(mockCookbook),
        },
        cookbookCollaborators: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any;

      const middleware = withCookbookPermission(mockHandler, 'edit');
      const response = await middleware(mockRequest, mockContext);

      expect(response.status).toBe(403);
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should call handler with permission for authorized users', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user1', email: 'test@example.com' },
      } as any);

      const mockCookbook = {
        id: 'cookbook1',
        ownerId: 'user1', // User is owner
        isPublic: false,
      };

      mockDb.query = {
        cookbooks: {
          findFirst: jest.fn().mockResolvedValue(mockCookbook),
        },
      } as any;

      mockHandler.mockResolvedValue(NextResponse.json({ success: true }));

      const middleware = withCookbookPermission(mockHandler, 'edit');
      const response = await middleware(mockRequest, mockContext);

      expect(mockHandler).toHaveBeenCalledWith(mockRequest, mockContext, 'owner');
      expect(response.status).toBe(200);
    });

    it('should handle middleware errors gracefully', async () => {
      mockGetServerSession.mockRejectedValue(new Error('Session error'));

      const middleware = withCookbookPermission(mockHandler, 'view');
      const response = await middleware(mockRequest, mockContext);

      expect(response.status).toBe(500);
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });
});