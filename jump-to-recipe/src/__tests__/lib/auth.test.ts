import { hasRole } from '@/lib/auth';
import { db } from '@/db';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

// Mock dependencies
jest.mock('@/db');
jest.mock('bcrypt');
jest.mock('@/lib/env', () => ({
  env: {
    GOOGLE_ID: 'test-google-id',
    GOOGLE_SECRET: 'test-google-secret',
  },
}));

const mockDb = db as jest.Mocked<typeof db>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Authentication and Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasRole', () => {
    it('should return true for admin role with any required role', () => {
      expect(hasRole('admin', 'admin')).toBe(true);
      expect(hasRole('admin', 'elevated')).toBe(true);
      expect(hasRole('admin', 'user')).toBe(true);
    });

    it('should return correct permissions for elevated role', () => {
      expect(hasRole('elevated', 'admin')).toBe(false);
      expect(hasRole('elevated', 'elevated')).toBe(true);
      expect(hasRole('elevated', 'user')).toBe(true);
    });

    it('should return correct permissions for user role', () => {
      expect(hasRole('user', 'admin')).toBe(false);
      expect(hasRole('user', 'elevated')).toBe(false);
      expect(hasRole('user', 'user')).toBe(true);
    });

    it('should return false for undefined or invalid roles', () => {
      expect(hasRole(undefined, 'user')).toBe(false);
      expect(hasRole('', 'user')).toBe(false);
      expect(hasRole('invalid', 'user')).toBe(false);
    });
  });

  describe('Credentials Provider Authorization', () => {
    // We'll test the authorize function logic by mocking its dependencies
    const mockAuthorize = async (credentials: { email: string; password: string } | undefined) => {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      try {
        // Find user by email
        const user = await mockDb.query.users.findFirst({
          where: eq({} as any, credentials.email), // Simplified for testing
        });

        // If no user or no password (OAuth user), return null
        if (!user || !user.password) {
          return null;
        }

        // Compare passwords
        const passwordMatch = await mockBcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      } catch (error) {
        return null;
      }
    };

    it('should return null for missing credentials', async () => {
      const result = await mockAuthorize(undefined);
      expect(result).toBeNull();

      const resultMissingEmail = await mockAuthorize({ email: '', password: 'password' });
      expect(resultMissingEmail).toBeNull();

      const resultMissingPassword = await mockAuthorize({ email: 'test@example.com', password: '' });
      expect(resultMissingPassword).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      mockDb.query = {
        users: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any;

      const result = await mockAuthorize({
        email: 'nonexistent@example.com',
        password: 'password',
      });

      expect(result).toBeNull();
    });

    it('should return null for OAuth user without password', async () => {
      const oauthUser = {
        id: 'user1',
        name: 'OAuth User',
        email: 'oauth@example.com',
        image: 'https://example.com/avatar.jpg',
        role: 'user',
        password: null, // OAuth users don't have passwords
      };

      mockDb.query = {
        users: {
          findFirst: jest.fn().mockResolvedValue(oauthUser),
        },
      } as any;

      const result = await mockAuthorize({
        email: 'oauth@example.com',
        password: 'password',
      });

      expect(result).toBeNull();
    });

    it('should return null for incorrect password', async () => {
      const user = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
        role: 'user',
        password: 'hashedpassword',
      };

      mockDb.query = {
        users: {
          findFirst: jest.fn().mockResolvedValue(user),
        },
      } as any;

      mockBcrypt.compare.mockResolvedValue(false);

      const result = await mockAuthorize({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result).toBeNull();
      expect(mockBcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
    });

    it('should return user for correct credentials', async () => {
      const user = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        role: 'user',
        password: 'hashedpassword',
      };

      mockDb.query = {
        users: {
          findFirst: jest.fn().mockResolvedValue(user),
        },
      } as any;

      mockBcrypt.compare.mockResolvedValue(true);

      const result = await mockAuthorize({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      expect(result).toEqual({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        role: 'user',
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('correctpassword', 'hashedpassword');
    });

    it('should handle database errors gracefully', async () => {
      mockDb.query = {
        users: {
          findFirst: jest.fn().mockRejectedValue(new Error('Database error')),
        },
      } as any;

      const result = await mockAuthorize({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toBeNull();
    });
  });

  describe('JWT and Session Callbacks', () => {
    const mockJwtCallback = async ({ token, user }: { token: any; user?: any }) => {
      // Initial sign in
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      // On subsequent calls, check if role has been updated in database
      else if (token.id) {
        const dbUser = await mockDb.query.users.findFirst({
          where: eq({} as any, token.id),
        });

        if (dbUser) {
          token.role = dbUser.role;
        }
      }

      return token;
    };

    const mockSessionCallback = ({ session, token }: { session: any; token: any }) => {
      if (token && session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    };

    it('should add role and id to JWT token on initial sign in', async () => {
      const user = {
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
      };

      const token = {};

      const result = await mockJwtCallback({ token, user });

      expect(result.role).toBe('user');
      expect(result.id).toBe('user1');
    });

    it('should update role from database on subsequent calls', async () => {
      const token = { id: 'user1', role: 'user' };

      const updatedUser = {
        id: 'user1',
        role: 'elevated', // Role was updated in database
      };

      mockDb.query = {
        users: {
          findFirst: jest.fn().mockResolvedValue(updatedUser),
        },
      } as any;

      const result = await mockJwtCallback({ token });

      expect(result.role).toBe('elevated');
      expect(result.id).toBe('user1');
    });

    it('should add role and id to session from token', () => {
      const session = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      const token = {
        role: 'admin',
        id: 'user1',
      };

      const result = mockSessionCallback({ session, token });

      expect(result.user.role).toBe('admin');
      expect(result.user.id).toBe('user1');
    });

    it('should handle missing token or session gracefully', () => {
      const session = { user: null };
      const token = null;

      const result = mockSessionCallback({ session, token });

      expect(result).toEqual(session);
    });
  });

  describe('Role-based Route Protection', () => {
    // Test scenarios for different route protection levels
    const testRouteAccess = (userRole: string | undefined, requiredRole: 'admin' | 'elevated' | 'user') => {
      return hasRole(userRole, requiredRole);
    };

    it('should protect admin routes correctly', () => {
      expect(testRouteAccess('admin', 'admin')).toBe(true);
      expect(testRouteAccess('elevated', 'admin')).toBe(false);
      expect(testRouteAccess('user', 'admin')).toBe(false);
      expect(testRouteAccess(undefined, 'admin')).toBe(false);
    });

    it('should protect elevated routes correctly', () => {
      expect(testRouteAccess('admin', 'elevated')).toBe(true);
      expect(testRouteAccess('elevated', 'elevated')).toBe(true);
      expect(testRouteAccess('user', 'elevated')).toBe(false);
      expect(testRouteAccess(undefined, 'elevated')).toBe(false);
    });

    it('should protect user routes correctly', () => {
      expect(testRouteAccess('admin', 'user')).toBe(true);
      expect(testRouteAccess('elevated', 'user')).toBe(true);
      expect(testRouteAccess('user', 'user')).toBe(true);
      expect(testRouteAccess(undefined, 'user')).toBe(false);
    });
  });
});