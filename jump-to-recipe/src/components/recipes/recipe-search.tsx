'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, Clock, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';

interface RecipeSearchProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export interface SearchParams {
  query?: string;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  maxCookTime?: number;
  minCookTime?: number;
  maxPrepTime?: number;
  minPrepTime?: number;
  sortBy?: 'newest' | 'oldest' | 'popular' | 'title' | 'cookTime' | 'prepTime';
  page?: number;
}

export function RecipeSearch({ onSearch, isLoading, disabled = false }: RecipeSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [tags, setTags] = useState<string[]>(
    searchParams.get('tags') ? searchParams.get('tags')!.split(',') : []
  );
  const [difficulty, setDifficulty] = useState<string>(searchParams.get('difficulty') || '');
  const [maxCookTime, setMaxCookTime] = useState(searchParams.get('maxCookTime') || '');
  const [minCookTime, setMinCookTime] = useState(searchParams.get('minCookTime') || '');
  const [maxPrepTime, setMaxPrepTime] = useState(searchParams.get('maxPrepTime') || '');
  const [minPrepTime, setMinPrepTime] = useState(searchParams.get('minPrepTime') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [showFilters, setShowFilters] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Debounce search query
  const debouncedQuery = useDebounce(query, 650);
  
  // Track last search parameters to prevent infinite loops
  const lastSearchParamsRef = useRef<string>('');

  // Common recipe tags for suggestions
  const commonTags = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo',
    'quick', 'easy', 'healthy', 'comfort-food', 'dessert', 'breakfast',
    'lunch', 'dinner', 'snack', 'italian', 'mexican', 'asian', 'indian',
    'mediterranean', 'american', 'french', 'thai', 'chinese', 'japanese'
  ];

  const buildSearchParams = useCallback((): SearchParams => {
    const params: SearchParams = {
      sortBy: sortBy as SearchParams['sortBy']
    };

    if (debouncedQuery.trim()) params.query = debouncedQuery.trim();
    if (tags.length > 0) params.tags = tags;
    if (difficulty) params.difficulty = difficulty as SearchParams['difficulty'];
    if (maxCookTime) params.maxCookTime = parseInt(maxCookTime);
    if (minCookTime) params.minCookTime = parseInt(minCookTime);
    if (maxPrepTime) params.maxPrepTime = parseInt(maxPrepTime);
    if (minPrepTime) params.minPrepTime = parseInt(minPrepTime);

    return params;
  }, [debouncedQuery, tags, difficulty, maxCookTime, minCookTime, maxPrepTime, minPrepTime, sortBy]);

  // Update URL and trigger search when parameters change
  useEffect(() => {
    const params = buildSearchParams();
    
    // Create a string representation of the current search parameters
    const paramsString = JSON.stringify(params);
    
    // Only trigger search if parameters have actually changed
    if (paramsString !== lastSearchParamsRef.current) {
      lastSearchParamsRef.current = paramsString;
      
      onSearch(params);

      // Update URL without causing re-render
      const urlParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            urlParams.set(key, value.join(','));
          } else {
            urlParams.set(key, value.toString());
          }
        }
      });

      const newUrl = urlParams.toString() ? `?${urlParams.toString()}` : '';
      
      // Use window.history.replaceState instead of router.replace to avoid re-renders
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.search = newUrl;
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [debouncedQuery, tags, difficulty, maxCookTime, minCookTime, maxPrepTime, minPrepTime, sortBy, onSearch, buildSearchParams]);

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const clearAllFilters = () => {
    setQuery('');
    setTags([]);
    setDifficulty('');
    setMaxCookTime('');
    setMinCookTime('');
    setMaxPrepTime('');
    setMinPrepTime('');
    setSortBy('newest');
    setTagInput('');
  };

  const hasActiveFilters = query || tags.length > 0 || difficulty || maxCookTime || minCookTime || maxPrepTime || minPrepTime;

  return (
    <div className="space-y-4" role="search" aria-label="Recipe search">
      {/* Main search bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
          <Input
            ref={searchInputRef}
            id="recipe-search"
            placeholder="Search recipes, ingredients, or instructions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            disabled={isLoading || disabled}
            aria-label="Search recipes"
            aria-describedby="search-help"
          />
          <div id="search-help" className="sr-only">
            Search through your recipes by title, ingredients, or instructions
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 w-full sm:w-auto justify-center"
          disabled={disabled}
          aria-expanded={showFilters}
          aria-controls="advanced-filters"
          aria-label={`${showFilters ? 'Hide' : 'Show'} advanced filters`}
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          <span className="sm:hidden">Advanced </span>Filters
          {hasActiveFilters && (
            <span 
              className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs ml-1"
              aria-label={`${[query, ...tags, difficulty, maxCookTime, minCookTime, maxPrepTime, minPrepTime].filter(Boolean).length} active filters`}
            >
              {[query, ...tags, difficulty, maxCookTime, minCookTime, maxPrepTime, minPrepTime].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Sort dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Label htmlFor="sort" className="text-sm font-medium">Sort by:</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40" id="sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="title">Title A-Z</SelectItem>
            <SelectItem value="cookTime">Cook Time</SelectItem>
            <SelectItem value="prepTime">Prep Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <Card id="advanced-filters" role="region" aria-labelledby="filters-title">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle id="filters-title" className="text-lg">Advanced Filters</CardTitle>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-1" aria-hidden="true" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tag-input">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2" role="list" aria-label="Selected tags">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
                    role="listitem"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-primary-foreground/20 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
                      aria-label={`Remove ${tag} tag`}
                      type="button"
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="tag-input"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="flex-1"
                  aria-describedby="tag-help"
                />
                <Button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  disabled={!tagInput.trim()}
                  className="w-full sm:w-auto"
                >
                  Add Tag
                </Button>
              </div>
              <div id="tag-help" className="sr-only">
                Press Enter or click Add Tag to add a new tag
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Popular tags:</p>
                <div className="flex flex-wrap gap-1" role="group" aria-label="Popular tags">
                  {commonTags
                    .filter(tag => !tags.includes(tag))
                    .slice(0, 10)
                    .map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleAddTag(tag)}
                        className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                        type="button"
                        aria-label={`Add ${tag} tag`}
                      >
                        {tag}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="difficulty-select">Difficulty</Label>
              <Select value={difficulty || "any"} onValueChange={(value) => setDifficulty(value === "any" ? "" : value)}>
                <SelectTrigger id="difficulty-select">
                  <SelectValue placeholder="Any difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any difficulty</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time filters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <fieldset className="space-y-2">
                <legend className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Cook Time (minutes)
                </legend>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minCookTime}
                    onChange={(e) => setMinCookTime(e.target.value)}
                    min="0"
                    aria-label="Minimum cook time in minutes"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxCookTime}
                    onChange={(e) => setMaxCookTime(e.target.value)}
                    min="0"
                    aria-label="Maximum cook time in minutes"
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="flex items-center gap-2 text-sm font-medium">
                  <ChefHat className="h-4 w-4" aria-hidden="true" />
                  Prep Time (minutes)
                </legend>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minPrepTime}
                    onChange={(e) => setMinPrepTime(e.target.value)}
                    min="0"
                    aria-label="Minimum prep time in minutes"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxPrepTime}
                    onChange={(e) => setMaxPrepTime(e.target.value)}
                    min="0"
                    aria-label="Maximum prep time in minutes"
                  />
                </div>
              </fieldset>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}