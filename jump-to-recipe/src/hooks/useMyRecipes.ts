/**
 * Custom hook for managing My Recipes state with comprehensive error handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { Recipe } from '@/types/recipe';
import type { SearchParams } from '@/components/recipes/recipe-search';
import {
  categorizeError,
  fetchWithRetry,
  logError,
  isRecipeAccessibilityError,
  getGracefulDegradationStrategy,
  type MyRecipesError,
  type ErrorContext,
} from '@/lib/my-recipes-error-handler';
import { getNetworkAwareRetryConfig, getNetworkStatus, isOnline } from '@/lib/network-utils';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { useRecipeCache, fetchWithCache } from '@/lib/recipe-cache';

interface RecipeWithAuthor extends Recipe {
  authorName?: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SearchInfo {
  query: string;
  hasQuery: boolean;
  sortBy: string;
  appliedFilters: {
    tags: number;
    difficulty: boolean;
    cookTimeRange: boolean;
    prepTimeRange: boolean;
    author: boolean;
  };
}

interface UseMyRecipesState {
  recipes: RecipeWithAuthor[];
  loading: boolean;
  error: MyRecipesError | null;
  searchError: MyRecipesError | null;
  pagination: Pagination;
  searchInfo: SearchInfo;
  loadingMore: boolean;
  retryCount: number;
  gracefulDegradation: {
    showPartialResults: boolean;
    disableFeatures: string[];
    fallbackMessage: string;
  };
}

interface UseMyRecipesActions {
  fetchRecipes: (searchParams?: SearchParams, append?: boolean) => Promise<void>;
  handleSearch: (searchParams: SearchParams) => void;
  handleLoadMore: () => void;
  handleRetry: () => void;
  clearErrors: () => void;
  reset: () => void;
}

const initialPagination: Pagination = {
  total: 0,
  page: 1,
  limit: 12,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const initialSearchInfo: SearchInfo = {
  query: '',
  hasQuery: false,
  sortBy: 'newest',
  appliedFilters: {
    tags: 0,
    difficulty: false,
    cookTimeRange: false,
    prepTimeRange: false,
    author: false,
  },
};

const initialGracefulDegradation = {
  showPartialResults: false,
  disableFeatures: [],
  fallbackMessage: '',
};

/**
 * Helper function to fetch recipe data from API
 */
async function fetchRecipeData(userId: string, searchParams: SearchParams) {
  const params = new URLSearchParams();

  // Add user-specific filtering - critical for security
  params.set('authorId', userId);

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

  // Set default limit for pagination
  if (!params.has('limit')) {
    params.set('limit', '12');
  }

  const context: ErrorContext = {
    operation: 'fetchRecipeData',
    userId,
    searchParams,
    timestamp: Date.now(),
  };

  // Get network-aware retry configuration
  const baseRetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };
  const retryConfig = getNetworkAwareRetryConfig(baseRetryConfig);

  const response = await fetchWithRetry(
    `/api/recipes/search?${params.toString()}`,
    {},
    retryConfig,
    context
  );

  return await response.json();
}

