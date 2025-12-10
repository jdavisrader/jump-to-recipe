import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema/recipes';
import { users } from '@/db/schema/users';
import { updateRecipeSchema } from '@/lib/validations/recipe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get current user from session
        const session = await getServerSession(authOptions);
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
 * Admins can transfer ownership by including authorId in the request
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get current user from session
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { 
                    error: 'Authentication required',
                    message: 'You must be logged in to update a recipe.'
                },
                { status: 401 }
            );
        }

        // Find the recipe to check ownership
        const existingRecipe = await db.query.recipes.findFirst({
            where: eq(recipes.id, id),
        });

        if (!existingRecipe) {
            return NextResponse.json(
                { 
                    error: 'Recipe not found',
                    message: 'The recipe you are trying to update does not exist.'
                },
                { status: 404 }
            );
        }

        // Check if user is authorized to update this recipe
        const isAuthor = existingRecipe.authorId === session.user.id;
        const isAdmin = session.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return NextResponse.json(
                { 
                    error: 'Not authorized to update this recipe',
                    message: 'You can only edit your own recipes.'
                },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await req.json();

        // Check if ownership is being changed
        const isOwnershipChange = body.authorId !== undefined && body.authorId !== existingRecipe.authorId;

        if (isOwnershipChange) {
            // Only admins can change recipe ownership
            if (!isAdmin) {
                return NextResponse.json(
                    { 
                        error: 'Only admins can change recipe ownership',
                        message: 'You do not have permission to transfer recipe ownership.'
                    },
                    { status: 403 }
                );
            }

            // Validate that the new owner ID is provided and not null
            if (!body.authorId) {
                return NextResponse.json(
                    { 
                        error: 'Invalid owner ID: Owner cannot be empty',
                        message: 'Please select a valid owner for the recipe.'
                    },
                    { status: 400 }
                );
            }

            // Validate that the new owner exists in the database
            const newOwner = await db.query.users.findFirst({
                where: eq(users.id, body.authorId),
            });

            if (!newOwner) {
                return NextResponse.json(
                    { 
                        error: 'Invalid owner ID: User does not exist',
                        message: 'The selected user does not exist in the system.'
                    },
                    { status: 400 }
                );
            }
        }

        // Validate recipe data (excluding authorId which is handled separately)
        const validationResult = updateRecipeSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { 
                    error: 'Invalid recipe data',
                    message: 'The recipe data provided is invalid. Please check your input.',
                    details: validationResult.error.flatten()
                },
                { status: 400 }
            );
        }

        // Prepare update data
        const updateData: any = {
            ...validationResult.data,
            updatedAt: new Date(),
        };

        // Include authorId in update if ownership is being changed
        if (isOwnershipChange) {
            updateData.authorId = body.authorId;
        }

        // Update recipe
        const updatedRecipe = await db.update(recipes)
            .set(updateData)
            .where(eq(recipes.id, id))
            .returning();

        return NextResponse.json({
            ...updatedRecipe[0],
            message: isOwnershipChange 
                ? 'Recipe updated and ownership transferred successfully'
                : 'Recipe updated successfully'
        });
    } catch (error) {
        console.error('Error updating recipe:', error);
        
        // Provide more specific error messages based on error type
        if (error instanceof Error) {
            if (error.message.includes('database')) {
                return NextResponse.json(
                    { 
                        error: 'Database error',
                        message: 'A database error occurred. Please try again later.'
                    },
                    { status: 500 }
                );
            }
            if (error.message.includes('network')) {
                return NextResponse.json(
                    { 
                        error: 'Network error',
                        message: 'A network error occurred. Please check your connection and try again.'
                    },
                    { status: 503 }
                );
            }
        }
        
        return NextResponse.json(
            { 
                error: 'Failed to update recipe',
                message: 'An unexpected error occurred while updating the recipe. Please try again.'
            },
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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get current user from session
        const session = await getServerSession(authOptions);

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