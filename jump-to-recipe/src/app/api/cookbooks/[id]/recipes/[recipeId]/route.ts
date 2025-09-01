import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/db';
import { cookbooks, cookbookRecipes } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { hasMinimumPermission } from '@/lib/cookbook-permissions';
import { eq, and } from 'drizzle-orm';

/**
 * DELETE /api/cookbooks/[id]/recipes/[recipeId]
 * 
 * Removes a recipe from a cookbook
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; recipeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: cookbookId, recipeId } = await params;

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(cookbookId)) {
      return NextResponse.json(
        { error: 'Invalid cookbook ID format' },
        { status: 400 }
      );
    }

    if (!uuidRegex.test(recipeId)) {
      return NextResponse.json(
        { error: 'Invalid recipe ID format' },
        { status: 400 }
      );
    }

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

    // Check if recipe is in the cookbook
    const cookbookRecipe = await db.query.cookbookRecipes.findFirst({
      where: and(
        eq(cookbookRecipes.cookbookId, cookbookId),
        eq(cookbookRecipes.recipeId, recipeId)
      ),
    });

    if (!cookbookRecipe) {
      return NextResponse.json(
        { error: 'Recipe not found in this cookbook' },
        { status: 404 }
      );
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

    return NextResponse.json({
      success: true,
      message: 'Recipe removed from cookbook successfully',
    });

  } catch (error) {
    console.error('Error removing recipe from cookbook:', error);
    return NextResponse.json(
      { error: 'Failed to remove recipe from cookbook' },
      { status: 500 }
    );
  }
}