import { Comment as DbComment, NewComment as DbNewComment } from '@/db/schema/comments';

// Extended comment type with user information
export interface CommentWithUser extends DbComment {
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

// Form data for creating comments
export interface CommentFormData {
  content: string;
  recipeId: string;
  isPrivateNote?: boolean;
}

// API response types
export interface CommentsResponse {
  comments: CommentWithUser[];
  total: number;
}

export interface CreateCommentResponse {
  comment: CommentWithUser;
  success: boolean;
}

// Re-export database types
export type Comment = DbComment;
export type NewComment = DbNewComment;

// Helper type for personal notes
export type PersonalNote = Comment & { isPrivateNote: true };
export type PublicComment = Comment & { isPrivateNote: false };