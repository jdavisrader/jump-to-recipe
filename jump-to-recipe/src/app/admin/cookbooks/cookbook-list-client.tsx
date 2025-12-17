'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, Users, BookOpen, Globe, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import type { CookbookWithMetadata, AdminCookbooksResponse } from '@/types/admin';
import {
  filterAndSortCookbooks,
  getUniqueOwners,
  type CookbookSortKey,
  type CookbookSortConfig,
} from '@/lib/admin-cookbook-utils';

export function CookbookListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // State
  const [cookbooks, setCookbooks] = useState<CookbookWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get('owner') || 'all');
  const [sortConfig, setSortConfig] = useState<CookbookSortConfig>({
    key: (searchParams.get('sortBy') as CookbookSortKey) || 'createdAt',
    direction: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  });
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch cookbooks data
  const fetchCookbooks = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
        search: searchTerm,
        ownerId: ownerFilter === 'all' ? '' : ownerFilter,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });

      const response = await fetch(`/api/admin/cookbooks?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch cookbooks');
      }

      const data: AdminCookbooksResponse = await response.json();
      setCookbooks(data.cookbooks);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Update URL with current filters and pagination
  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (ownerFilter !== 'all') params.set('owner', ownerFilter);
    if (sortConfig.key !== 'createdAt') params.set('sortBy', sortConfig.key);
    if (sortConfig.direction !== 'desc') params.set('sortOrder', sortConfig.direction);
    if (currentPage !== 1) params.set('page', currentPage.toString());

    const newURL = `/admin/cookbooks${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newURL, { scroll: false });
  };

  // Effects
  useEffect(() => {
    fetchCookbooks();
  }, [currentPage, searchTerm, ownerFilter, sortConfig]);

  useEffect(() => {
    updateURL();
  }, [currentPage, searchTerm, ownerFilter, sortConfig]);

  // Get unique owners for filter dropdown
  const uniqueOwners = useMemo(() => getUniqueOwners(cookbooks), [cookbooks]);

  // Handle sort column click
  const handleSort = (key: CookbookSortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Get sort icon for column
  const getSortIcon = (key: CookbookSortKey) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  // Handle cookbook view
  const handleView = (cookbookId: string) => {
    router.push(`/cookbooks/${cookbookId}`);
  };

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle owner filter change
  const handleOwnerFilterChange = (value: string) => {
    setOwnerFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate pagination buttons
  const getPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button
          key={i}
          variant={i === currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 bg-muted rounded flex-1 animate-pulse" />
          <div className="h-10 bg-muted rounded w-full sm:w-[180px] animate-pulse" />
        </div>
        <div className="border rounded-lg p-12">
          <div className="text-center text-muted-foreground">Loading cookbooks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-12">
          <div className="text-center">
            <p className="text-destructive text-lg mb-2">Error loading cookbooks</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchCookbooks}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by cookbook title..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={ownerFilter} onValueChange={handleOwnerFilterChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {uniqueOwners.map((owner) => (
              <SelectItem key={owner.id} value={owner.id}>
                {owner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cookbook Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Title
                    {getSortIcon('title')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('ownerName')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Owner
                    {getSortIcon('ownerName')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('collaboratorCount')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Collaborators
                    {getSortIcon('collaboratorCount')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('recipeCount')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Recipes
                    {getSortIcon('recipeCount')}
                  </button>
                </th>
                <th className="text-left p-4">Visibility</th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Created
                    {getSortIcon('createdAt')}
                  </button>
                </th>
                <th className="text-right p-4">
                  <span className="font-semibold">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {cookbooks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12">
                    <div className="flex flex-col items-center space-y-2">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground text-lg">
                        {total === 0 ? 'No cookbooks in the system' : 'No cookbooks match your filters'}
                      </p>
                      {total > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or filter criteria
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                cookbooks.map((cookbook) => (
                  <tr
                    key={cookbook.id}
                    className="border-t hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-medium">{cookbook.title}</div>
                      {cookbook.description && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {cookbook.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{cookbook.owner.name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{cookbook.owner.email}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{cookbook.collaboratorCount}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span>{cookbook.recipeCount}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={cookbook.isPublic ? 'default' : 'secondary'}>
                        {cookbook.isPublic ? (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Public
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Private
                          </div>
                        )}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(cookbook.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(cookbook.id)}
                          aria-label={`View ${cookbook.title}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination and Results */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {cookbooks.length} of {total} cookbooks (Page {currentPage} of {totalPages})
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {getPaginationButtons()}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Results count for single page */}
      {totalPages <= 1 && total > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {cookbooks.length} of {total} cookbooks
        </div>
      )}
    </div>
  );
}