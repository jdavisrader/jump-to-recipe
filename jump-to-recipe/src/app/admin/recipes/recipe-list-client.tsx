'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { RecipeWithAuthor } from '@/types/admin';

type SortKey = 'title' | 'authorName' | 'createdAt' | 'updatedAt' | 'visibility';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

interface RecipeListClientProps {
  recipes: RecipeWithAuthor[];
}

export function RecipeListClient({ recipes }: RecipeListClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  });

  // Debounce search input to reduce re-renders (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get unique authors for owner filter dropdown
  const uniqueAuthors = useMemo(() => {
    const authorsMap = new Map<string, { id: string; name: string }>();
    recipes.forEach((recipe) => {
      if (recipe.authorId && recipe.authorName) {
        authorsMap.set(recipe.authorId, {
          id: recipe.authorId,
          name: recipe.authorName,
        });
      }
    });
    return Array.from(authorsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [recipes]);

  // Filter and sort recipes using useMemo with debounced search
  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = recipes;

    // Search filter (title and tags) - use debounced search term
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchLower) ||
          (recipe.tags &&
            recipe.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Owner filter
    if (ownerFilter !== 'all') {
      filtered = filtered.filter((recipe) => recipe.authorId === ownerFilter);
    }

    // Visibility filter
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(
        (recipe) => recipe.visibility === visibilityFilter
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number | Date | null = a[sortConfig.key];
      let bValue: string | number | Date | null = b[sortConfig.key];

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Handle date comparisons
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'updatedAt') {
        aValue = new Date(aValue as Date).getTime();
        bValue = new Date(bValue as Date).getTime();
      }

      // Handle string comparisons (case-insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [recipes, debouncedSearchTerm, ownerFilter, visibilityFilter, sortConfig]);

  // Handle sort column click
  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Get sort icon for column
  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  // Handle row click to navigate to recipe detail page
  const handleRowClick = (recipeId: string) => {
    router.push(`/recipes/${recipeId}`);
  };

  // Get visibility badge variant
  const getVisibilityBadgeVariant = (visibility: string) => {
    return visibility === 'public' ? 'default' : 'secondary';
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {uniqueAuthors.map((author) => (
              <SelectItem key={author.id} value={author.id}>
                {author.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recipe Table - Desktop */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                    aria-label="Sort by recipe title"
                  >
                    Recipe Title
                    {getSortIcon('title')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('authorName')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                    aria-label="Sort by owner"
                  >
                    Owner
                    {getSortIcon('authorName')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                    aria-label="Sort by created date"
                  >
                    Created
                    {getSortIcon('createdAt')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('updatedAt')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                    aria-label="Sort by updated date"
                  >
                    Updated
                    {getSortIcon('updatedAt')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('visibility')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                    aria-label="Sort by visibility"
                  >
                    Visibility
                    {getSortIcon('visibility')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRecipes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-12">
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-muted-foreground text-lg">
                        {recipes.length === 0
                          ? 'No recipes in the system'
                          : 'No recipes match your filters'}
                      </p>
                      {recipes.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or filter criteria
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedRecipes.map((recipe) => (
                  <tr
                    key={recipe.id}
                    onClick={() => handleRowClick(recipe.id)}
                    className="border-t hover:bg-muted/30 transition-colors cursor-pointer focus-within:bg-muted/30"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick(recipe.id);
                      }
                    }}
                    role="button"
                    aria-label={`View recipe: ${recipe.title}`}
                  >
                    <td className="p-4 font-medium">{recipe.title}</td>
                    <td className="p-4 text-muted-foreground">
                      {recipe.authorName || 'Unknown'}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(recipe.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(recipe.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4">
                      <Badge variant={getVisibilityBadgeVariant(recipe.visibility)}>
                        {recipe.visibility}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recipe Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredAndSortedRecipes.length === 0 ? (
          <div className="border rounded-lg p-12 text-center">
            <div className="flex flex-col items-center space-y-2">
              <p className="text-muted-foreground text-lg">
                {recipes.length === 0
                  ? 'No recipes in the system'
                  : 'No recipes match your filters'}
              </p>
              {recipes.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              )}
            </div>
          </div>
        ) : (
          filteredAndSortedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => handleRowClick(recipe.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRowClick(recipe.id);
                }
              }}
              className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors cursor-pointer focus-within:bg-muted/30 active:bg-muted/50"
              tabIndex={0}
              role="button"
              aria-label={`View recipe: ${recipe.title}`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg flex-1">{recipe.title}</h3>
                <Badge variant={getVisibilityBadgeVariant(recipe.visibility)}>
                  {recipe.visibility}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span className="font-medium">Owner:</span>
                  <span>{recipe.authorName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Created:</span>
                  <span>{format(new Date(recipe.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Updated:</span>
                  <span>{format(new Date(recipe.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedRecipes.length} of {recipes.length} recipes
      </div>
    </div>
  );
}
