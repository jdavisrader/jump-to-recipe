import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import { cookbooks, cookbookRecipes, recipes } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { hasMinimumPermission } from '@/lib/cookbook-permissions';
import { addRecipeToCookbookSchema } from '@/lib/validations/cookbook-recipes';
import { eq, and, desc } from 'drizzle-orm';

/**
 * POST /api/cookbooks/[id]/recipes
 * 
 * Adds a recipe to a cookbook
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: cookbookId } = await params;

    // Validate cookbook ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cookbookId)) {
      return NextResponse.json(
        { error: 'Invalid cookbook ID format' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = addRecipeToCookbookSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.format()
        },
        { status: 400 }
      );
    }

    const { recipeId } = validationResult.data;

    // Check if cookbook exists
    const cookbook = await db.query.cookbooks.findFirst({
      where: eq(cookbooks.id, cookbookId),
    });

    if (!cookbook) {
      return NextResponse.json(
        { error: 'Cookbook not found' },
        { status: 404 }
      );
    }

    // Check if user has edit permissions for this cookbook
    const hasPermission = await hasMinimumPermission(cookbookId, userId, 'edit');
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this cookbook' },
        { status: 403 }
      );
    }

    // Check if recipe exists
    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, recipeId),
    });

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Check if recipe is already in the cookbook
    const existingEntry = await db.query.cookbookRecipes.findFirst({
      where: and(
        eq(cookbookRecipes.cookbookId, cookbookId),
        eq(cookbookRecipes.recipeId, recipeId)
      ),
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Recipe is already in this cookbook' },
        { status: 409 }
      );
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

    return NextResponse.json({
      success: true,
      message: 'Recipe added to cookbook successfully',
      data: newCookbookRecipe,
    });

  } catch (error) {
    console.error('Error adding recipe to cookbook:', error);
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'Recipe is already in this cookbook' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add recipe to cookbook' },
      { status: 500 }
    );
  }
}