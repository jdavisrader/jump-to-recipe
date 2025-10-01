"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type {
  CookbookOption,
  AddToCookbookModalProps,
  PendingOperation,
  OperationResult,
  GetRecipeCookbooksResponse,
  ApiErrorResponse,
  CookbookToggleHandler,
  ModalCloseHandler,
  CreateCookbookHandler
} from "@/types";

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
  const { data: session, status } = useSession();
  const abortControllerRef = useRef<AbortController | null>(null);
  const operationTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Fetch cookbooks when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Don't fetch if session is still loading
    if (status === 'loading') {
      console.log('⏳ Session still loading, waiting...');
      return;
    }

    // Don't fetch if not authenticated
    if (status === 'unauthenticated' || !session) {
      console.log('❌ Not authenticated, cannot fetch cookbooks');
      setIsInitialLoading(false);
      toast({
        title: "Authentication Required",
        description: "Please sign in to add recipes to cookbooks.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Session authenticated, proceeding with fetch');
    setIsInitialLoading(true);

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    const fetchCookbooks = async () => {
      try {
        console.log('🔍 Fetching cookbooks for recipe:', recipeId);

        const response = await fetch(`/api/recipes/${recipeId}/cookbooks`, {
          signal: abortControllerRef.current?.signal,
          credentials: 'include', // Ensure cookies are sent
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('📡 Response status:', response.status);

        if (!response.ok) {
          const errorData: ApiErrorResponse = await response.json().catch(() => ({ 
            success: false,
            error: 'Unknown error',
            message: 'Failed to parse error response',
            statusCode: response.status
          }));
          console.error('❌ API Error:', response.status, errorData);
          throw new Error(`Failed to fetch cookbooks: ${response.status} ${response.statusText}`);
        }

        const data: GetRecipeCookbooksResponse = await response.json();
        console.log('✅ Cookbooks fetched:', data.cookbooks?.length || 0);
        setCookbooks(data.cookbooks || []);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, don't show error
          console.log('🚫 Request cancelled');
          return;
        }

        console.error('❌ Error fetching cookbooks:', error);
        toast({
          title: "Error",
          description: "Failed to load cookbooks. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchCookbooks();
  }, [isOpen, recipeId, status, session, toast]); // Added back dependencies



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
        // Ensure lastUsed is a Date object
        const aDate = a.lastUsed instanceof Date ? a.lastUsed : new Date(a.lastUsed);
        const bDate = b.lastUsed instanceof Date ? b.lastUsed : new Date(b.lastUsed);

        // Check if dates are valid
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
          const timeDiff = bDate.getTime() - aDate.getTime();
          if (timeDiff !== 0) return timeDiff;
        }
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

  const handleCookbookToggle: CookbookToggleHandler = useCallback(async (cookbookId: string, currentlyChecked: boolean) => {
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

  const handleCreateCookbook: CreateCookbookHandler = useCallback(() => {
    router.push('/cookbooks/new');
    onClose();
  }, [router, onClose]);

  const handleClose: ModalCloseHandler = useCallback(() => {
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

  // Focus management and keyboard navigation
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      
      // Focus the search input when modal opens (after a brief delay to ensure it's rendered)
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);

      // Handle keyboard navigation
      const handleKeyDown = (event: KeyboardEvent) => {
        // Close modal on Escape key (if no pending operations)
        if (event.key === 'Escape' && pendingOperations.size === 0) {
          event.preventDefault();
          handleClose();
          return;
        }

        // Trap focus within modal
        if (event.key === 'Tab') {
          const modal = modalRef.current;
          if (!modal) return;

          const focusableElements = modal.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (event.shiftKey) {
            // Shift + Tab: focus previous element
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab: focus next element
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Restore focus to previously focused element when modal closes
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
        previousActiveElementRef.current = null;
      }
    }
  }, [isOpen, pendingOperations.size, handleClose]);

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
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onClick={(e) => {
        // Close modal when clicking backdrop (but not when there are pending operations)
        if (e.target === e.currentTarget && pendingOperations.size === 0) {
          handleClose();
        }
      }}
    >
      <div 
        ref={modalRef}
        className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] sm:max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex items-center gap-2">
            <h2 id="modal-title" className="text-lg font-semibold">Add to Cookbook</h2>
            {pendingOperations.size > 0 && (
              <div 
                className="flex items-center gap-1 text-sm text-muted-foreground"
                aria-live="polite"
                aria-label={`${pendingOperations.size} operation${pendingOperations.size > 1 ? 's' : ''} in progress`}
              >
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                <span>{pendingOperations.size} operation{pendingOperations.size > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={pendingOperations.size > 0}
            className="h-8 w-8 min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-[32px] sm:min-w-[32px] touch-manipulation"
            aria-label={pendingOperations.size > 0 ? "Please wait for operations to complete before closing" : "Close dialog"}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Hidden description for screen readers */}
        <div id="modal-description" className="sr-only">
          Dialog to select cookbooks to add this recipe to. Use the search field to filter cookbooks, 
          then check or uncheck cookbooks to add or remove the recipe.
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isInitialLoading ? (
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
              <div 
                className="flex items-center gap-2 text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Loading cookbooks...</span>
              </div>
            </div>
          ) : cookbooks.length === 0 ? (
            // Empty state - no editable cookbooks
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
              <p className="text-muted-foreground mb-4">
                You don&apos;t have any cookbooks yet. Create your first cookbook to start organizing your recipes.
              </p>
              <Button 
                onClick={handleCreateCookbook} 
                className="gap-2 min-h-[44px] touch-manipulation"
                aria-label="Create your first cookbook"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create Cookbook
              </Button>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="relative">
                  <Search 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" 
                    aria-hidden="true"
                  />
                  <Input
                    ref={searchInputRef}
                    placeholder="Search cookbooks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 min-h-[44px] text-base sm:text-sm"
                    aria-label="Search cookbooks by name"
                    aria-describedby="search-help"
                  />
                  <div id="search-help" className="sr-only">
                    Type to filter the list of cookbooks by name
                  </div>
                </div>
              </div>

              {/* Cookbook List */}
              <div 
                className="flex-1 overflow-y-auto px-4 sm:px-6"
                role="group"
                aria-labelledby="cookbook-list-label"
              >
                <div id="cookbook-list-label" className="sr-only">
                  List of cookbooks you can edit
                </div>
                
                {filteredCookbooks.length === 0 ? (
                  <div 
                    className="text-center py-8 text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    No cookbooks found matching &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  <div className="space-y-2" role="list">
                    {filteredCookbooks.map((cookbook) => {
                      const pendingOperation = pendingOperations.get(cookbook.id);
                      const isPending = !!pendingOperation;
                      const retryCount = retryAttempts.get(cookbook.id) || 0;
                      const checkboxId = `cookbook-${cookbook.id}`;
                      const statusId = `status-${cookbook.id}`;

                      return (
                        <div
                          key={cookbook.id}
                          role="listitem"
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                            "hover:bg-accent/50 focus-within:bg-accent/50",
                            // Enhanced touch targets for mobile
                            "min-h-[60px] sm:min-h-[auto]",
                            isPending && "opacity-75"
                          )}
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={cookbook.isChecked}
                            onCheckedChange={() => handleCookbookToggle(cookbook.id, cookbook.isChecked)}
                            disabled={isPending}
                            className="shrink-0 h-5 w-5 sm:h-4 sm:w-4"
                            aria-describedby={statusId}
                            aria-label={`${cookbook.isChecked ? 'Remove' : 'Add'} recipe ${cookbook.isChecked ? 'from' : 'to'} ${cookbook.name} cookbook`}
                          />

                          <label 
                            htmlFor={checkboxId}
                            className="flex-1 min-w-0 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate text-base sm:text-sm">
                                {cookbook.name}
                              </span>
                              {isPending && (
                                <div 
                                  className="flex items-center gap-1 shrink-0"
                                  aria-live="polite"
                                  aria-label={`Operation in progress${retryCount > 0 ? `, retry ${retryCount}` : ''}`}
                                >
                                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                  {retryCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      (retry {retryCount})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div 
                              id={statusId}
                              className="flex items-center gap-2 text-xs sm:text-xs text-muted-foreground mt-1"
                            >
                              <span>
                                {cookbook.isOwned ? 'Owned' : 'Collaborator'} • {cookbook.permission}
                              </span>
                              {isPending && pendingOperation && (
                                <span className="flex items-center gap-1" aria-live="polite">
                                  <span aria-hidden="true">•</span>
                                  <span>
                                    {pendingOperation.operation === 'add' ? 'Adding...' : 'Removing...'}
                                  </span>
                                </span>
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCreateCookbook}
                  className="w-full gap-2 min-h-[44px] touch-manipulation"
                  aria-label="Create a new cookbook"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
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