import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import { cookbooks, cookbookRecipes, recipes } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { hasMinimumPermission } from '@/lib/cookbook-permissions';
import { addRecipeToCookbookSchema } from '@/lib/validations/cookbook-recipes';
import { eq, and, desc } from 'drizzle-orm';
import type { 
  AddRecipeToCookbookHandler,
  CookbookParamsType,
  AddRecipeRequestBody,
  AddRecipeResponseData,
  ApiSuccessResponse,
  ApiErrorResponse
} from '@/types';

/**
 * POST /api/cookbooks/[id]/recipes
 * 
 * Adds a recipe to a cookbook
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<CookbookParamsType> }
): Promise<NextResponse<ApiSuccessResponse<AddRecipeResponseData> | ApiErrorResponse>> {
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
    const { id: cookbookId } = await params;

    // Validate cookbook ID format
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

    // Parse and validate request body
    const body: AddRecipeRequestBody = await req.json();
    const validationResult = addRecipeToCookbookSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Invalid request data',
        message: 'Request validation failed',
        statusCode: 400,
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { recipeId } = validationResult.data;

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

    // Check if recipe is already in the cookbook
    const existingEntry = await db.query.cookbookRecipes.findFirst({
      where: and(
        eq(cookbookRecipes.cookbookId, cookbookId),
        eq(cookbookRecipes.recipeId, recipeId)
      ),
    });

    if (existingEntry) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Recipe already exists',
        message: 'This recipe is already in the cookbook',
        statusCode: 409,
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    // Get the highest position in the cookbook to append at the end
    const lastRecipe = await db.query.cookbookRecipes.findFirst({
      where: eq(cookbookRecipes.cookbookId, cookbookId),
      orderBy: [desc(cookbookRecipes.position)],
    });

    const nextPosition = (lastRecipe?.position ?? -1) + 1;

    // Add recipe to cookbook
    const [newCookbookRecipe] = await db
      .insert(cookbookRecipes)
      .values({
        cookbookId,
        recipeId,
        position: nextPosition,
      })
      .returning();

    const response: ApiSuccessResponse<AddRecipeResponseData> = {
      success: true,
      message: 'Recipe added to cookbook successfully',
      data: {
        cookbookId: newCookbookRecipe.cookbookId,
        recipeId: newCookbookRecipe.recipeId,
        position: newCookbookRecipe.position,
        addedAt: newCookbookRecipe.createdAt.toISOString(),
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error adding recipe to cookbook:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique constraint')) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Recipe already exists',
        message: 'This recipe is already in the cookbook',
        statusCode: 409,
      };
      return NextResponse.json(errorResponse, { status: 409 });
    }

    const errorResponse: ApiErrorResponse = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to add recipe to cookbook',
      statusCode: 500,
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}