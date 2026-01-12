import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema/recipes';
import { recipeFilterSchema, createRecipeSchema } from '@/lib/validations/recipe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { and, desc, asc, eq, lte, gte, sql } from 'drizzle-orm';

/**
 * GET /api/recipes
 * 
 * Retrieves a paginated list of recipes with optional filtering
 * Public recipes are visible to all users
 * Private recipes are only visible to their authors
 */
export async function GET(req: NextRequest) {
    try {
        // Get query parameters
        const url = new URL(req.url);
        let queryParams: Record<string, string | string[]> = Object.fromEntries(url.searchParams.entries());

        // Parse tags as array if present
        if (queryParams.tags) {
            try {
                const parsedTags = JSON.parse(queryParams.tags as string);
                // Create a new object with the parsed tags to avoid type issues
                queryParams = {
                    ...queryParams,
                    tags: Array.isArray(parsedTags) ? parsedTags : [parsedTags]
                };
            } catch {
                // Create a new object with the split tags to avoid type issues
                queryParams = {
                    ...queryParams,
                    tags: (queryParams.tags as string).split(',')
                };
            }
        }

        // Parse and validate query parameters
        const validationResult = recipeFilterSchema.safeParse(queryParams);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Invalid query parameters', details: validationResult.error.flatten() },
                { status: 400 }
            );
        }

        const {
            query,
            tags,
            difficulty,
            maxCookTime,
            minCookTime,
            maxPrepTime,
            minPrepTime,
            authorId,
            sortBy = 'newest',
            page = 1,
            limit = 10
        } = validationResult.data;

        // Get current user from session
        const session = await getServerSession(authOptions);
        const currentUserId = session?.user?.id;

        // Build where conditions
        const whereConditions = [];

        // Filter by visibility - users can see public recipes or their own private recipes
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

        // Apply text search if query is provided
        if (query) {
            whereConditions.push(
                sql`(${recipes.title} ILIKE ${`%${query}%`} OR ${recipes.description} ILIKE ${`%${query}%`} OR ${recipes.tags} @> ARRAY[${query}]::text[])`
            );
        }

        // Filter by tags if provided
        if (tags && tags.length > 0) {
            // Convert tags array to a string array for PostgreSQL
            const tagsArray = tags.map(tag => String(tag));
            whereConditions.push(sql`${recipes.tags} && ${tagsArray}::text[]`);
        }

        // Filter by difficulty if provided
        if (difficulty) {
            whereConditions.push(eq(recipes.difficulty, difficulty));
        }

        // Filter by cook time range if provided
        if (maxCookTime) {
            whereConditions.push(lte(recipes.cookTime, maxCookTime));
        }
        if (minCookTime) {
            whereConditions.push(gte(recipes.cookTime, minCookTime));
        }

        // Filter by prep time range if provided
        if (maxPrepTime) {
            whereConditions.push(lte(recipes.prepTime, maxPrepTime));
        }
        if (minPrepTime) {
            whereConditions.push(gte(recipes.prepTime, minPrepTime));
        }

        // Filter by author if provided
        if (authorId) {
            whereConditions.push(eq(recipes.authorId, authorId));
        }

        // Determine sort order
        let orderBy;
        switch (sortBy) {
            case 'oldest':
                orderBy = [asc(recipes.createdAt)];
                break;
            case 'popular':
                orderBy = [desc(recipes.viewCount), desc(recipes.likeCount), desc(recipes.createdAt)];
                break;
            case 'title':
                orderBy = [asc(recipes.title)];
                break;
            case 'cookTime':
                orderBy = [asc(recipes.cookTime), asc(recipes.prepTime)];
                break;
            case 'prepTime':
                orderBy = [asc(recipes.prepTime), asc(recipes.cookTime)];
                break;
            case 'newest':
            default:
                orderBy = [desc(recipes.createdAt)];
                break;
        }

        // Calculate pagination
        const offset = (page - 1) * limit;

        // Execute query with all filters
        const recipeResults = await db.query.recipes.findMany({
            where: and(...whereConditions),
            orderBy: orderBy,
            limit: limit,
            offset: offset,
        });

        // Count total matching recipes for pagination info
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(recipes)
            .where(and(...whereConditions));

        const totalRecipes = countResult[0]?.count || 0;
        const totalPages = Math.ceil(totalRecipes / limit);

        return NextResponse.json({
            recipes: recipeResults,
            pagination: {
                total: totalRecipes,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recipes' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/recipes
 * 
 * Creates a new recipe
 * Requires authentication (handled on client side)
 */
export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json();

        // Log the incoming data for debugging
        console.log('📝 Received recipe data for creation:');
        console.log('- Title:', body.title);
        console.log('- Ingredients count:', body.ingredients?.length || 0);
        console.log('- Instructions count:', body.instructions?.length || 0);
        console.log('- Ingredient sections:', body.ingredientSections ? `${body.ingredientSections.length} sections` : 'none');
        console.log('- Instruction sections:', body.instructionSections ? `${body.instructionSections.length} sections` : 'none');

        // Validate recipe data
        const validationResult = createRecipeSchema.safeParse(body);

        if (!validationResult.success) {
            console.log('Validation failed:', validationResult.error.issues);
            return NextResponse.json(
                { 
                    error: 'Invalid recipe data', 
                    details: validationResult.error.issues,
                    receivedData: body 
                },
                { status: 400 }
            );
        }

        // Create new recipe
        const newRecipe = await db.insert(recipes).values(validationResult.data).returning();

        console.log('✅ Recipe created successfully:');
        console.log('- ID:', newRecipe[0].id);
        console.log('- Title:', newRecipe[0].title);
        console.log('- Has ingredient sections:', !!newRecipe[0].ingredientSections);
        console.log('- Has instruction sections:', !!newRecipe[0].instructionSections);

        return NextResponse.json(newRecipe[0], { status: 201 });
    } catch (error) {
        console.error('Error creating recipe:', error);
        return NextResponse.json(
            { error: 'Failed to create recipe' },
            { status: 500 }
        );
    }
}