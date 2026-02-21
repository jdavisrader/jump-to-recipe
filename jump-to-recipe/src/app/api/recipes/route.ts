import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema/recipes';
import { recipeFilterSchema } from '@/lib/validations/recipe';
import { 
  validateRecipeStrict, 
  validateUniqueSectionIds, 
  validateUniqueItemIds 
} from '@/lib/validations/recipe-sections';
import { validateAndFixRecipePositions } from '@/lib/section-position-utils';
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

        // Convert string parameters to appropriate types
        const processedParams = {
            ...queryParams,
            page: queryParams.page ? parseInt(queryParams.page as string) : 1,
            limit: queryParams.limit ? parseInt(queryParams.limit as string) : 10,
            maxCookTime: queryParams.maxCookTime ? parseInt(queryParams.maxCookTime as string) : undefined,
            minCookTime: queryParams.minCookTime ? parseInt(queryParams.minCookTime as string) : undefined,
            maxPrepTime: queryParams.maxPrepTime ? parseInt(queryParams.maxPrepTime as string) : undefined,
            minPrepTime: queryParams.minPrepTime ? parseInt(queryParams.minPrepTime as string) : undefined,
            randomSeed: queryParams.randomSeed ? parseFloat(queryParams.randomSeed as string) : undefined,
        };

        // Parse and validate query parameters
        const validationResult = recipeFilterSchema.safeParse(processedParams);

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
            sortBy = 'random',
            randomSeed,
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
        
        // For random sorting with pagination, use a deterministic hash-based approach
        if (sortBy === 'random') {
            // Use provided seed or generate one based on current date (changes daily)
            const seed = randomSeed ?? (Math.floor(Date.now() / 86400000) % 1000) / 1000;
            
            // Use MD5 hash of (recipe_id + seed) for deterministic random ordering
            // This ensures the same order across pagination requests with the same seed
            orderBy = [sql`md5(${recipes.id}::text || ${seed.toString()})::uuid`];
        } else {
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
 * Creates a new recipe with strict validation
 * Requires authentication (handled on client side)
 * Enforces unique IDs and resolves position conflicts
 * 
 * Position Validation (Requirement 7.1):
 * - All ingredients must have a valid position property (non-negative integer)
 * - All instructions must have a valid position property (non-negative integer)
 * - Position conflicts are auto-corrected to sequential values
 * - Missing positions will result in validation error (400 Bad Request)
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

        // Validate unique section IDs (Requirement 12.4)
        if (!validateUniqueSectionIds(body)) {
            console.error('❌ Duplicate section IDs detected');
            return NextResponse.json(
                { 
                    error: 'Validation failed',
                    details: [{
                        path: 'sections',
                        message: 'Duplicate section IDs detected. Each section must have a unique ID.',
                    }],
                },
                { status: 400 }
            );
        }

        // Validate unique item IDs (Requirement 12.4)
        if (!validateUniqueItemIds(body)) {
            console.error('❌ Duplicate item IDs detected');
            return NextResponse.json(
                { 
                    error: 'Validation failed',
                    details: [{
                        path: 'items',
                        message: 'Duplicate item IDs detected. Each ingredient and instruction must have a unique ID.',
                    }],
                },
                { status: 400 }
            );
        }

        // Validate and fix positions (Requirement 12.3)
        const processedBody = { ...body };
        
        if (body.ingredientSections && body.ingredientSections.length > 0) {
            const ingredientResult = validateAndFixRecipePositions(body.ingredientSections);
            if (!ingredientResult.isValid) {
                console.warn('⚠️ Position conflicts detected in ingredient sections, auto-fixing:', ingredientResult.errors);
            }
            processedBody.ingredientSections = ingredientResult.fixedSections;
        }

        if (body.instructionSections && body.instructionSections.length > 0) {
            const instructionResult = validateAndFixRecipePositions(body.instructionSections);
            if (!instructionResult.isValid) {
                console.warn('⚠️ Position conflicts detected in instruction sections, auto-fixing:', instructionResult.errors);
            }
            processedBody.instructionSections = instructionResult.fixedSections;
        }

        // Perform strict validation using the hardened schema
        const validationResult = validateRecipeStrict(processedBody);

        if (!validationResult.success) {
            console.error('❌ Recipe validation failed:', validationResult.errors);
            
            // Return 400 Bad Request with structured error details
            return NextResponse.json(
                { 
                    error: 'Validation failed',
                    details: validationResult.errors,
                },
                { status: 400 }
            );
        }

        // Validation passed - create new recipe with validated data
        const newRecipe = await db.insert(recipes).values(validationResult.data).returning();

        console.log('✅ Recipe created successfully:');
        console.log('- ID:', newRecipe[0].id);
        console.log('- Title:', newRecipe[0].title);
        console.log('- Has ingredient sections:', !!newRecipe[0].ingredientSections);
        console.log('- Has instruction sections:', !!newRecipe[0].instructionSections);

        return NextResponse.json(newRecipe[0], { status: 201 });
    } catch (error) {
        console.error('❌ Error creating recipe:', error);
        
        // Log the full error for debugging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
            });
        }
        
        return NextResponse.json(
            { error: 'Failed to create recipe' },
            { status: 500 }
        );
    }
}