import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { recipes } from '@/db/schema/recipes';
import { users } from '@/db/schema/users';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { and, desc, eq, sql, gte } from 'drizzle-orm';

/**
 * GET /api/recipes/discover
 * 
 * Returns curated recipe collections for the home feed:
 * - Recently added recipes
 * - Popular recipes
 * - Trending recipes (popular in the last week)
 * - Recommended recipes (based on user preferences if authenticated)
 * 
 * Query parameters:
 * - section: 'all' | 'recent' | 'popular' | 'trending' | 'recommended'
 * - limit: number of recipes per section (default: 12, max: 50)
 * - offset: offset for pagination (default: 0)
 */
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const section = url.searchParams.get('section') || 'all';
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);
        const offset = Math.max(parseInt(url.searchParams.get('offset') || '0'), 0);

        // Get current user from session
        const session = await getServerSession(authOptions);
        const currentUserId = session?.user?.id;

        // Base where condition for visibility
        const baseWhere = currentUserId 
            ? sql`(${recipes.visibility} = 'public' OR ${recipes.authorId} = ${currentUserId})`
            : eq(recipes.visibility, 'public');

        interface RecipeWithAuthor {
            id: string;
            title: string;
            description: string | null;
            ingredients: unknown;
            instructions: unknown;
            prepTime: number | null;
            cookTime: number | null;
            servings: number | null;
            difficulty: string | null;
            tags: string[] | null;
            imageUrl: string | null;
            authorId: string | null;
            visibility: string;
            viewCount: number;
            likeCount: number;
            createdAt: Date;
            updatedAt: Date;
            authorName: string | null;
        }

        const result: Record<string, RecipeWithAuthor[]> = {};

        if (section === 'all' || section === 'recent') {
            // Recently added recipes
            const recentRecipes = await db
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
                    imageUrl: recipes.imageUrl,
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
                .where(baseWhere)
                .orderBy(desc(recipes.createdAt))
                .limit(limit)
                .offset(offset);

            result.recent = recentRecipes;
        }

        if (section === 'all' || section === 'popular') {
            // Popular recipes (by view count and likes)
            const popularRecipes = await db
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
                    imageUrl: recipes.imageUrl,
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
                .where(and(
                    baseWhere,
                    sql`${recipes.viewCount} > 0`
                ))
                .orderBy(desc(recipes.viewCount), desc(recipes.likeCount), desc(recipes.createdAt))
                .limit(limit)
                .offset(offset);

            result.popular = popularRecipes;
        }

        if (section === 'all' || section === 'trending') {
            // Trending recipes (popular in the last week)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const trendingRecipes = await db
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
                    imageUrl: recipes.imageUrl,
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
                .where(and(
                    baseWhere,
                    gte(recipes.createdAt, oneWeekAgo)
                ))
                .orderBy(desc(recipes.viewCount), desc(recipes.likeCount), desc(recipes.createdAt))
                .limit(limit)
                .offset(offset);

            result.trending = trendingRecipes;
        }

        if (section === 'all' || section === 'recommended') {
            // Recommended recipes (basic recommendation logic)
            let recommendedRecipes;

            if (currentUserId) {
                // For authenticated users, get recipes with similar tags to their own recipes
                const userRecipes = await db
                    .select({ tags: recipes.tags })
                    .from(recipes)
                    .where(eq(recipes.authorId, currentUserId))
                    .limit(10);

                // Extract unique tags from user's recipes
                const userTags = new Set<string>();
                userRecipes.forEach(recipe => {
                    if (recipe.tags) {
                        recipe.tags.forEach(tag => userTags.add(tag.toLowerCase()));
                    }
                });

                if (userTags.size > 0) {
                    const userTagsArray = Array.from(userTags);
                    recommendedRecipes = await db
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
                            imageUrl: recipes.imageUrl,
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
                        .where(and(
                            baseWhere,
                            sql`${recipes.authorId} != ${currentUserId}`,
                            sql`${recipes.tags} && ${userTagsArray}::text[]`
                        ))
                        .orderBy(desc(recipes.viewCount), desc(recipes.createdAt))
                        .limit(limit)
                        .offset(offset);
                }
            }

            // Fallback to popular recipes if no personalized recommendations
            if (!recommendedRecipes || recommendedRecipes.length === 0) {
                recommendedRecipes = await db
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
                        imageUrl: recipes.imageUrl,
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
                    .where(baseWhere)
                    .orderBy(desc(recipes.viewCount), desc(recipes.likeCount))
                    .limit(limit)
                    .offset(offset);
            }

            result.recommended = recommendedRecipes;
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching discovery recipes:', error);
        return NextResponse.json(
            { error: 'Failed to fetch discovery recipes' },
            { status: 500 }
        );
    }
}