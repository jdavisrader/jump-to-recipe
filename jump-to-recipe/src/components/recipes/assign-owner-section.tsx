"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, RefreshCw, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { fetchWithRetry } from "@/lib/api-retry";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { ComponentCache } from "@/lib/performance-cache";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AssignOwnerSectionProps {
  currentOwnerId: string;
  currentOwnerName: string;
  currentOwnerEmail: string;
  onOwnerChange: (newOwnerId: string) => void;
  isAdmin: boolean;
}

// Global cache instance for user list to avoid repeated fetches across components
const userListCache = new ComponentCache<User[]>(5 * 60 * 1000); // 5 minutes TTL

// In-flight request tracking to prevent duplicate requests
let userFetchPromise: Promise<User[]> | null = null;

export function AssignOwnerSection({
  currentOwnerId,
  currentOwnerName,
  currentOwnerEmail,
  onOwnerChange,
  isAdmin,
}: AssignOwnerSectionProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState(currentOwnerId);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  // Only render for admins
  if (!isAdmin) return null;

  // Get selected user details
  const selectedUser = users.find(u => u.id === selectedOwnerId);

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

  // Filter users based on debounced search term
  const filteredUsers = useMemo(() => {
    if (!debouncedSearchTerm) return users;
    
    const lowerSearch = debouncedSearchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerSearch) ||
        user.email.toLowerCase().includes(lowerSearch)
    );
  }, [users, debouncedSearchTerm]);

  // Handle owner selection change
  const handleOwnerChange = (newOwnerId: string) => {
    setSelectedOwnerId(newOwnerId);
    onOwnerChange(newOwnerId);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Handle manual retry
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Owner</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Transfer recipe ownership to another user (admin only)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <div className="space-y-2">
          <Label htmlFor="owner-select">Recipe Owner *</Label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => !isLoading && setIsOpen(!isOpen)}
              disabled={isLoading}
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
                  "Loading users..."
                ) : selectedUser ? (
                  <span className="flex flex-col">
                    <span className="font-medium">{selectedUser.name}</span>
                    <span className="text-xs text-muted-foreground">{selectedUser.email}</span>
                  </span>
                ) : (
                  "Search and select a user..."
                )}
              </span>
              <ChevronsUpDown className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
            </button>

            {isOpen && (
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
                      {searchTerm ? "No users found" : "No users available"}
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleOwnerChange(user.id)}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-start rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground text-left",
                          user.id === selectedOwnerId && "bg-accent"
                        )}
                      >
                        <div className="flex items-start gap-2 w-full">
                          <Check
                            className={cn(
                              "h-4 w-4 flex-shrink-0 mt-0.5",
                              user.id === selectedOwnerId ? "opacity-100" : "opacity-0"
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
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {selectedOwnerId === currentOwnerId && (
            <p className="text-xs text-muted-foreground">
              Current owner: {currentOwnerName} ({currentOwnerEmail})
            </p>
          )}
          
          {!selectedOwnerId && (
            <p className="text-xs text-destructive" role="alert">
              Owner is required
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
