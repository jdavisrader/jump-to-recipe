import { db } from '@/db';
import { cookbooks, cookbookCollaborators, Cookbook } from '@/db/schema';
import { eq, and, or, not, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Define interfaces for the query results
interface CollaboratorWithCookbook {
  id: string;
  userId: string;
  cookbookId: string;
  permission: string;
  invitedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  cookbook: {
    id: string;
    title: string;
    description: string | null;
    coverImageUrl: string | null;
    ownerId: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    owner: {
      id: string;
      name: string;
      image: string | null;
    };
  };
}

export type CookbookPermission = 'none' | 'view' | 'edit' | 'owner';

/**
 * Check what level of access a user has to a cookbook
 */
export async function getCookbookPermission(
  cookbookId: string,
  userId: string
): Promise<CookbookPermission> {
  try {
    // Get the cookbook
    const cookbook = await db.query.cookbooks.findFirst({
      where: eq(cookbooks.id, cookbookId),
    });

    if (!cookbook) {
      return 'none';
    }

    // Check if user is the owner
    if (cookbook.ownerId === userId) {
      return 'owner';
    }

    // Check if user is a collaborator
    const collaborator = await db.query.cookbookCollaborators.findFirst({
      where: and(
        eq(cookbookCollaborators.cookbookId, cookbookId),
        eq(cookbookCollaborators.userId, userId)
      ),
    });

    if (collaborator) {
      return collaborator.permission as CookbookPermission;
    }

    // Check if cookbook is public (view access only)
    if (cookbook.isPublic) {
      return 'view';
    }

    return 'none';
  } catch (error) {
    console.error('Error checking cookbook permission:', error);
    return 'none';
  }
}

/**
 * Check if user has at least the specified permission level
 */
export async function hasMinimumPermission(
  cookbookId: string,
  userId: string,
  requiredPermission: CookbookPermission
): Promise<boolean> {
  const userPermission = await getCookbookPermission(cookbookId, userId);

  const permissionLevels: Record<CookbookPermission, number> = {
    none: 0,
    view: 1,
    edit: 2,
    owner: 3,
  };

  return permissionLevels[userPermission] >= permissionLevels[requiredPermission];
}

/**
 * Get all cookbooks a user has access to (owned + collaborated + public)
 */
export async function getUserAccessibleCookbooks(userId: string) {
  try {
    // Get owned cookbooks
    let ownedCookbooks: Awaited<ReturnType<typeof db.query.cookbooks.findMany>> = [];
    try {
      ownedCookbooks = await db.query.cookbooks.findMany({
        where: eq(cookbooks.ownerId, userId),
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      });
    } catch (err) {
      console.error('Error fetching owned cookbooks:', err);
      ownedCookbooks = [];
    }

    // Get collaborated cookbooks
    let collaboratedCookbooks: CollaboratorWithCookbook[] = [];
    try {
      collaboratedCookbooks = await db.query.cookbookCollaborators.findMany({
        where: eq(cookbookCollaborators.userId, userId),
        with: {
          cookbook: {
            with: {
              owner: {
                columns: {
                  id: true,
                  name: true,
                  image: true,
                }
              }
            }
          }
        },
      });
    } catch (err) {
      console.error('Error fetching collaborated cookbooks:', err);
      collaboratedCookbooks = [];
    }

    // Get public cookbooks (excluding owned and collaborated ones)
    const ownedAndCollaboratedIds = [
      ...ownedCookbooks.map(c => c.id),
      ...collaboratedCookbooks.map(c => c.cookbookId || ''),
    ].filter(id => id); // Filter out any undefined or empty IDs

    let publicCookbooks: Awaited<ReturnType<typeof db.query.cookbooks.findMany>> = [];
    try {
      publicCookbooks = await db.query.cookbooks.findMany({
        where: and(
          eq(cookbooks.isPublic, true),
          ownedAndCollaboratedIds.length > 0
            ? not(inArray(cookbooks.id, ownedAndCollaboratedIds))
            : undefined
        ),
        with: {
          owner: {
            columns: {
              id: true,
              name: true,
              image: true,
            }
          }
        }
      });
    } catch (err) {
      console.error('Error fetching public cookbooks:', err);
      publicCookbooks = [];
    }

    return {
      owned: ownedCookbooks,
      collaborated: collaboratedCookbooks.map(c => ({
        cookbook: c.cookbook,
        permission: c.permission,
      })),
      public: publicCookbooks,
    };
  } catch (error) {
    console.error('Error getting user accessible cookbooks:', error);
    return {
      owned: [],
      collaborated: [],
      public: [],
    };
  }
}

/**
 * Middleware to check cookbook permissions
 * Use this as a wrapper for API routes that need permission checking
 */
export function withCookbookPermission(
  handler: (
    req: NextRequest,
    context: { params: { id: string } },
    permission: CookbookPermission
  ) => Promise<NextResponse>,
  requiredPermission: CookbookPermission
) {
  return async (
    req: NextRequest,
    context: { params: { id: string } }
  ): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const userId = session.user.id;
      const cookbookId = context.params.id;

      // Get the cookbook
      const cookbook = await db.query.cookbooks.findFirst({
        where: eq(cookbooks.id, cookbookId),
      });

      if (!cookbook) {
        return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
      }

      // Check if user has required permission
      const hasPermission = await hasMinimumPermission(cookbookId, userId, requiredPermission);

      if (!hasPermission) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Get the user's actual permission level
      const permission = await getCookbookPermission(cookbookId, userId);

      // Call the handler with the permission level
      return handler(req, context, permission);
    } catch (error) {
      console.error('Error in cookbook permission middleware:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}