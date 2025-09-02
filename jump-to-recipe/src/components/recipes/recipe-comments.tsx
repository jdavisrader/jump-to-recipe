'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CommentWithUser, CommentFormData } from '@/types/comment';
import { MessageCircle, Lock, Eye, EyeOff, StickyNote } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecipeCommentsProps {
  recipeId: string;
  recipeAuthorId: string;
  commentsEnabled: boolean;
  onCommentsEnabledChange?: (enabled: boolean) => void;
  isRecipeOwner: boolean;
}

export function RecipeComments({
  recipeId,
  commentsEnabled,
  onCommentsEnabledChange,
  isRecipeOwner,
}: RecipeCommentsProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(false);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      } else {
        console.error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    fetchComments();
  }, [recipeId, fetchComments]);

  // Submit comment or note
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.id) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to add comments or notes.',
        variant: 'destructive',
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: 'Content required',
        description: 'Please enter some content for your comment or note.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          isPrivateNote,
        } as CommentFormData),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment('');
        toast({
          title: 'Success',
          description: isPrivateNote 
            ? 'Your private note has been saved.' 
            : 'Your comment has been posted.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to post comment.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle comments enabled
  const handleToggleComments = async (enabled: boolean) => {
    if (!isRecipeOwner) return;

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentsEnabled: enabled,
        }),
      });

      if (response.ok) {
        onCommentsEnabledChange?.(enabled);
        toast({
          title: 'Settings updated',
          description: `Comments have been ${enabled ? 'enabled' : 'disabled'}.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update comment settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating comment settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update comment settings.',
        variant: 'destructive',
      });
    }
  };

  // Separate comments and notes
  const publicComments = comments.filter(c => !c.isPrivateNote);
  const privateNotes = comments.filter(c => c.isPrivateNote);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments ({publicComments.length})
            </CardTitle>
            {isRecipeOwner && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="comments-enabled"
                  checked={commentsEnabled}
                  onCheckedChange={handleToggleComments}
                />
                <Label htmlFor="comments-enabled" className="text-sm">
                  {commentsEnabled ? (
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      Enabled
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <EyeOff className="h-4 w-4" />
                      Disabled
                    </span>
                  )}
                </Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Comment Form */}
          {session?.user?.id && (commentsEnabled || isRecipeOwner) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <RichTextEditor
                value={newComment}
                onChange={setNewComment}
                placeholder={isPrivateNote ? "Add a private note..." : "Add a comment..."}
                disabled={submitting}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="private-note"
                    checked={isPrivateNote}
                    onCheckedChange={setIsPrivateNote}
                  />
                  <Label htmlFor="private-note" className="text-sm flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    Private note (only you can see this)
                  </Label>
                </div>
                <Button type="submit" disabled={submitting || !newComment.trim()}>
                  {submitting ? 'Posting...' : (isPrivateNote ? 'Save Note' : 'Post Comment')}
                </Button>
              </div>
            </form>
          )}

          {!commentsEnabled && !isRecipeOwner && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Comments are disabled for this recipe.</p>
            </div>
          )}

          {/* Comments List */}
          {publicComments.length > 0 ? (
            <div className="space-y-4">
              {publicComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.image || ''} />
                    <AvatarFallback>
                      {comment.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{comment.user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div 
                      className="prose prose-sm max-w-none text-sm"
                      dangerouslySetInnerHTML={{
                        __html: comment.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
                          .replace(/^- (.+)$/gm, '<li>$1</li>')
                          .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
                          .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
                          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                          .replace(/\n/g, '<br>')
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : commentsEnabled && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Private Notes Section */}
      {session?.user?.id && privateNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              My Private Notes ({privateNotes.length})
              <Badge variant="secondary" className="ml-2">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {privateNotes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div 
                  className="prose prose-sm max-w-none text-sm"
                  dangerouslySetInnerHTML={{
                    __html: note.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
                      .replace(/^- (.+)$/gm, '<li>$1</li>')
                      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
                      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
                      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}