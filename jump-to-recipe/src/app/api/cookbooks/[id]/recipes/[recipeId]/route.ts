import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import { cookbooks, cookbookRecipes } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { hasMinimumPermission } from '@/lib/cookbook-permissions';
import { eq, and } from 'drizzle-orm';
import type { 
  CookbookRecipeParamsType,
  RemoveRecipeResponseData,
  ApiSuccessResponse,
  ApiErrorResponse
} from '@/types';

/**
 * DELETE /api/cookbooks/[id]/recipes/[recipeId]
 * 
 * Removes a recipe from a cookbook
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<CookbookRecipeParamsType> }
): Promise<NextResponse<ApiSuccessResponse<RemoveRecipeResponseData> | ApiErrorResponse>> {
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
    const { id: cookbookId, recipeId } = await params;

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(cookbookId)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid cookbook ID format',
        message: 'Cookbook ID must be a valid UUID',
        statusCode: 400,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!uuidRegex.test(recipeId)) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid recipe ID format',
        message: 'Recipe ID must be a valid UUID',
        statusCode: 400,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check if cookbook exists
    const cookbook = await db.query.cookbooks.findFirst({
      where: eq(cookbooks.id, cookbookId),
    });

    if (!cookbook) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Cookbook not found',
        message: 'The requested cookbook does not exist',
        statusCode: 404,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Check if user has edit permissions for this cookbook
    const hasPermission = await hasMinimumPermission(cookbookId, userId, 'edit');
    
    if (!hasPermission) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to edit this cookbook',
        statusCode: 403,
      };
      return NextResponse.json(errorResponse, { status: 403 });
    }

    // Check if recipe is in the cookbook
    const cookbookRecipe = await db.query.cookbookRecipes.findFirst({
      where: and(
        eq(cookbookRecipes.cookbookId, cookbookId),
        eq(cookbookRecipes.recipeId, recipeId)
      ),
    });

    if (!cookbookRecipe) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Recipe not found',
        message: 'The recipe is not in this cookbook',
        statusCode: 404,
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // Remove recipe from cookbook
    await db
      .delete(cookbookRecipes)
      .where(
        and(
          eq(cookbookRecipes.cookbookId, cookbookId),
          eq(cookbookRecipes.recipeId, recipeId)
        )
      );

    const response: ApiSuccessResponse<RemoveRecipeResponseData> = {
      success: true,
      message: 'Recipe removed from cookbook successfully',
      data: {
        cookbookId,
        recipeId,
        removedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error removing recipe from cookbook:', error);
    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to remove recipe from cookbook',
      statusCode: 500,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}