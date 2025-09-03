import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import { cookbooks, cookbookRecipes, cookbookCollaborators, recipes } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import type { 
  CookbookOption, 
  GetRecipeCookbooksResponse, 
  ApiErrorResponse,
  RecipeIdParamSchema 
} from '@/types';

/**
 * GET /api/recipes/[id]/cookbooks
 * 
 * Fetches all cookbooks the user can edit along with their status for the specified recipe
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<RecipeIdParamSchema> }
): Promise<NextResponse<GetRecipeCookbooksResponse | ApiErrorResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required to access this resource',
        statusCode: 401,
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const userId = session.user.id;
    const { id: recipeId } = await params;

    // Validate recipe ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipeId)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid recipe ID format',
        message: 'Recipe ID must be a valid UUID',
        statusCode: 400,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if recipe exists
    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, recipeId),
    });

    if (!recipe) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Recipe not found',
        message: 'The requested recipe does not exist',
        statusCode: 404,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Get all cookbooks owned by the user
    const ownedCookbooks = await db.query.cookbooks.findMany({
      where: eq(cookbooks.ownerId, userId),
      orderBy: [desc(cookbooks.updatedAt)],
    });

    // Get all cookbooks where user is a collaborator with edit permissions
    const collaboratedCookbooks = await db.query.cookbookCollaborators.findMany({
      where: and(
        eq(cookbookCollaborators.userId, userId),
        eq(cookbookCollaborators.permission, 'edit')
      ),
      with: {
        cookbook: true,
      },
      orderBy: [desc(cookbookCollaborators.updatedAt)],
    });

    // Get all cookbook-recipe relationships for this recipe
    const recipeInCookbooks = await db.query.cookbookRecipes.findMany({
      where: eq(cookbookRecipes.recipeId, recipeId),
    });

    const recipeInCookbookIds = new Set(
      recipeInCookbooks.map(cr => cr.cookbookId)
    );

    // Combine and format cookbook options
    const cookbookOptions: CookbookOption[] = [];

    // Add owned cookbooks
    for (const cookbook of ownedCookbooks) {
      cookbookOptions.push({
        id: cookbook.id,
        name: cookbook.title,
        isChecked: recipeInCookbookIds.has(cookbook.id),
        isOwned: true,
        permission: 'owner',
        lastUsed: cookbook.updatedAt,
      });
    }

    // Add collaborated cookbooks with edit permissions
    for (const collaboration of collaboratedCookbooks) {
      if (collaboration.cookbook) {
        cookbookOptions.push({
          id: collaboration.cookbook.id,
          name: collaboration.cookbook.title,
          isChecked: recipeInCookbookIds.has(collaboration.cookbook.id),
          isOwned: false,
          permission: 'edit',
          lastUsed: collaboration.cookbook.updatedAt,
        });
      }
    }

    // Sort cookbooks: recently used first, then owned, then collaborated
    cookbookOptions.sort((a, b) => {
      // First sort by last used date (most recent first)
      if (a.lastUsed && b.lastUsed) {
        // Ensure lastUsed is a Date object and is valid
        const aDate = a.lastUsed instanceof Date ? a.lastUsed : new Date(a.lastUsed);
        const bDate = b.lastUsed instanceof Date ? b.lastUsed : new Date(b.lastUsed);

        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          const timeDiff = bDate.getTime() - aDate.getTime();
          if (timeDiff !== 0) return timeDiff;
        }
      }

      // Then prioritize owned cookbooks
      if (a.isOwned && !b.isOwned) return -1;
      if (!a.isOwned && b.isOwned) return 1;

      // Finally sort by name
      return a.name.localeCompare(b.name);
    });

    const response: GetRecipeCookbooksResponse = {
      cookbooks: cookbookOptions,
      totalCount: cookbookOptions.length,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching recipe cookbooks:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch recipe cookbooks',
      statusCode: 500,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}