export function useMyRecipes(): UseMyRecipesState & UseMyRecipesActions {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { markStart, markEnd, trackInteraction } = usePerformanceMonitor();
  const { get: getCached, set: setCached, prefetch } = useRecipeCache();
  
  // State management
  const [recipes, setRecipes] = useState<RecipeWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MyRecipesError | null>(null);
  const [searchError, setSearchError] = useState<MyRecipesError | null>(null);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [searchInfo, setSearchInfo] = useState<SearchInfo>(initialSearchInfo);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [gracefulDegradation, setGracefulDegradation] = useState<{
    showPartialResults: boolean;
    disableFeatures: string[];
    fallbackMessage: string;
  }>(initialGracefulDegradation);
  
  // Refs for tracking current operations
  const currentSearchParams = useRef<SearchParams>({});
  const abortController = useRef<AbortController | null>(null);

  // Performance monitoring setup
  useEffect(() => {
    markStart('my-recipes-initial-load');
    
    return () => {
      markEnd('my-recipes-initial-load');
    };
  }, [markStart, markEnd]);

  const clearErrors = useCallback(() => {
    setError(null);
    setSearchError(null);
    setGracefulDegradation(initialGracefulDegradation);
  }, []);

  const reset = useCallback(() => {
    setRecipes([]);
    setLoading(true);
    setPagination(initialPagination);
    setSearchInfo(initialSearchInfo);
    setLoadingMore(false);
    setRetryCount(0);
    clearErrors();
    
    // Cancel any ongoing requests
    if (abortController.current) {
      abortController.current.abort();
    }
  }, [clearErrors]);

  const fetchRecipes = useCallback(async (searchParams: SearchParams = {}, append = false) => {
    const operationName = append ? 'my-recipes-pagination' : 'my-recipes-search';
    markStart(operationName, { searchParams, append });

    // Check network connectivity first
    if (!isOnline()) {
      const networkError = categorizeError(new Error('No internet connection'), {
        operation: 'fetchRecipes',
        timestamp: Date.now(),
      });
      setError(networkError);
      logError(networkError);
      setLoading(false);
      markEnd(operationName, { success: false, error: 'network' });
      trackInteraction('errorEncounters', { type: 'network' });
      return;
    }

    // Ensure we have a valid session and user ID
    if (!session?.user?.id) {
      const authError = categorizeError(new Error('Authentication required'), {
        operation: 'fetchRecipes',
        timestamp: Date.now(),
      });
      setError(authError);
      logError(authError);
      setLoading(false);
      markEnd(operationName, { success: false, error: 'auth' });
      trackInteraction('errorEncounters', { type: 'auth' });
      return;
    }

    // Check cache first for non-append requests
    if (!append) {
      const cached = getCached(session.user.id, searchParams);
      if (cached) {
        setRecipes(cached.recipes);
        setPagination(cached.pagination);
        setSearchInfo(cached.searchInfo);
        setLoading(false);
        markEnd(operationName, { success: true, cached: true });
        
        // Prefetch next page in background
        prefetch(session.user.id, searchParams, async (params) => {
          return await fetchRecipeData(session.user.id, params);
        });
        
        return;
      }
    }

    // Cancel any previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      if (!append) {
        setLoading(true);
        clearErrors();
      } else {
        setLoadingMore(true);
        setSearchError(null);
        trackInteraction('paginationClicks');
      }

      // Store current search params for retry
      currentSearchParams.current = searchParams;

      const context: ErrorContext = {
        operation: append ? 'loadMore' : 'fetchRecipes',
        userId: session.user.id,
        searchParams,
        timestamp: Date.now(),
      };

      // Fetch data with caching
      const data = await fetchWithCache(
        session.user.id,
        searchParams,
        async (params) => fetchRecipeData(session.user.id, params),
        {
          useCache: !append, // Don't use cache for pagination
          prefetch: true,
        }
      );
      
      // Validate that all returned recipes belong to the current user
      const userRecipes = (data.recipes || []).filter((recipe: RecipeWithAuthor) => 
        recipe.authorId === session.user.id
      );
      
      // Check for deleted/inaccessible recipes
      const expectedCount = data.pagination?.total || 0;
      const actualCount = userRecipes.length;
      
      if (expectedCount > actualCount && !append) {
        const accessibilityError = categorizeError(
          new Error('Some recipes may have been deleted or are no longer accessible'),
          context
        );
        
        if (isRecipeAccessibilityError(accessibilityError)) {
          setSearchError(accessibilityError);
          logError(accessibilityError);
          trackInteraction('errorEncounters', { type: 'accessibility' });
          
          // Apply graceful degradation
          const degradationStrategy = getGracefulDegradationStrategy(accessibilityError);
          setGracefulDegradation(degradationStrategy);
        }
      }
      
      if (append) {
        // Append new recipes to existing ones (for pagination)
        setRecipes(prev => [...prev, ...userRecipes]);
      } else {
        // Replace recipes (new search)
        setRecipes(userRecipes);
      }
      
      setPagination(data.pagination || initialPagination);
      setSearchInfo(data.searchInfo || initialSearchInfo);
      
      // Reset retry count on success
      setRetryCount(0);
      markEnd(operationName, { success: true, cached: false, recipeCount: userRecipes.length });
      
    } catch (err) {
      // Handle aborted requests gracefully
      if (err instanceof Error && err.name === 'AbortError') {
        markEnd(operationName, { success: false, error: 'aborted' });
        return;
      }

      const context: ErrorContext = {
        operation: append ? 'loadMore' : 'fetchRecipes',
        userId: session?.user?.id,
        searchParams,
        timestamp: Date.now(),
      };

      const categorizedError = categorizeError(err, context);
      logError(categorizedError);
      trackInteraction('errorEncounters', { type: categorizedError.type });
      
      // Handle authentication errors with redirect
      if (categorizedError.type === 'auth') {
        setTimeout(() => {
          router.push('/auth/login?callbackUrl=/my-recipes');
        }, 2000);
      }
      
      if (append) {
        // For pagination errors, show less intrusive error
        setSearchError(categorizedError);
      } else {
        // For initial load or search errors, show main error
        setError(categorizedError);
        
        // Apply graceful degradation if appropriate
        const degradationStrategy = getGracefulDegradationStrategy(categorizedError);
        if (degradationStrategy.showPartialResults && recipes.length > 0) {
          setGracefulDegradation(degradationStrategy);
        }
      }
      
      setRetryCount(prev => prev + 1);
      markEnd(operationName, { success: false, error: categorizedError.type });
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [session?.user?.id, router, recipes.length, clearErrors, markStart, markEnd, trackInteraction, getCached, prefetch]);

  const handleSearch = useCallback((searchParams: SearchParams) => {
    trackInteraction('searchInteractions', { searchParams });
    setSearchError(null);
    setGracefulDegradation(initialGracefulDegradation);
    fetchRecipes({ ...searchParams, page: 1 });
  }, [fetchRecipes, trackInteraction]);

  const handleLoadMore = useCallback(() => {
    setSearchError(null);
    
    // Get current search parameters and increment page
    const nextPage = pagination.page + 1;
    const loadMoreParams: SearchParams = {
      ...currentSearchParams.current,
      page: nextPage,
    };
    
    fetchRecipes(loadMoreParams, true);
  }, [fetchRecipes, pagination.page]);

  const handleRetry = useCallback(() => {
    trackInteraction('retryAttempts');
    markStart('my-recipes-error-recovery');
    clearErrors();
    setRetryCount(0);
    
    // Retry with the last known search parameters
    fetchRecipes(currentSearchParams.current);
    markEnd('my-recipes-error-recovery');
  }, [fetchRecipes, clearErrors, trackInteraction, markStart, markEnd]);

  return {
    // State
    recipes,
    loading,
    error,
    searchError,
    pagination,
    searchInfo,
    loadingMore,
    retryCount,
    gracefulDegradation,
    
    // Actions
    fetchRecipes,
    handleSearch,
    handleLoadMore,
    handleRetry,
    clearErrors,
    reset,
  };
}