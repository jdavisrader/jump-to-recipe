'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Search, Loader2, AlertCircle, UserCheck, ChevronsUpDown, Check, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchWithRetry } from '@/lib/api-retry';
import { ComponentCache } from '@/lib/performance-cache';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AdminOwnershipTransferStandaloneProps {
  cookbookId: string;
  currentOwner: {
    id: string;
    name: string | null;
    email: string;
  };
}

// Global cache instance for user list to avoid repeated fetches across components
const userListCache = new ComponentCache<User[]>(5 * 60 * 1000); // 5 minutes TTL

// In-flight request tracking to prevent duplicate requests
let userFetchPromise: Promise<User[]> | null = null;

/**
 * Standalone admin ownership transfer component
 * This component handles everything internally and doesn't require function props
 * Safe to use in Server Components
 */
export function AdminOwnershipTransferStandalone({ 
  cookbookId, 
  currentOwner
}: AdminOwnershipTransferStandaloneProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input to reduce re-renders (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Cached function to fetch users with improved caching
  const fetchUsersWithCache = useCallback(async (): Promise<User[]> => {
    const cacheKey = 'admin-users-list';
    
    // Return cached data if it's still valid
    const cachedUsers = userListCache.get(cacheKey);
    if (cachedUsers) {
      return cachedUsers;
    }
    
    // Return existing promise if one is in flight
    if (userFetchPromise) {
      return userFetchPromise;
    }
    
    // Create new fetch promise
    userFetchPromise = fetchWithRetry<{ users: User[] }>(
      "/api/admin/users",
      undefined,
      {
        maxRetries: 3,
        onRetry: (error, attempt, delay) => {
          console.log(`Retrying user fetch (attempt ${attempt}) after ${delay}ms:`, error.message);
          toast({
            title: "Connection issue",
            description: `Retrying... (attempt ${attempt})`,
            variant: "default",
          });
        },
      }
    ).then(data => {
      const users = data.users || [];
      // Update cache
      userListCache.set(cacheKey, users);
      userFetchPromise = null;
      return users;
    }).catch(error => {
      // Clear promise on error
      userFetchPromise = null;
      throw error;
    });
    
    return userFetchPromise;
  }, [toast]);

  // Fetch users on mount with caching
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const fetchedUsers = await fetchUsersWithCache();
        setUsers(fetchedUsers);
        setRetryCount(0);
      } catch (err) {
        console.error("Error fetching users:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to load users";
        setError(errorMessage);
        
        toast({
          title: "Error loading users",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [retryCount, fetchUsersWithCache]);

  // Filter users based on debounced search term and exclude current owner
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => user.id !== currentOwner.id);
    
    if (debouncedSearchTerm) {
      const lowerSearch = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerSearch) ||
          user.email.toLowerCase().includes(lowerSearch)
      );
    }
    
    return filtered;
  }, [users, debouncedSearchTerm, currentOwner.id]);

  // Handle manual retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Handle owner selection change
  const handleOwnerSelection = (user: User) => {
    setSelectedUser(user);
    setSearchTerm(user.name);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const transferOwnership = async () => {
    if (!selectedUser) return;

    setIsTransferring(true);
    try {
      const response = await fetch(`/api/admin/cookbooks/${cookbookId}/owner`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newOwnerId: selectedUser.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to transfer ownership');
      }

      toast({
        title: 'Success',
        description: `Ownership transferred to ${selectedUser.name}`,
      });

      // Reset state
      setSelectedUser(null);
      setSearchTerm('');
      setShowConfirmation(false);
      setIsOpen(false);

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to transfer ownership',
        variant: 'destructive',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Admin: Transfer Ownership</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Owner */}
        <div>
          <Label className="text-sm font-medium">Current Owner</Label>
          <div className="mt-2 p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">{currentOwner.name}</p>
                <p className="text-sm text-muted-foreground">{currentOwner.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-3 text-sm border border-destructive/50 bg-destructive/10 rounded-md" role="alert">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-destructive font-medium">Failed to load users</p>
              <p className="text-destructive/80 mt-1">{error}</p>
            </div>
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* User Selection Combobox */}
        {!showConfirmation && (
          <div className="space-y-2">
            <Label htmlFor="owner-select">Select New Owner *</Label>
            <p className="text-xs text-muted-foreground">
              Browse all users or search by name/email
            </p>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => !isLoading && !error && setIsOpen(!isOpen)}
                disabled={isLoading || !!error}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  !selectedUser && "text-muted-foreground"
                )}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-required="true"
                id="owner-select"
              >
                <span className="flex-1 text-left truncate">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading users...
                    </span>
                  ) : error ? (
                    "Error loading users"
                  ) : selectedUser ? (
                    <span className="flex flex-col">
                      <span className="font-medium">{selectedUser.name}</span>
                      <span className="text-xs text-muted-foreground">{selectedUser.email}</span>
                    </span>
                  ) : (
                    "Click to browse and select a user..."
                  )}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
              </button>

              {isOpen && !error && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-9"
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {filteredUsers.length === 0 ? (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        {debouncedSearchTerm ? (
                          <>
                            No users found matching "<strong>{debouncedSearchTerm}</strong>"
                          </>
                        ) : (
                          "No users available for transfer"
                        )}
                      </div>
                    ) : (
                      <>
                        {!debouncedSearchTerm && (
                          <div className="px-2 py-1 text-xs text-muted-foreground border-b mb-1">
                            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} available
                          </div>
                        )}
                        {filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleOwnerSelection(user)}
                            className={cn(
                              "relative flex w-full cursor-pointer select-none items-start rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left transition-colors",
                              user.id === selectedUser?.id && "bg-accent"
                            )}
                          >
                            <div className="flex items-start gap-2 w-full">
                              <Check
                                className={cn(
                                  "h-4 w-4 flex-shrink-0 mt-0.5 transition-opacity",
                                  user.id === selectedUser?.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="font-medium truncate w-full">{user.name}</span>
                                <span className="text-xs text-muted-foreground truncate w-full">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {selectedUser && (
              <div className="flex gap-2 mt-3">
                <Button 
                  onClick={() => setShowConfirmation(true)} 
                  variant="default" 
                  size="sm"
                >
                  Transfer Ownership
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchTerm('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        {selectedUser && showConfirmation && (
            <div className="space-y-3 p-4 border rounded-lg bg-destructive/10 border-destructive/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-destructive">Confirm Ownership Transfer</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Are you sure you want to transfer ownership of this cookbook from{' '}
                    <strong>{currentOwner.name}</strong> to <strong>{selectedUser.name}</strong>?
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This action cannot be undone. The new owner will have full control over the cookbook.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={transferOwnership} 
                  disabled={isTransferring}
                  variant="destructive" 
                  size="sm"
                >
                  {isTransferring ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirm Transfer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirmation(false)}
                  disabled={isTransferring}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}