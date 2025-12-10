import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { recipes } from '@/db/schema/recipes';
import { users } from '@/db/schema/users';
import { eq, desc } from 'drizzle-orm';
import type { RecipeWithAuthor } from '@/types/admin';
import { RecipeListClient } from './recipe-list-client';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb';
import { unstable_cache } from 'next/cache';
import { performanceMonitor, CACHE_CONFIG } from '@/lib/performance-cache';

/**
 * Cached function to fetch all recipes with author information for admin page
 * Cache revalidates every 60 seconds with performance monitoring
 */
const getCachedRecipesForAdmin = unstable_cache(
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
    'admin-recipes-page-query'
  ),
  ['admin-recipes-page'],
  CACHE_CONFIG.ADMIN_RECIPES
);

// Loading component for Suspense fallback
function RecipeListLoading() {
  return (
    <div className="space-y-4">
      {/* Search and Filter Controls Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-[200px]" />
        <Skeleton className="h-10 w-full sm:w-[180px]" />
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header */}
            <div className="bg-muted/50 p-4 flex gap-4">
              <Skeleton className="h-6 flex-1" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-24" />
            </div>
            {/* Rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border-t p-4 flex gap-4">
                <Skeleton className="h-6 flex-1" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results count skeleton */}
      <Skeleton className="h-5 w-48" />
    </div>
  );
}

export default async function AdminRecipesPage() {
  const session = await getServerSession(authOptions);
  
  // Authorization check (defense in depth)
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/?unauthorized=1');
  }

  try {
    // Fetch cached recipes with author information using database query with left join
    const recipesWithAuthors = await getCachedRecipesForAdmin();

    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <AdminBreadcrumb />
          <div>
            <h1 className="text-3xl font-bold">Recipe Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage all recipes, edit content, and reassign ownership
            </p>
          </div>
          <Suspense fallback={<RecipeListLoading />}>
            <RecipeListClient recipes={recipesWithAuthors} />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching recipes:', error);
    
    // User-friendly error message
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <AdminBreadcrumb />
          <div>
            <h1 className="text-3xl font-bold">Recipe Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage all recipes, edit content, and reassign ownership
            </p>
          </div>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <p className="text-destructive font-medium">
              Failed to load recipes
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              An error occurred while fetching recipes. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
