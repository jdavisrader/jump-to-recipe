'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Globe, Lock, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CookbookVisibilityProps {
  cookbookId: string;
  isPublic: boolean;
  isOwner: boolean;
  onVisibilityChange?: (isPublic: boolean) => void;
}

export function CookbookVisibility({
  cookbookId,
  isPublic,
  isOwner,
  onVisibilityChange,
}: CookbookVisibilityProps) {
  const [visibility, setVisibility] = useState(isPublic);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleVisibilityChange = async () => {
    if (!isOwner) return;
    
    const newVisibility = !visibility;
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: newVisibility,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update cookbook visibility');
      }
      
      setVisibility(newVisibility);
      toast({
        title: 'Visibility updated',
        description: `Cookbook is now ${newVisibility ? 'public' : 'private'}`,
      });
      
      if (onVisibilityChange) {
        onVisibilityChange(newVisibility);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update visibility',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Visibility</h3>
      
      <div className="flex items-center justify-between p-4 border rounded-md">
        <div className="flex items-center gap-3">
          {visibility ? (
            <Globe className="w-5 h-5 text-primary" />
          ) : (
            <Lock className="w-5 h-5 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">{visibility ? 'Public' : 'Private'}</p>
            <p className="text-sm text-muted-foreground">
              {visibility
                ? 'Anyone can view this cookbook'
                : 'Only you and collaborators can view this cookbook'}
            </p>
          </div>
        </div>
        
        {isOwner && (
          <div className="flex items-center gap-2">
            <Switch
              id="visibility"
              checked={visibility}
              onCheckedChange={() => handleVisibilityChange()}
              disabled={isSubmitting || !isOwner}
            />
            <Label htmlFor="visibility" className="sr-only">
              Toggle visibility
            </Label>
          </div>
        )}
      </div>
    </div>
  );
}