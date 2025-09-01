"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface CookbookOption {
  id: string;
  name: string;
  isChecked: boolean;
  isOwned: boolean;
  permission: 'edit' | 'owner';
  lastUsed?: Date;
}

interface AddToCookbookModalProps {
  recipeId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToCookbookModal({
  recipeId,
  isOpen,
  onClose,
}: AddToCookbookModalProps) {
  const [cookbooks, setCookbooks] = useState<CookbookOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const router = useRouter();

  const fetchCookbooks = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/cookbooks`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch cookbooks');
      }
      
      const data = await response.json();
      setCookbooks(data.cookbooks || []);
    } catch (error) {
      console.error('Error fetching cookbooks:', error);
      toast({
        title: "Error",
        description: "Failed to load cookbooks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitialLoading(false);
    }
  }, [recipeId, toast]);

  // Fetch cookbooks when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCookbooks();
    }
  }, [isOpen, fetchCookbooks]);

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Filter and sort cookbooks based on search query
  const filteredCookbooks = useMemo(() => {
    let filtered = cookbooks;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = cookbooks.filter(cookbook =>
        cookbook.name.toLowerCase().includes(query)
      );
    }
    
    // Sort: recently used, owned, then collaborated
    return filtered.sort((a, b) => {
      // First sort by last used date (most recent first)
      if (a.lastUsed && b.lastUsed) {
        const timeDiff = b.lastUsed.getTime() - a.lastUsed.getTime();
        if (timeDiff !== 0) return timeDiff;
      }
      
      // Then prioritize owned cookbooks
      if (a.isOwned && !b.isOwned) return -1;
      if (!a.isOwned && b.isOwned) return 1;
      
      // Finally sort by name
      return a.name.localeCompare(b.name);
    });
  }, [cookbooks, searchQuery]);

  const handleCookbookToggle = async (cookbookId: string, currentlyChecked: boolean) => {
    // Optimistic UI update
    setCookbooks(prev => 
      prev.map(cookbook => 
        cookbook.id === cookbookId 
          ? { ...cookbook, isChecked: !currentlyChecked }
          : cookbook
      )
    );

    // Track pending operation
    setPendingOperations(prev => new Set(prev).add(cookbookId));

    try {
      let response;
      
      if (currentlyChecked) {
        // Remove recipe from cookbook
        response = await fetch(`/api/cookbooks/${cookbookId}/recipes/${recipeId}`, {
          method: 'DELETE',
        });
      } else {
        // Add recipe to cookbook
        response = await fetch(`/api/cookbooks/${cookbookId}/recipes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipeId }),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to ${currentlyChecked ? 'remove from' : 'add to'} cookbook`);
      }

      // Show success toast
      toast({
        title: "Success",
        description: `Recipe ${currentlyChecked ? 'removed from' : 'added to'} cookbook successfully.`,
      });

    } catch (error) {
      console.error('Error updating cookbook:', error);
      
      // Revert optimistic update on error
      setCookbooks(prev => 
        prev.map(cookbook => 
          cookbook.id === cookbookId 
            ? { ...cookbook, isChecked: currentlyChecked }
            : cookbook
        )
      );

      toast({
        title: "Error",
        description: `Failed to ${currentlyChecked ? 'remove from' : 'add to'} cookbook. Please try again.`,
        variant: "destructive",
      });
    } finally {
      // Remove from pending operations
      setPendingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(cookbookId);
        return newSet;
      });
    }
  };

  const handleCreateCookbook = () => {
    router.push('/cookbooks/new');
    onClose();
  };

  const handleClose = () => {
    // Don't close if there are pending operations
    if (pendingOperations.size > 0) {
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Add to Cookbook</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={pendingOperations.size > 0}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isInitialLoading ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading cookbooks...
              </div>
            </div>
          ) : cookbooks.length === 0 ? (
            // Empty state - no editable cookbooks
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-muted-foreground mb-4">
                You don&apos;t have any cookbooks yet. Create your first cookbook to start organizing your recipes.
              </p>
              <Button onClick={handleCreateCookbook} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Cookbook
              </Button>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="p-6 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cookbooks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Cookbook List */}
              <div className="flex-1 overflow-y-auto px-6">
                {filteredCookbooks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No cookbooks found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredCookbooks.map((cookbook) => {
                      const isPending = pendingOperations.has(cookbook.id);
                      
                      return (
                        <div
                          key={cookbook.id}
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                            "hover:bg-accent/50",
                            isPending && "opacity-50 pointer-events-none"
                          )}
                        >
                          <Checkbox
                            checked={cookbook.isChecked}
                            onCheckedChange={() => handleCookbookToggle(cookbook.id, cookbook.isChecked)}
                            disabled={isPending}
                            className="shrink-0"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {cookbook.name}
                              </span>
                              {isPending && (
                                <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {cookbook.isOwned ? 'Owned' : 'Collaborator'} • {cookbook.permission}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCreateCookbook}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create New Cookbook
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}