'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RecipeCard, RecipeSearch, EmptyState } from '@/components/recipes';
import { MyRecipesErrorDisplay } from '@/components/recipes/my-recipes-error-display';
import { GracefulDegradationBanner } from '@/components/recipes/graceful-degradation-banner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundaryWrapper } from '@/components/ui/error-boundary';
import { Plus, Upload, ChefHat, Loader2 } from 'lucide-react';
import { useMyRecipes } from '@/hooks/useMyRecipes';
import type { SearchParams } from '@/components/recipes/recipe-search';

export default function MyRecipesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mainContentRef = useRef<HTMLElement>(null);
  
  const {
    recipes,
    loading,
    error,
    searchError,
    pagination,
    searchInfo,
    loadingMore,
    retryCount,
    gracefulDegradation,
    fetchRecipes,
    handleSearch,
    handleLoadMore,
    handleRetry,
    clearErrors,
  } = useMyRecipes();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/my-recipes');
    }
  }, [status, router]);

  // Parse initial URL parameters and fetch recipes when user is authenticated
  useEffect(() => {
    if (session?.user?.id && status === 'authenticated') {
      // Parse URL parameters to restore search state
      const initialSearchParams: SearchParams = {};
      
      const query = searchParams.get('query');
      if (query) initialSearchParams.query = query;
      
      const tags = searchParams.get('tags');
      if (tags) {
        try {
          initialSearchParams.tags = tags.split(',').map(tag => tag.trim());
        } catch {
          // Ignore parsing errors
        }
      }
      
      const difficulty = searchParams.get('difficulty');
      if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
        initialSearchParams.difficulty = difficulty as 'easy' | 'medium' | 'hard';
      }
      
      const maxCookTime = searchParams.get('maxCookTime');
      if (maxCookTime) {
        const parsed = parseInt(maxCookTime);
        if (!isNaN(parsed)) initialSearchParams.maxCookTime = parsed;
      }
      
      const minCookTime = searchParams.get('minCookTime');
      if (minCookTime) {
        const parsed = parseInt(minCookTime);
        if (!isNaN(parsed)) initialSearchParams.minCookTime = parsed;
      }
      
      const maxPrepTime = searchParams.get('maxPrepTime');
      if (maxPrepTime) {
        const parsed = parseInt(maxPrepTime);
        if (!isNaN(parsed)) initialSearchParams.maxPrepTime = parsed;
      }
      
      const minPrepTime = searchParams.get('minPrepTime');
      if (minPrepTime) {
        const parsed = parseInt(minPrepTime);
        if (!isNaN(parsed)) initialSearchParams.minPrepTime = parsed;
      }
      
      const sortBy = searchParams.get('sortBy');
      if (sortBy && ['newest', 'oldest', 'popular', 'title', 'cookTime', 'prepTime'].includes(sortBy)) {
        initialSearchParams.sortBy = sortBy as SearchParams['sortBy'];
      }
      
      // Fetch recipes with initial parameters
      fetchRecipes(initialSearchParams);
    }
  }, [session?.user?.id, status, fetchRecipes, searchParams]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to main content with Alt+M
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        mainContentRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show loading spinner while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
      {/* Skip to main content link for screen readers */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div className="flex flex-col items-center space-y-4 sm:space-y-6">
        <div className="text-center space-y-2 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">My Recipes</h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            View and manage all the recipes you&apos;ve created
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/recipes/new">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Create Recipe
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/recipes/import">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Import Recipe
            </Link>
          </Button>
        </div>
      </div>

      {/* Graceful Degradation Banner */}
      {gracefulDegradation.showPartialResults && (
        <GracefulDegradationBanner
          message={gracefulDegradation.fallbackMessage}
          disabledFeatures={gracefulDegradation.disableFeatures}
          onDismiss={() => clearErrors()}
        />
      )}

      {/* Search Component */}
      <div>
        <ErrorBoundaryWrapper
          fallback={
            <div className="text-center py-4" role="alert">
              <p className="text-muted-foreground">Search is temporarily unavailable</p>
            </div>
          }
        >
          <RecipeSearch 
            onSearch={handleSearch} 
            isLoading={loading}
            disabled={gracefulDegradation.disableFeatures.includes('search')}
          />
        </ErrorBoundaryWrapper>
      </div>

      {/* Search Results Info */}
      {(searchInfo.hasQuery || pagination.total > 0) && (
        <div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {loading ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <span>
              {searchInfo.hasQuery ? (
                <>
                  Found {pagination.total} recipe{pagination.total !== 1 ? 's' : ''}
                  {searchInfo.query && ` for "${searchInfo.query}"`}
                </>
              ) : (
                <>
                  {pagination.total} recipe{pagination.total !== 1 ? 's' : ''} total
                </>
              )}
            </span>
          )}
          {!loading && pagination.totalPages > 1 && (
            <span className="text-xs">
              Showing {recipes.length} of {pagination.total} recipes
              {pagination.hasNextPage && ' (load more below)'}
            </span>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <MyRecipesErrorDisplay
          error={error}
          onRetry={handleRetry}
          retryCount={retryCount}
          isRetrying={loading}
          variant="full"
        />
      )}

      {/* Search/Pagination Error (less intrusive) */}
      {searchError && !error && (
        <MyRecipesErrorDisplay
          error={searchError}
          onRetry={searchError.retryable ? handleRetry : undefined}
          onDismiss={() => clearErrors()}
          retryCount={retryCount}
          isRetrying={loadingMore}
          showDismiss={true}
          variant="toast"
        />
      )}

      {/* Loading State */}
      {loading && (
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
          role="status"
          aria-label="Loading recipes"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-video w-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" ref={mainContentRef} className="" tabIndex={-1}>
        {!loading && !error && (
          <>
            {recipes.length === 0 ? (
              <EmptyState
                title={searchInfo.hasQuery ? "No recipes found" : "You haven't added any recipes yet"}
                description={
                  searchInfo.hasQuery 
                    ? `No recipes match your search "${searchInfo.query}". Try adjusting your search terms or create a new recipe.`
                    : "Start building your personal recipe collection by creating your first recipe or importing one from a URL."
                }
                actionLabel={searchInfo.hasQuery ? "Create New Recipe" : "Create Your First Recipe"}
                actionHref="/recipes/new"
                icon={<ChefHat className="h-12 w-12 sm:h-16 sm:w-16" />}
              />
            ) : (
              <>
                <ErrorBoundaryWrapper
                  fallback={
                    <div className="text-center py-8" role="alert">
                      <p className="text-muted-foreground">Unable to display recipes at this time</p>
                      <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                        Refresh Page
                      </Button>
                    </div>
                  }
                >
                  <div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
                    role="grid"
                    aria-label="Recipe collection"
                  >
                    {recipes.map((recipe) => (
                      <div key={recipe.id} role="gridcell">
                        <RecipeCard
                          recipe={recipe}
                          showAuthor={false} // Don't show author since it's always the current user
                          showStats={true}
                        />
                      </div>
                    ))}
                  </div>
                </ErrorBoundaryWrapper>

                {/* Load More Button */}
                {pagination.hasNextPage && !gracefulDegradation.disableFeatures.includes('pagination') && (
                  <div className="flex flex-col items-center mt-6 sm:mt-8 space-y-4">
                    {searchError && searchError.retryable ? (
                      <MyRecipesErrorDisplay
                        error={searchError}
                        onRetry={handleLoadMore}
                        retryCount={retryCount}
                        isRetrying={loadingMore}
                        variant="inline"
                      />
                    ) : (
                      <Button
                        onClick={handleLoadMore}
                        variant="outline"
                        disabled={loadingMore || gracefulDegradation.disableFeatures.includes('pagination')}
                        className="min-w-32"
                        aria-describedby="load-more-description"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          'Load More Recipes'
                        )}
                      </Button>
                    )}
                    <div id="load-more-description" className="sr-only">
                      Load more recipes from your collection
                    </div>
                  </div>
                )}
                
                {/* End of results indicator */}
                {!pagination.hasNextPage && recipes.length > 0 && (
                  <div className="text-center mt-6 sm:mt-8" role="status">
                    <p className="text-sm text-muted-foreground">
                      You&apos;ve reached the end of your recipes
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}