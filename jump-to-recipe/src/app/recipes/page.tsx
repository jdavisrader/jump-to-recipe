'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RecipeCard, RecipeSearch } from '@/components/recipes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Upload, Globe, Loader2 } from 'lucide-react';
import type { Recipe } from '@/types/recipe';
import type { SearchParams } from '@/components/recipes/recipe-search';

interface RecipeWithAuthor extends Recipe {
  authorName?: string;
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInfo, setSearchInfo] = useState({
    query: '',
    hasQuery: false,
    sortBy: 'newest',
    appliedFilters: {
      tags: 0,
      difficulty: false,
      cookTimeRange: false,
      prepTimeRange: false,
      author: false,
    }
  });

  const fetchRecipes = async (searchParams: SearchParams = {}, append = false) => {
    try {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();

      // Add search parameters
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            params.set(key, JSON.stringify(value));
          } else {
            params.set(key, value.toString());
          }
        }
      });

      // Set default limit
      if (!params.has('limit')) {
        params.set('limit', '12');
      }

      const response = await fetch(`/api/recipes/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }

      const data = await response.json();
      
      if (append) {
        // Append new recipes to existing ones
        setRecipes(prev => [...prev, ...(data.recipes || [])]);
      } else {
        // Replace recipes (new search)
        setRecipes(data.recipes || []);
      }
      
      setPagination(data.pagination || pagination);
      setSearchInfo(data.searchInfo || searchInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (searchParams: SearchParams) => {
    fetchRecipes({ ...searchParams, page: 1 });
  };

  const handleLoadMore = () => {
    const currentParams = new URLSearchParams(window.location.search);
    const nextPage = pagination.page + 1;
    
    fetchRecipes({
      query: currentParams.get('query') || undefined,
      tags: currentParams.get('tags') ? JSON.parse(currentParams.get('tags')!) : undefined,
      difficulty: (currentParams.get('difficulty') as 'easy' | 'medium' | 'hard') || undefined,
      maxCookTime: currentParams.get('maxCookTime') ? parseInt(currentParams.get('maxCookTime')!) : undefined,
      minCookTime: currentParams.get('minCookTime') ? parseInt(currentParams.get('minCookTime')!) : undefined,
      maxPrepTime: currentParams.get('maxPrepTime') ? parseInt(currentParams.get('maxPrepTime')!) : undefined,
      minPrepTime: currentParams.get('minPrepTime') ? parseInt(currentParams.get('minPrepTime')!) : undefined,
      sortBy: (currentParams.get('sortBy') as 'newest' | 'oldest' | 'popular' | 'title' | 'cookTime' | 'prepTime') || 'newest',
      page: nextPage,
    }, true); // true for append mode
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col items-center space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Recipe Collection</h1>
          <p className="text-muted-foreground">
            Discover and search through delicious recipes from our community
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/recipes/new">
              <Plus className="h-5 w-5 mr-2" />
              Create Recipe
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/recipes/import">
              <Upload className="h-5 w-5 mr-2" />
              Import Recipe
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/cookbooks/discover">
              <Globe className="h-5 w-5 mr-2" />
              Discover Cookbooks
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Component */}
      <RecipeSearch onSearch={handleSearch} isLoading={loading} />

      {/* Search Results Info */}
      {searchInfo.hasQuery && (
        <div className="text-sm text-muted-foreground">
          {loading ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <span>
              Found {pagination.total} recipe{pagination.total !== 1 ? 's' : ''}
              {searchInfo.query && ` for "${searchInfo.query}"`}
            </span>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchRecipes()} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Results */}
      {!loading && !error && (
        <>
          {recipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchInfo.hasQuery ? 'No recipes found matching your search.' : 'No recipes found.'}
              </p>
              {searchInfo.hasQuery && (
                <Button onClick={() => handleSearch({})} variant="outline">
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    showAuthor={true}
                    showStats={true}
                  />
                ))}
              </div>

              {/* Load More Button */}
              {pagination.hasNextPage && (
                <div className="flex justify-center mt-8">
                  <Button
                    onClick={handleLoadMore}
                    variant="outline"
                    disabled={loadingMore}
                    className="min-w-32"
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
                </div>
              )}
              
              {/* End of results indicator */}
              {!pagination.hasNextPage && recipes.length > 0 && (
                <div className="text-center mt-8">
                  <p className="text-sm text-muted-foreground">
                    You've reached the end of the results
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}