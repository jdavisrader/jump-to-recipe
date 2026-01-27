/**
 * Migration API - Recipe Import Endpoint
 * 
 * This endpoint is specifically for the migration script to import recipes
 * from the legacy system. It bypasses normal authentication but requires
 * a migration token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    // Check migration token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== process.env.MIGRATION_AUTH_TOKEN) {
      console.error('[Migration API] Unauthorized - Invalid token');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid migration token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[Migration API] Received recipe:', {
      id: body.id,
      title: body.title,
      authorId: body.authorId,
      ingredientCount: body.ingredients?.length,
      instructionCount: body.instructions?.length,
    });
    
    // Validate required fields
    if (!body.title || !body.authorId) {
      console.error('[Migration API] Missing required fields:', { title: !!body.title, authorId: !!body.authorId });
      return NextResponse.json(
        { error: 'Missing required fields: title, authorId' },
        { status: 400 }
      );
    }

    // Validate ingredients and instructions
    if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      console.error('[Migration API] Invalid ingredients:', { 
        isArray: Array.isArray(body.ingredients), 
        length: body.ingredients?.length 
      });
      return NextResponse.json(
        { error: 'Recipe must have at least one ingredient' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.instructions) || body.instructions.length === 0) {
      console.error('[Migration API] Invalid instructions:', { 
        isArray: Array.isArray(body.instructions), 
        length: body.instructions?.length 
      });
      return NextResponse.json(
        { error: 'Recipe must have at least one instruction' },
        { status: 400 }
      );
    }

    console.log('[Migration API] Inserting recipe into database...');
    
    // Create recipe with ingredients and instructions as JSONB
    const [newRecipe] = await db.insert(recipes).values({
      id: body.id, // Use the UUID from migration
      title: body.title,
      description: body.description || null,
      ingredients: body.ingredients, // Store as JSONB array
      instructions: body.instructions, // Store as JSONB array
      ingredientSections: body.ingredientSections || null,
      instructionSections: body.instructionSections || null,
      prepTime: body.prepTime || null,
      cookTime: body.cookTime || null,
      servings: body.servings || null,
      difficulty: body.difficulty || null,
      tags: body.tags || [],
      notes: body.notes || null,
      imageUrl: body.imageUrl || null,
      sourceUrl: body.sourceUrl || null,
      authorId: body.authorId,
      visibility: body.visibility || 'private',
      commentsEnabled: body.commentsEnabled ?? true,
      viewCount: body.viewCount || 0,
      likeCount: body.likeCount || 0,
      createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
      updatedAt: body.updatedAt ? new Date(body.updatedAt) : new Date(),
    }).returning();

    console.log('[Migration API] Recipe inserted successfully:', newRecipe.id);

    return NextResponse.json({
      id: newRecipe.id,
      recipe: {
        id: newRecipe.id,
        title: newRecipe.title,
      },
    });

  } catch (error) {
    console.error('[Migration API] ERROR:', error);
    console.error('[Migration API] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Failed to import recipe', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
