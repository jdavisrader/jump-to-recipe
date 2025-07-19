import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema/recipes';
import { updateRecipeSchema } from '@/lib/validations/recipe';
import { getServerSession } from 'next-auth';
import { hasRole } from '@/lib/auth';
import { and, eq, sql } from 'drizzle-orm';

/**
 * GET /api/recipes/[id]
 * 
 * Retrieves a single recipe by ID
 * Public recipes are visible to all users
 * Private recipes are only visible to their authors
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Get current user from session
        const session = await getServerSession();
        const currentUserId = session?.user?.id;

        // Build where conditions
        const whereConditions = [eq(recipes.id, id)];

        // Add visibility check - users can see public recipes or their own private recipes
        if (currentUserId) {
            // For authenticated users, they can see public recipes or their own private recipes
            // Use a more explicit approach to avoid type issues
            whereConditions.push(
                sql`(${recipes.visibility} = 'public' OR ${recipes.authorId} = ${currentUserId})`
            );
        } else {
            // Non-authenticated users can only see public recipes
            whereConditions.push(eq(recipes.visibility, 'public'));
        }

        // Find recipe with visibility check
        const recipe = await db.query.recipes.findFirst({
            where: and(...whereConditions),
        });

        if (!recipe) {
            return NextResponse.json(
                { error: 'Recipe not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(recipe);
    } catch (error) {
        console.error('Error fetching recipe:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recipe' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/recipes/[id]
 * 
 * Updates an existing recipe
 * Requires authentication
 * Only the author or admin can update a recipe
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Get current user from session
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Find the recipe to check ownership
        const existingRecipe = await db.query.recipes.findFirst({
            where: eq(recipes.id, id),
        });

        if (!existingRecipe) {
            return NextResponse.json(
                { error: 'Recipe not found' },
                { status: 404 }
            );
        }

        // Check if user is authorized to update this recipe
        const isAuthor = existingRecipe.authorId === session.user.id;
        const isAdmin = session.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return NextResponse.json(
                { error: 'Not authorized to update this recipe' },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await req.json();

        // Validate recipe data
        const validationResult = updateRecipeSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid recipe data', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        // Update recipe
        const updatedRecipe = await db.update(recipes)
            .set({
                ...validationResult.data,
                updatedAt: new Date(),
            })
            .where(eq(recipes.id, id))
            .returning();

        return NextResponse.json(updatedRecipe[0]);
    } catch (error) {
        console.error('Error updating recipe:', error);
        return NextResponse.json(
            { error: 'Failed to update recipe' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/recipes/[id]
 * 
 * Deletes a recipe
 * Requires authentication
 * Only the author or admin can delete a recipe
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        // Get current user from session
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Find the recipe to check ownership
        const existingRecipe = await db.query.recipes.findFirst({
            where: eq(recipes.id, id),
        });

        if (!existingRecipe) {
            return NextResponse.json(
                { error: 'Recipe not found' },
                { status: 404 }
            );
        }

        // Check if user is authorized to delete this recipe
        const isAuthor = existingRecipe.authorId === session.user.id;
        const isAdmin = session.user.role === 'admin';
        const isElevated = hasRole(session.user.role, 'elevated');

        if (!isAuthor && !isAdmin && !isElevated) {
            return NextResponse.json(
                { error: 'Not authorized to delete this recipe' },
                { status: 403 }
            );
        }

        // Delete recipe
        await db.delete(recipes).where(eq(recipes.id, id));

        return NextResponse.json(
            { message: 'Recipe deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error deleting recipe:', error);
        return NextResponse.json(
            { error: 'Failed to delete recipe' },
            { status: 500 }
        );
    }
}