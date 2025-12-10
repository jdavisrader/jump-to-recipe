import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, isAdmin } from '@/lib/auth';
import { db } from '@/db';
import { recipes } from '@/db/schema/recipes';
import { users } from '@/db/schema/users';
import { eq, desc } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { performanceMonitor, CACHE_CONFIG } from '@/lib/performance-cache';

/**
 * Recipe with author information for admin list view
 */
interface RecipeWithAuthor {
  id: string;
  title: string;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  visibility: 'public' | 'private';
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  tags: string[] | null;
}

/**
 * Cached function to fetch all recipes with author information
 * Cache revalidates every 60 seconds with performance monitoring
 */
const getCachedRecipesWithAuthors = unstable_cache(
  performanceMonitor.withMonitoring(
    async () => {
      return await db
        .select({
          id: recipes.id,
          title: recipes.title,
          authorId: recipes.authorId,
          authorName: users.name,
          authorEmail: users.email,
          visibility: recipes.visibility,
          createdAt: recipes.createdAt,
          updatedAt: recipes.updatedAt,
          viewCount: recipes.viewCount,
          tags: recipes.tags,
        })
        .from(recipes)
        .leftJoin(users, eq(recipes.authorId, users.id))
        .orderBy(desc(recipes.createdAt));
    },
    'admin-recipes-with-authors'
  ),
  ['admin-recipes-list'],
  CACHE_CONFIG.ADMIN_RECIPES
);

/**
 * GET /api/admin/recipes
 * Fetch all recipes with author information using a left join
 * Requires admin role
 * Uses server-side caching with 60-second revalidation
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    if (!isAdmin(session.user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    // Fetch cached recipes with author information
    const recipesWithAuthors = await getCachedRecipesWithAuthors();

    return NextResponse.json({ recipes: recipesWithAuthors });
  } catch (error) {
    console.error('[API] Error fetching recipes:', error);
    
    // Provide user-friendly error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch recipes. Please try again later.',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
