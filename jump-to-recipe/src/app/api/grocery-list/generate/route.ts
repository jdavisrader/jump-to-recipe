import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { recipes, groceryLists } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { generateGroceryList, generateGroceryListTitle } from '@/lib/grocery-list-generator';
import { GroceryListGenerationRequest } from '@/types/grocery-list';
import { Recipe, Ingredient, Instruction } from '@/types/recipe';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: GroceryListGenerationRequest = await request.json();
    
    // Validate request body
    if (!body.recipeIds || !Array.isArray(body.recipeIds) || body.recipeIds.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Recipe IDs are required' },
        { status: 400 }
      );
    }

    // Fetch the recipes from the database
    const recipeData = await db
      .select()
      .from(recipes)
      .where(inArray(recipes.id, body.recipeIds));

    if (recipeData.length === 0) {
      return NextResponse.json(
        { error: 'Not Found', message: 'No recipes found with the provided IDs' },
        { status: 404 }
      );
    }

    // Check if user has access to all recipes (either owns them or they're public)
    const unauthorizedRecipes = recipeData.filter(
      recipe => recipe.authorId !== session.user.id && recipe.visibility !== 'public'
    );

    if (unauthorizedRecipes.length > 0) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Access denied to some recipes' },
        { status: 403 }
      );
    }

    // Convert database recipes to Recipe type
    const recipesForGeneration: Recipe[] = recipeData.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients as Ingredient[], // Type assertion for JSONB
      instructions: recipe.instructions as Instruction[], // Type assertion for JSONB
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      tags: recipe.tags || [],
      notes: recipe.notes,
      imageUrl: recipe.imageUrl,
      sourceUrl: recipe.sourceUrl,
      authorId: recipe.authorId,
      visibility: recipe.visibility,
      commentsEnabled: recipe.commentsEnabled,
      viewCount: recipe.viewCount,
      likeCount: recipe.likeCount,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    }));

    // Generate the grocery list
    const groceryItems = generateGroceryList(recipesForGeneration, body.servingAdjustments);
    
    // Generate a title if not provided
    const title = body.title || generateGroceryListTitle(recipesForGeneration);

    // Save the grocery list to the database
    const [newGroceryList] = await db
      .insert(groceryLists)
      .values({
        userId: session.user.id,
        title,
        items: groceryItems,
        generatedFrom: body.recipeIds,
      })
      .returning();

    return NextResponse.json({
      id: newGroceryList.id,
      title: newGroceryList.title,
      items: groceryItems,
      userId: newGroceryList.userId,
      generatedFrom: newGroceryList.generatedFrom,
      createdAt: newGroceryList.createdAt,
      updatedAt: newGroceryList.updatedAt,
    });

  } catch (error) {
    console.error('Error generating grocery list:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Failed to generate grocery list' },
      { status: 500 }
    );
  }
}