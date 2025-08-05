import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { comments, recipes, users } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for creating comments
const createCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  isPrivateNote: z.boolean().optional().default(false),
});

// GET /api/recipes/[id]/comments - Get comments for a recipe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: recipeId } = await params;

    // Get the recipe to check if it exists and get author info
    const recipe = await db
      .select({
        id: recipes.id,
        authorId: recipes.authorId,
        commentsEnabled: recipes.commentsEnabled,
        visibility: recipes.visibility,
      })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (recipe.length === 0) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    const recipeData = recipe[0];

    // Build the query conditions based on recipe settings and user permissions
    let whereCondition;

    if (session?.user?.id) {
      // If user is logged in, show:
      // 1. Public comments (isPrivateNote = false) if comments are enabled
      // 2. Their own private notes (isPrivateNote = true AND userId = current user)
      
      const conditions = [];
      
      // Add public comments if comments are enabled
      if (recipeData.commentsEnabled) {
        conditions.push(eq(comments.isPrivateNote, false));
      }
      
      // Always add user's own private notes
      conditions.push(
        and(
          eq(comments.isPrivateNote, true),
          eq(comments.userId, session.user.id)
        )
      );
      
      whereCondition = and(
        eq(comments.recipeId, recipeId),
        or(...conditions)
      );
    } else {
      // If user is not logged in, only show public comments if enabled
      if (!recipeData.commentsEnabled) {
        // No comments to show if comments are disabled and user is not logged in
        return NextResponse.json({
          comments: [],
          total: 0,
        });
      }
      
      whereCondition = and(
        eq(comments.recipeId, recipeId),
        eq(comments.isPrivateNote, false)
      );
    }

    // Get comments with user information
    const commentsWithUsers = await db
      .select({
        id: comments.id,
        recipeId: comments.recipeId,
        userId: comments.userId,
        content: comments.content,
        isPrivateNote: comments.isPrivateNote,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(whereCondition)
      .orderBy(desc(comments.createdAt));

    return NextResponse.json({
      comments: commentsWithUsers,
      total: commentsWithUsers.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/recipes/[id]/comments - Create a new comment or note
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: recipeId } = await params;
    const body = await request.json();
    
    // Validate request body
    const validationResult = createCommentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { content, isPrivateNote } = validationResult.data;

    // Check if recipe exists
    const recipe = await db
      .select({
        id: recipes.id,
        authorId: recipes.authorId,
        commentsEnabled: recipes.commentsEnabled,
        visibility: recipes.visibility,
      })
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (recipe.length === 0) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    const recipeData = recipe[0];

    // Check permissions for public comments
    if (!isPrivateNote) {
      // For public comments, check if comments are enabled
      if (!recipeData.commentsEnabled) {
        return NextResponse.json(
          { error: 'Comments are disabled for this recipe' },
          { status: 403 }
        );
      }
      
      // For public comments, recipe must be public or user must be the author
      if (recipeData.visibility === 'private' && recipeData.authorId !== session.user.id) {
        return NextResponse.json(
          { error: 'Cannot comment on private recipes' },
          { status: 403 }
        );
      }
    }

    // Create the comment/note
    const newComment = await db
      .insert(comments)
      .values({
        recipeId,
        userId: session.user.id,
        content,
        isPrivateNote,
      })
      .returning();

    // Get the comment with user information
    const commentWithUser = await db
      .select({
        id: comments.id,
        recipeId: comments.recipeId,
        userId: comments.userId,
        content: comments.content,
        isPrivateNote: comments.isPrivateNote,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, newComment[0].id))
      .limit(1);

    return NextResponse.json({
      comment: commentWithUser[0],
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}