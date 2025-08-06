'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Lock, Loader2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { CookbookImageUpload } from './cookbook-image-upload';
import type { Cookbook } from '@/types/cookbook';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  description: z.string().nullable(),
  coverImageUrl: z.union([
    z.string().min(1),
    z.string().length(0),
    z.literal(''),
    z.null()
  ]).transform(val => val === '' ? null : val),
  isPublic: z.boolean().default(false),
});

// Define the form values type from the schema
type FormValues = z.infer<typeof formSchema>;

interface CookbookFormProps {
  cookbook?: Cookbook;
  onSuccess?: (cookbook: Cookbook) => void;
}

export function CookbookForm({ cookbook, onSuccess }: CookbookFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing cookbook data or defaults
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: cookbook?.title || '',
      description: cookbook?.description || '',
      coverImageUrl: cookbook?.coverImageUrl || '',
      isPublic: cookbook?.isPublic || false,
    },
  });

  const isPublic = watch('isPublic');
  const coverImageUrl = watch('coverImageUrl');

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      const url = cookbook
        ? `/api/cookbooks/${cookbook.id}`
        : '/api/cookbooks';

      const method = cookbook ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save cookbook');
      }

      toast({
        title: cookbook ? 'Cookbook updated' : 'Cookbook created',
        description: cookbook
          ? 'Your cookbook has been updated successfully'
          : 'Your new cookbook has been created',
      });

      if (onSuccess) {
        onSuccess(result.cookbook);
      } else {
        router.push(`/cookbooks/${result.cookbook.id}`);
        router.refresh();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save cookbook',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="My Favorite Recipes"
            {...register('title')}
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="A collection of my favorite recipes..."
            {...register('description')}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <CookbookImageUpload
            value={coverImageUrl || ""}
            onChange={(url) => setValue('coverImageUrl', url)}
            onRemove={() => setValue('coverImageUrl', "")}
            disabled={isSubmitting}
          />
          {errors.coverImageUrl && (
            <p className="text-sm text-destructive">{errors.coverImageUrl.message}</p>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-primary" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">{isPublic ? 'Public' : 'Private'}</p>
                  <p className="text-sm text-muted-foreground">
                    {isPublic
                      ? 'Anyone can view this cookbook'
                      : 'Only you and collaborators can view this cookbook'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isPublic"
                  checked={isPublic}
                  onCheckedChange={(checked: boolean) => setValue('isPublic', checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isPublic" className="sr-only">
                  Make cookbook public
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {cookbook ? 'Update Cookbook' : 'Create Cookbook'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}