'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RecipeCard } from '@/components/recipes';
import { CookbookVisibility } from './cookbook-visibility';
import { CookbookCollaborators } from './cookbook-collaborators';
import { CookbookImage } from './cookbook-image';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Globe, 
  Lock, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { CookbookFull } from '@/types/cookbook';
import type { Recipe } from '@/types/recipe';

interface CookbookDisplayProps {
  cookbook: CookbookFull;
  isOwner: boolean;
  canEdit: boolean;
}

export function CookbookDisplay({ cookbook, isOwner, canEdit }: CookbookDisplayProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDeleteCookbook = async () => {
    if (!isOwner) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/cookbooks/${cookbook.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete cookbook');
      }
      
      toast({
        title: 'Cookbook deleted',
        description: 'Your cookbook has been deleted successfully',
      });
      
      router.push('/cookbooks');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete cookbook',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleVisibilityChange = () => {
    router.refresh();
  };

  const handleCollaboratorsChange = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Cookbook Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Cover Image */}
        <div className="w-full md:w-1/3 aspect-square relative rounded-lg overflow-hidden">
          <CookbookImage
            src={cookbook.coverImageUrl}
            alt={cookbook.title}
            fill
            className="rounded-lg"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
        
        {/* Cookbook Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            {cookbook.isPublic ? (
              <Globe className="h-5 w-5 text-primary" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
            <h1 className="text-3xl font-bold">{cookbook.title}</h1>
          </div>
          
          {cookbook.description && (
            <p className="text-muted-foreground">{cookbook.description}</p>
          )}
          
          <div className="flex items-center gap-2">
            {cookbook.owner?.image ? (
              <Image
                src={cookbook.owner.image}
                alt={cookbook.owner.name || 'Owner'}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs">{cookbook.owner?.name?.charAt(0) || '?'}</span>
              </div>
            )}
            <span className="text-sm text-muted-foreground">
              Created by {cookbook.owner?.name || 'Unknown'}
            </span>
          </div>
          
          {/* Action Buttons */}
          {(isOwner || canEdit) && (
            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/cookbooks/${cookbook.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Cookbook
                  </Link>
                </Button>
              )}
              
              {canEdit && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/cookbooks/${cookbook.id}/add-recipes`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipes
                  </Link>
                </Button>
              )}
              
              {isOwner && !showConfirmDelete && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                  Delete Cookbook
                </Button>
              )}
              
              {isOwner && showConfirmDelete && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDeleteCookbook}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="h-4 w-4 mr-2" />
                    )}
                    Confirm Delete
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowConfirmDelete(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Recipes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recipes</h2>
          {canEdit && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/cookbooks/${cookbook.id}/add-recipes`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Recipes
              </Link>
            </Button>
          )}
        </div>
        
        {cookbook.recipes.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-muted-foreground">No recipes in this cookbook yet</p>
              {canEdit && (
                <Button asChild className="mt-4">
                  <Link href={`/cookbooks/${cookbook.id}/add-recipes`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipes
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cookbook.recipes
              .sort((a, b) => a.position - b.position)
              .map(({ recipe }) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe as Recipe}
                  compact
                />
              ))}
          </div>
        )}
      </div>
      
      {/* Sharing and Visibility Section */}
      {isOwner && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Sharing & Visibility</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CookbookVisibility
              cookbookId={cookbook.id}
              isPublic={cookbook.isPublic}
              isOwner={isOwner}
              onVisibilityChange={handleVisibilityChange}
            />
            
            <CookbookCollaborators
              cookbookId={cookbook.id}
              collaborators={cookbook.collaborators}
              isOwner={isOwner}
              onCollaboratorsChange={handleCollaboratorsChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}