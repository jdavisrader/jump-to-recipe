import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema/recipes';
import { users } from '@/db/schema/users';
import { recipeFilterSchema } from '@/lib/validations/recipe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { and, desc, asc, eq, lte, gte, sql } from 'drizzle-orm';

/**
 * GET /api/recipes/search
 * 
 * Advanced search endpoint with full-text search capabilities
 * Supports searching in title, description, ingredients, and instructions
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
                queryParams = {
                    ...queryParams,
                    tags: Array.isArray(parsedTags) ? parsedTags : [parsedTags]
                };
            } catch {
                // If JSON parsing fails, treat as comma-separated string
                queryParams = {
                    ...queryParams,
                    tags: (queryParams.tags as string).split(',').map(tag => tag.trim())
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
            sortBy = 'newest',
            page = 1,
            limit = 10
        } = validationResult.data;

        // Get current user from session
        const session = await getServerSession(authOptions);
        const currentUserId = session?.user?.id;

        // Build where conditions
        const whereConditions = [];

        // Filter by visibility
        if (currentUserId) {
            whereConditions.push(
                sql`(${recipes.visibility} = 'public' OR ${recipes.authorId} = ${currentUserId})`
            );
        } else {
            whereConditions.push(eq(recipes.visibility, 'public'));
        }

        // Enhanced text search if query is provided
        if (query) {
            const searchTerm = `%${query.toLowerCase()}%`;
            whereConditions.push(
                sql`(
                    LOWER(${recipes.title}) LIKE ${searchTerm} OR 
                    LOWER(${recipes.description}) LIKE ${searchTerm} OR 
                    ${recipes.tags} @> ARRAY[${query.toLowerCase()}]::text[] OR
                    LOWER(${recipes.ingredients}::text) LIKE ${searchTerm} OR
                    LOWER(${recipes.instructions}::text) LIKE ${searchTerm}
                )`
            );
        }

        // Filter by tags if provided
        if (tags && tags.length > 0) {
            const tagsArray = tags.map(tag => String(tag).toLowerCase());
            whereConditions.push(sql`${recipes.tags} && ${tagsArray}::text[]`);
        }

        // Filter by difficulty if provided
        if (difficulty) {
            whereConditions.push(eq(recipes.difficulty, difficulty));
        }

        // Filter by cook time range
        if (maxCookTime) {
            whereConditions.push(lte(recipes.cookTime, maxCookTime));
        }
        if (minCookTime) {
            whereConditions.push(gte(recipes.cookTime, minCookTime));
        }

        // Filter by prep time range
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

        // Determine sort order with relevance scoring for search queries
        let orderBy;
        if (query && sortBy === 'newest') {
            // For search queries, prioritize relevance
            orderBy = [
                sql`CASE 
                    WHEN LOWER(${recipes.title}) LIKE ${`%${query.toLowerCase()}%`} THEN 1
                    WHEN ${recipes.tags} @> ARRAY[${query.toLowerCase()}]::text[] THEN 2
                    WHEN LOWER(${recipes.description}) LIKE ${`%${query.toLowerCase()}%`} THEN 3
                    ELSE 4
                END`,
                desc(recipes.viewCount),
                desc(recipes.createdAt)
            ];
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

        // Execute query with joins to get author information
        const recipeResults = await db
            .select({
                id: recipes.id,
                title: recipes.title,
                description: recipes.description,
                ingredients: recipes.ingredients,
                instructions: recipes.instructions,
                prepTime: recipes.prepTime,
                cookTime: recipes.cookTime,
                servings: recipes.servings,
                difficulty: recipes.difficulty,
                tags: recipes.tags,
                notes: recipes.notes,
                imageUrl: recipes.imageUrl,
                sourceUrl: recipes.sourceUrl,
                authorId: recipes.authorId,
                visibility: recipes.visibility,
                viewCount: recipes.viewCount,
                likeCount: recipes.likeCount,
                createdAt: recipes.createdAt,
                updatedAt: recipes.updatedAt,
                authorName: users.name,
            })
            .from(recipes)
            .leftJoin(users, eq(recipes.authorId, users.id))
            .where(and(...whereConditions))
            .orderBy(...orderBy)
            .limit(limit)
            .offset(offset);

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
            searchInfo: {
                query,
                hasQuery: !!query,
                sortBy,
                appliedFilters: {
                    tags: tags?.length || 0,
                    difficulty: !!difficulty,
                    cookTimeRange: !!(minCookTime || maxCookTime),
                    prepTimeRange: !!(minPrepTime || maxPrepTime),
                    author: !!authorId,
                }
            }
        });
    } catch (error) {
        console.error('Error searching recipes:', error);
        return NextResponse.json(
            { error: 'Failed to search recipes' },
            { status: 500 }
        );
    }
}