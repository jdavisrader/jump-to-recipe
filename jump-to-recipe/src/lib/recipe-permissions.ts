import { db } from '@/db';
import { recipes } from '@/db/schema/recipes';
import { cookbookRecipes, cookbooks, cookbookCollaborators } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export type RecipePermission = 'none' | 'view' | 'edit' | 'owner';

/**
 * Check what level of access a user has to a recipe
 * Takes into account:
 * - Recipe ownership
 * - Recipe visibility (public/private)
 * - Cookbook collaborator permissions
 * - Admin role
 */
export async function getRecipePermission(
  recipeId: string,
  userId: string | null | undefined
): Promise<RecipePermission> {
  try {
    // Get the recipe
    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, recipeId),
    });

    if (!recipe) {
      return 'none';
    }

    // No user ID means anonymous access
    if (!userId) {
      // Public recipes can be viewed by anyone
      return recipe.visibility === 'public' ? 'view' : 'none';
    }

    // Check if user is the recipe owner
    if (recipe.authorId === userId) {
      return 'owner';
    }

    // Check if user is admin (admins can edit any recipe)
    // Note: We'll need to get the user's role from the session in the calling code
    // For now, this function assumes the caller will handle admin checks

    // Check if recipe is in any cookbooks where user is a collaborator
    const cookbookMemberships = await db
      .select({
        cookbookId: cookbookRecipes.cookbookId,
        permission: cookbookCollaborators.permission,
        isOwner: cookbooks.ownerId,
      })
      .from(cookbookRecipes)
      .innerJoin(cookbooks, eq(cookbookRecipes.cookbookId, cookbooks.id))
      .leftJoin(
        cookbookCollaborators,
        and(
          eq(cookbookCollaborators.cookbookId, cookbooks.id),
          eq(cookbookCollaborators.userId, userId)
        )
      )
      .where(eq(cookbookRecipes.recipeId, recipeId));

    // Check if user owns any cookbook containing this recipe
    const ownsContainingCookbook = cookbookMemberships.some(
      (membership) => membership.isOwner === userId
    );

    if (ownsContainingCookbook) {
      return 'edit';
    }

    // Check if user has edit permission in any cookbook containing this recipe
    const hasEditPermission = cookbookMemberships.some(
      (membership) => membership.permission === 'edit'
    );

    if (hasEditPermission) {
      return 'edit';
    }

    // Check if user has view permission in any cookbook containing this recipe
    const hasViewPermission = cookbookMemberships.some(
      (membership) => membership.permission === 'view'
    );

    if (hasViewPermission) {
      return 'view';
    }

    // Check if recipe is public (anyone can view)
    if (recipe.visibility === 'public') {
      return 'view';
    }

    // No access
    return 'none';
  } catch (error) {
    console.error('Error checking recipe permission:', error);
    return 'none';
  }
}

/**
 * Check if user has at least the specified permission level
 */
export function hasMinimumRecipePermission(
  userPermission: RecipePermission,
  requiredPermission: RecipePermission
): boolean {
  const permissionLevels: Record<RecipePermission, number> = {
    none: 0,
    view: 1,
    edit: 2,
    owner: 3,
  };

  return permissionLevels[userPermission] >= permissionLevels[requiredPermission];
}

/**
 * Get recipe permission for the current session user
 * Includes admin role check
 */
export async function getRecipePermissionForSession(
  recipeId: string,
  session: Awaited<ReturnType<typeof getServerSession>> | null
): Promise<RecipePermission> {
  // Type guard to check if session has user property
  if (!session || typeof session !== 'object' || !('user' in session) || !session.user) {
    return getRecipePermission(recipeId, null);
  }

  // Type assertion for user with role and id
  const user = session.user as { id: string; role?: string };

  // Admin users have edit access to all recipes
  if (user.role === 'admin') {
    return 'edit';
  }

  return getRecipePermission(recipeId, user.id);
}

/**
 * Middleware to check recipe permissions
 * Use this as a wrapper for API routes that need permission checking
 * Supports both Promise and non-Promise params for Next.js 15 compatibility
 */
export function withRecipePermission(
  handler: (
    req: NextRequest,
    context: { params: Promise<{ id: string }> | Promise<{ photoId: string }> | { id: string } | { photoId: string } },
    permission: RecipePermission,
    session: Awaited<ReturnType<typeof getServerSession>>
  ) => Promise<NextResponse>,
  requiredPermission: RecipePermission,
  options?: {
    getRecipeIdFromPhotoId?: boolean;
  }
) {
  return async (
    req: NextRequest,
    context: { params: Promise<{ id: string }> | Promise<{ photoId: string }> | { id: string } | { photoId: string } }
  ): Promise<NextResponse> => {
    try {
      const session = await getServerSession(authOptions);

      // For operations requiring edit or owner permissions, authentication is required
      if (requiredPermission !== 'view' && (!session || typeof session !== 'object' || !('user' in session) || !session.user)) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Await params if it's a Promise (Next.js 15)
      const params = context.params instanceof Promise ? await context.params : context.params;

      let recipeId: string;

      // Handle different parameter types
      if (options?.getRecipeIdFromPhotoId && 'photoId' in params) {
        // Need to look up recipe ID from photo ID
        const { recipePhotos } = await import('@/db/schema/recipe-photos');
        const photo = await db.query.recipePhotos.findFirst({
          where: eq(recipePhotos.id, params.photoId),
        });

        if (!photo) {
          return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
        }

        recipeId = photo.recipeId;
      } else if ('id' in params) {
        recipeId = params.id;
      } else {
        return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
      }

      // Get the recipe
      const recipe = await db.query.recipes.findFirst({
        where: eq(recipes.id, recipeId),
      });

      if (!recipe) {
        return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
      }

      // Get user's permission level
      const permission = await getRecipePermissionForSession(recipeId, session);

      // Check if user has required permission
      if (!hasMinimumRecipePermission(permission, requiredPermission)) {
        const errorMessage =
          requiredPermission === 'edit'
            ? 'Not authorized to edit this recipe'
            : requiredPermission === 'owner'
              ? 'Not authorized to manage this recipe'
              : 'Not authorized to view this recipe';

        return NextResponse.json({ error: errorMessage }, { status: 403 });
      }

      // Call the handler with the permission level and session
      return handler(req, context, permission, session);
    } catch (error) {
      console.error('Error in recipe permission middleware:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

/**
 * Check if a user can view a recipe
 */
export async function canViewRecipe(
  recipeId: string,
  userId: string | null | undefined
): Promise<boolean> {
  const permission = await getRecipePermission(recipeId, userId);
  return hasMinimumRecipePermission(permission, 'view');
}

/**
 * Check if a user can edit a recipe
 */
export async function canEditRecipe(
  recipeId: string,
  userId: string | null | undefined,
  userRole?: string
): Promise<boolean> {
  // Admins can edit any recipe
  if (userRole === 'admin') {
    return true;
  }

  const permission = await getRecipePermission(recipeId, userId);
  return hasMinimumRecipePermission(permission, 'edit');
}
