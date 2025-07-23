'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Collaborator, CollaboratorPermission } from '@/types/cookbook';
import { UserCircle, X, Mail, Check, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CookbookCollaboratorsProps {
  cookbookId: string;
  collaborators: Collaborator[];
  isOwner: boolean;
  onCollaboratorsChange?: () => void;
}

export function CookbookCollaborators({
  cookbookId,
  collaborators,
  isOwner,
  onCollaboratorsChange,
}: CookbookCollaboratorsProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<CollaboratorPermission>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleShareCookbook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: email,
          permission,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to share cookbook');
      }
      
      toast({
        title: 'Cookbook shared',
        description: `Successfully shared with ${email}`,
      });
      
      setEmail('');
      if (onCollaboratorsChange) {
        onCollaboratorsChange();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to share cookbook',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, userId: string) => {
    setIsDeleting(prev => ({ ...prev, [collaboratorId]: true }));
    
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}/share?userId=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove collaborator');
      }
      
      toast({
        title: 'Collaborator removed',
        description: 'Successfully removed collaborator',
      });
      
      if (onCollaboratorsChange) {
        onCollaboratorsChange();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove collaborator',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(prev => ({ ...prev, [collaboratorId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Collaborators</h3>
      
      {/* Collaborators List */}
      <div className="space-y-4">
        {collaborators.length === 0 ? (
          <p className="text-muted-foreground">No collaborators yet</p>
        ) : (
          <div className="space-y-2">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex items-center gap-3">
                  {collaborator.user?.image ? (
                    <img
                      src={collaborator.user.image}
                      alt={collaborator.user?.name || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <UserCircle className="w-8 h-8 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{collaborator.user?.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{collaborator.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm px-2 py-1 rounded-full bg-secondary">
                    {collaborator.permission === 'edit' ? 'Editor' : 'Viewer'}
                  </span>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCollaborator(collaborator.id, collaborator.userId)}
                      disabled={isDeleting[collaborator.id]}
                    >
                      {isDeleting[collaborator.id] ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Share Form */}
      {isOwner && (
        <form onSubmit={handleShareCookbook} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Share with</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <Select
                value={permission}
                onValueChange={(value) => setPermission(value as CollaboratorPermission)}
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
              </Select>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="loading loading-spinner loading-xs mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Share
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}