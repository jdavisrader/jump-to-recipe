'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Plus, Search, Loader2 } from 'lucide-react';
import type { CollaboratorWithUser } from '@/types/admin-cookbook';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AdminCollaboratorManagerProps {
  cookbookId: string;
  collaborators: CollaboratorWithUser[];
  onUpdate?: () => void;
  refreshOnUpdate?: boolean;
}

export function AdminCollaboratorManager({ 
  cookbookId, 
  collaborators, 
  onUpdate,
  refreshOnUpdate = true
}: AdminCollaboratorManagerProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<'view' | 'edit'>('view');

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      const users = await response.json();
      setSearchResults(users);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addCollaborator = async () => {
    if (!selectedUser) return;

    setIsAdding(true);
    try {
      const response = await fetch(`/api/admin/cookbooks/${cookbookId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          permission: selectedPermission,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add collaborator');
      }

      toast({
        title: 'Success',
        description: `Added ${selectedUser.name} as a collaborator`,
      });

      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      
      // Handle callback or refresh
      if (onUpdate) {
        onUpdate();
      } else if (refreshOnUpdate) {
        // Default behavior: refresh the page
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add collaborator',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const removeCollaborator = async (userId: string, userName: string) => {
    setIsRemoving(userId);
    try {
      const response = await fetch(`/api/admin/cookbooks/${cookbookId}/collaborators/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove collaborator');
      }

      toast({
        title: 'Success',
        description: `Removed ${userName} as a collaborator`,
      });

      // Handle callback or refresh
      if (onUpdate) {
        onUpdate();
      } else if (refreshOnUpdate) {
        // Default behavior: refresh the page
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove collaborator',
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Admin: Manage Collaborators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Collaborators */}
        <div>
          <Label className="text-sm font-medium">Current Collaborators</Label>
          {collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">No collaborators</p>
          ) : (
            <div className="mt-2 space-y-2">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{collaborator.user.name}</p>
                    <p className="text-sm text-muted-foreground">{collaborator.user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      Permission: {collaborator.permission}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCollaborator(collaborator.userId, collaborator.user.name || 'User')}
                    disabled={isRemoving === collaborator.userId}
                  >
                    {isRemoving === collaborator.userId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Collaborator */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Add New Collaborator</Label>
          
          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="user-search" className="text-sm">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="user-search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-lg max-h-40 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  className="w-full p-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchQuery(user.name);
                    setSearchResults([]);
                  }}
                >
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </button>
              ))}
            </div>
          )}

          {/* Selected User and Permission */}
          {selectedUser && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
              <div>
                <Label className="text-sm">Selected User</Label>
                <p className="font-medium">{selectedUser.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              
              <div>
                <Label htmlFor="permission-select" className="text-sm">Permission Level</Label>
                <Select value={selectedPermission} onValueChange={(value: 'view' | 'edit') => setSelectedPermission(value)}>
                  <SelectTrigger id="permission-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={addCollaborator} disabled={isAdding} size="sm">
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Collaborator
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}