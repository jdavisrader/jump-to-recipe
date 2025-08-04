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

export function RecipeSearch({ onSearch, isLoading }: RecipeSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
  const debouncedQuery = useDebounce(query, 300);
  
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

      // Update URL
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
      router.replace(newUrl, { scroll: false });
    }
  }, [debouncedQuery, tags, difficulty, maxCookTime, minCookTime, maxPrepTime, minPrepTime, sortBy, onSearch, router, buildSearchParams]);

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
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search recipes, ingredients, or instructions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {[query, ...tags, difficulty, maxCookTime, minCookTime, maxPrepTime, minPrepTime].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Sort dropdown */}
      <div className="flex items-center gap-2">
        <Label htmlFor="sort" className="text-sm font-medium">Sort by:</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
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
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonTags
                  .filter(tag => !tags.includes(tag))
                  .slice(0, 10)
                  .map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded-md transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Any difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any difficulty</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Cook Time (minutes)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minCookTime}
                    onChange={(e) => setMinCookTime(e.target.value)}
                    min="0"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxCookTime}
                    onChange={(e) => setMaxCookTime(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  Prep Time (minutes)
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={minPrepTime}
                    onChange={(e) => setMinPrepTime(e.target.value)}
                    min="0"
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={maxPrepTime}
                    onChange={(e) => setMaxPrepTime(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}