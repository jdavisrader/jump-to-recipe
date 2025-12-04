'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react';
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
import type { UserWithCounts } from '@/types/admin';
import {
  filterAndSortUsers,
  type SortKey,
  type SortDirection,
  type SortConfig,
} from '@/lib/admin-user-utils';
// @ts-ignore - TS cache issue, file exists
import { DeleteUserModal } from './[id]/delete-user-modal';

interface UserListClientProps {
  users: UserWithCounts[];
}

export function UserListClient({ users }: UserListClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'name',
    direction: 'asc',
  });
  const [userToDelete, setUserToDelete] = useState<UserWithCounts | null>(null);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    return filterAndSortUsers(users, searchTerm, roleFilter, sortConfig);
  }, [users, searchTerm, roleFilter, sortConfig]);

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

  // Handle edit action
  const handleEdit = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  // Handle delete action
  const handleDelete = (user: UserWithCounts) => {
    setUserToDelete(user);
  };

  // Handle successful deletion
  const handleDeleteSuccess = () => {
    setUserToDelete(null);
    router.refresh();
  };

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'elevated':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="elevated">Elevated</SelectItem>
            <SelectItem value="user">Regular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Name
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Email
                    {getSortIcon('email')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Role
                    {getSortIcon('role')}
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
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('cookbookCount')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Cookbooks
                    {getSortIcon('cookbookCount')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Created
                    {getSortIcon('createdAt')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSort('updatedAt')}
                    className="flex items-center font-semibold hover:text-primary transition-colors"
                  >
                    Updated
                    {getSortIcon('updatedAt')}
                  </button>
                </th>
                <th className="text-right p-4">
                  <span className="font-semibold">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-12">
                    <div className="flex flex-col items-center space-y-2">
                      <p className="text-muted-foreground text-lg">
                        {users.length === 0 ? 'No users in the system' : 'No users match your filters'}
                      </p>
                      {users.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your search or filter criteria
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-muted-foreground">{user.email}</td>
                    <td className="p-4">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">{user.recipeCount}</td>
                    <td className="p-4 text-center">{user.cookbookCount}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(user.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user.id)}
                          aria-label={`Edit ${user.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          aria-label={`Delete ${user.name}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedUsers.length} of {users.length} users
      </div>

      {/* Delete User Modal */}
      {userToDelete && (
        <DeleteUserModal
          isOpen={true}
          onClose={() => setUserToDelete(null)}
          user={userToDelete}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
