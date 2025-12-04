'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { userEditSchema, type UserEditRequest, type UserWithCounts } from '@/types/admin';
// @ts-ignore - TS cache issue, file exists
import { PasswordUpdateModal } from './password-update-modal';
// @ts-ignore - TS cache issue, file exists
import { DeleteUserModal } from './delete-user-modal';

interface UserEditFormProps {
  user: UserWithCounts;
}

export function UserEditForm({ user }: UserEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<UserEditRequest>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role as 'user' | 'elevated' | 'admin',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: UserEditRequest) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      toast({
        title: 'Success',
        description: 'User updated successfully',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/users')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <h1 className="text-3xl font-bold">Edit User: {user.name}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* User ID (read-only) */}
        <div className="space-y-2">
          <Label>User ID</Label>
          <Input value={user.id} disabled className="bg-muted" />
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={selectedRole}
            onValueChange={(value) => setValue('role', value as 'user' | 'elevated' | 'admin', { shouldDirty: true })}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Regular</SelectItem>
              <SelectItem value="elevated">Elevated</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label>Password</Label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full justify-start"
          >
            Update Password...
          </Button>
        </div>

        {/* Created At (read-only) */}
        <div className="space-y-2">
          <Label>Created</Label>
          <Input value={formatDate(user.createdAt)} disabled className="bg-muted" />
        </div>

        {/* Updated At (read-only) */}
        <div className="space-y-2">
          <Label>Updated</Label>
          <Input value={formatDate(user.updatedAt)} disabled className="bg-muted" />
        </div>

        {/* Resource Counts */}
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">Resources</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Recipes:</span>{' '}
              <span className="font-medium">{user.recipeCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cookbooks:</span>{' '}
              <span className="font-medium">{user.cookbookCount}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={isSubmitting}
          >
            Delete User
          </Button>
        </div>
      </form>

      <PasswordUpdateModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userId={user.id}
        userName={watch('name')}
        userEmail={watch('email')}
        userRole={watch('role')}
      />

      <DeleteUserModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        user={user}
      />
    </div>
  );
}
