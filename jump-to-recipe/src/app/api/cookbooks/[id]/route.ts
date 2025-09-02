import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { db } from '@/db';
import { cookbooks, cookbookRecipes, recipes } from '@/db/schema';
import { authOptions } from '@/lib/auth';
import { hasMinimumPermission } from '@/lib/cookbook-permissions';
import { sanitizeImageUrl } from '@/lib/image-validation';
import { eq, asc, inArray } from 'drizzle-orm';

// Validation schema for updating a cookbook
const updateCookbookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500).optional(),
  description: z.string().nullable().optional(),
  coverImageUrl: z.union([
    z.string().min(1),
    z.string().length(0),
    z.literal(''),
    z.null()
  ]).optional().transform(val => val === '' ? null : val),
  isPublic: z.boolean().optional(),
});

// Validation schema for updating cookbook recipes
const updateCookbookRecipesSchema = z.array(
  z.object({
    recipeId: z.string().uuid(),
    position: z.number().int().nonnegative(),
  })
);



// GET /api/cookbooks/[id] - Get a specific cookbook with its recipes
export async function GET(
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
    
    // Get the cookbook
    const cookbook = await db.query.cookbooks.findFirst({
      where: eq(cookbooks.id, cookbookId),
    });
    
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }
    
    // Check if user has view access to the cookbook
    const hasViewAccess = await hasMinimumPermission(cookbookId, userId, 'view');
    if (!hasViewAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get cookbook recipes with their positions
    const cookbookRecipeEntries = await db.query.cookbookRecipes.findMany({
      where: eq(cookbookRecipes.cookbookId, cookbookId),
      orderBy: [asc(cookbookRecipes.position)],
    });
    
    // Get all recipe IDs
    const recipeIds = cookbookRecipeEntries.map(entry => entry.recipeId);
    
    // Get all recipes in one query
    const recipesList = recipeIds.length > 0
      ? await db.query.recipes.findMany({
          where: inArray(recipes.id, recipeIds),
        })
      : [];
    
    // Create a map for quick recipe lookup
    const recipesMap = new Map(recipesList.map(recipe => [recipe.id, recipe]));
    
    // Combine recipes with their positions
    const recipesWithPositions = cookbookRecipeEntries
      .map(entry => {
        const recipe = recipesMap.get(entry.recipeId);
        return recipe ? { recipe, position: entry.position } : null;
      })
      .filter(Boolean);
    
    // Return cookbook with recipes
    return NextResponse.json({
      cookbook: {
        ...cookbook,
        recipes: recipesWithPositions,
      },
    });
  } catch (error) {
    console.error('Error fetching cookbook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cookbook' },
      { status: 500 }
    );
  }
}

// PUT /api/cookbooks/[id] - Update a cookbook
export async function PUT(
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
    
    // Check if cookbook exists and user has access
    const cookbook = await db.query.cookbooks.findFirst({
      where: eq(cookbooks.id, cookbookId),
    });
    
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }
    
    // Check if user has edit access to the cookbook
    const hasEditAccess = await hasMinimumPermission(cookbookId, userId, 'edit');
    if (!hasEditAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await req.json();
    
    // Validate cookbook data
    const validatedData = updateCookbookSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    // Sanitize the cover image URL if provided
    const updateData = { ...validatedData.data };
    if (updateData.coverImageUrl !== undefined) {
      updateData.coverImageUrl = sanitizeImageUrl(updateData.coverImageUrl);
    }
    
    // Update cookbook
    const [updatedCookbook] = await db
      .update(cookbooks)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(cookbooks.id, cookbookId))
      .returning();
    
    // Handle recipe updates if provided
    if (body.recipes) {
      const validatedRecipes = updateCookbookRecipesSchema.safeParse(body.recipes);
      
      if (!validatedRecipes.success) {
        return NextResponse.json(
          { error: 'Invalid recipes data', details: validatedRecipes.error.format() },
          { status: 400 }
        );
      }
      
      // Delete existing recipe entries
      await db
        .delete(cookbookRecipes)
        .where(eq(cookbookRecipes.cookbookId, cookbookId));
      
      // Insert new recipe entries
      if (validatedRecipes.data.length > 0) {
        await db.insert(cookbookRecipes).values(
          validatedRecipes.data.map(({ recipeId, position }) => ({
            cookbookId,
            recipeId,
            position,
          }))
        );
      }
    }
    
    return NextResponse.json({ cookbook: updatedCookbook });
  } catch (error) {
    console.error('Error updating cookbook:', error);
    return NextResponse.json(
      { error: 'Failed to update cookbook' },
      { status: 500 }
    );
  }
}

// DELETE /api/cookbooks/[id] - Delete a cookbook
export async function DELETE(
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
    
    // Check if cookbook exists and user has access
    const cookbook = await db.query.cookbooks.findFirst({
      where: eq(cookbooks.id, cookbookId),
    });
    
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }
    
    if (cookbook.ownerId !== userId) {
      // Only the owner can delete a cookbook
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Delete the cookbook (cascade will handle cookbook_recipes)
    await db
      .delete(cookbooks)
      .where(eq(cookbooks.id, cookbookId));
    
    return NextResponse.json(
      { message: 'Cookbook deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting cookbook:', error);
    return NextResponse.json(
      { error: 'Failed to delete cookbook' },
      { status: 500 }
    );
  }
}