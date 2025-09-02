"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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

interface PendingOperation {
  cookbookId: string;
  operation: 'add' | 'remove';
  originalState: boolean;
  timestamp: number;
}

interface OperationResult {
  success: boolean;
  cookbookId: string;
  operation: 'add' | 'remove';
  error?: string;
}

export function AddToCookbookModal({
  recipeId,
  isOpen,
  onClose,
}: AddToCookbookModalProps) {
  const [cookbooks, setCookbooks] = useState<CookbookOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [pendingOperations, setPendingOperations] = useState<Map<string, PendingOperation>>(new Map());
  const [retryAttempts, setRetryAttempts] = useState<Map<string, number>>(new Map());
  const { toast } = useToast();
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);
  const operationTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const fetchCookbooks = useCallback(async () => {
    setIsInitialLoading(true);
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch(`/api/recipes/${recipeId}/cookbooks`, {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch cookbooks: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setCookbooks(data.cookbooks || []);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't show error
        return;
      }
      
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

  const executeOperation = useCallback(async (operation: PendingOperation): Promise<OperationResult> => {
    const { cookbookId, operation: op } = operation;
    
    try {
      let response;
      
      if (op === 'remove') {
        response = await fetch(`/api/cookbooks/${cookbookId}/recipes/${recipeId}`, {
          method: 'DELETE',
          signal: abortControllerRef.current?.signal,
        });
      } else {
        response = await fetch(`/api/cookbooks/${cookbookId}/recipes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recipeId }),
          signal: abortControllerRef.current?.signal,
        });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return {
        success: true,
        cookbookId,
        operation: op,
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Re-throw abort errors
      }
      
      return {
        success: false,
        cookbookId,
        operation: op,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [recipeId]);

  const retryOperation = useCallback(async (operation: PendingOperation, maxRetries = 2) => {
    const currentAttempts = retryAttempts.get(operation.cookbookId) || 0;
    
    if (currentAttempts >= maxRetries) {
      return {
        success: false,
        cookbookId: operation.cookbookId,
        operation: operation.operation,
        error: 'Maximum retry attempts exceeded',
      };
    }

    setRetryAttempts(prev => new Map(prev).set(operation.cookbookId, currentAttempts + 1));
    
    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, currentAttempts) * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return executeOperation(operation);
  }, [executeOperation, retryAttempts]);

  const handleOperationTimeout = useCallback((cookbookId: string) => {
    const operation = pendingOperations.get(cookbookId);
    if (!operation) return;

    // Revert optimistic update
    setCookbooks(prev => 
      prev.map(cookbook => 
        cookbook.id === cookbookId 
          ? { ...cookbook, isChecked: operation.originalState }
          : cookbook
      )
    );

    // Remove from pending operations
    setPendingOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(cookbookId);
      return newMap;
    });

    toast({
      title: "Operation Timeout",
      description: "The operation took too long and was cancelled. Please try again.",
      variant: "destructive",
    });
  }, [pendingOperations, toast]);

  const handleCookbookToggle = useCallback(async (cookbookId: string, currentlyChecked: boolean) => {
    // Check if there's already a pending operation for this cookbook
    if (pendingOperations.has(cookbookId)) {
      toast({
        title: "Please wait",
        description: "Another operation is in progress for this cookbook.",
        variant: "destructive",
      });
      return;
    }

    const operation: PendingOperation = {
      cookbookId,
      operation: currentlyChecked ? 'remove' : 'add',
      originalState: currentlyChecked,
      timestamp: Date.now(),
    };

    // Optimistic UI update
    setCookbooks(prev => 
      prev.map(cookbook => 
        cookbook.id === cookbookId 
          ? { ...cookbook, isChecked: !currentlyChecked }
          : cookbook
      )
    );

    // Track pending operation
    setPendingOperations(prev => new Map(prev).set(cookbookId, operation));

    // Set operation timeout (30 seconds)
    const timeoutId = setTimeout(() => {
      handleOperationTimeout(cookbookId);
    }, 30000);
    
    operationTimeoutRef.current.set(cookbookId, timeoutId);

    try {
      let result = await executeOperation(operation);
      
      // Retry on failure (network errors, temporary server issues)
      if (!result.success && !result.error?.includes('AbortError')) {
        result = await retryOperation(operation);
      }

      if (result.success) {
        // Clear retry attempts on success
        setRetryAttempts(prev => {
          const newMap = new Map(prev);
          newMap.delete(cookbookId);
          return newMap;
        });

        toast({
          title: "Success",
          description: `Recipe ${operation.operation === 'remove' ? 'removed from' : 'added to'} cookbook successfully.`,
        });
      } else {
        throw new Error(result.error || 'Operation failed');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Don't show error for cancelled operations
      }
      
      console.error('Error updating cookbook:', error);
      
      // Revert optimistic update on error
      setCookbooks(prev => 
        prev.map(cookbook => 
          cookbook.id === cookbookId 
            ? { ...cookbook, isChecked: operation.originalState }
            : cookbook
        )
      );

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to ${operation.operation === 'remove' ? 'remove from' : 'add to'} cookbook: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      // Clear timeout
      const timeoutId = operationTimeoutRef.current.get(cookbookId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        operationTimeoutRef.current.delete(cookbookId);
      }
      
      // Remove from pending operations
      setPendingOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(cookbookId);
        return newMap;
      });
    }
  }, [pendingOperations, executeOperation, retryOperation, toast, handleOperationTimeout]);

  const handleCreateCookbook = useCallback(() => {
    router.push('/cookbooks/new');
    onClose();
  }, [router, onClose]);

  const handleClose = useCallback(() => {
    // Don't close if there are pending operations
    if (pendingOperations.size > 0) {
      toast({
        title: "Please wait",
        description: "Please wait for ongoing operations to complete before closing.",
        variant: "destructive",
      });
      return;
    }
    onClose();
  }, [pendingOperations.size, onClose, toast]);

  // Cleanup effect
  useEffect(() => {
    const abortController = abortControllerRef.current;
    const timeouts = operationTimeoutRef.current;
    
    return () => {
      // Cancel any ongoing requests
      if (abortController) {
        abortController.abort();
      }
      
      // Clear all timeouts
      timeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeouts.clear();
    };
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setPendingOperations(new Map());
      setRetryAttempts(new Map());
      
      // Clear timeouts
      const timeouts = operationTimeoutRef.current;
      timeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeouts.clear();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Add to Cookbook</h2>
            {pendingOperations.size > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{pendingOperations.size} operation{pendingOperations.size > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={pendingOperations.size > 0}
            className="h-8 w-8"
            title={pendingOperations.size > 0 ? "Please wait for operations to complete" : "Close"}
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
                      const pendingOperation = pendingOperations.get(cookbook.id);
                      const isPending = !!pendingOperation;
                      const retryCount = retryAttempts.get(cookbook.id) || 0;
                      
                      return (
                        <div
                          key={cookbook.id}
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                            "hover:bg-accent/50",
                            isPending && "opacity-75"
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
                                <div className="flex items-center gap-1 shrink-0">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  {retryCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      (retry {retryCount})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {cookbook.isOwned ? 'Owned' : 'Collaborator'} • {cookbook.permission}
                              </span>
                              {isPending && pendingOperation && (
                                <span className="flex items-center gap-1">
                                  <span>•</span>
                                  <span>
                                    {pendingOperation.operation === 'add' ? 'Adding...' : 'Removing...'}
                                  </span>
                                </span>
                              )}
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