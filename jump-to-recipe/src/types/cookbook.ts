import { Recipe } from './recipe';
import { User } from './index';

// Permission types for cookbook collaborators
export type CollaboratorPermission = 'view' | 'edit';

// Base Cookbook interface
export interface Cookbook {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  ownerId: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Cookbook with populated recipes
export interface CookbookWithRecipes extends Cookbook {
  recipes: {
    recipe: Recipe;
    position: number;
  }[];
}

// Cookbook with populated collaborators
export interface CookbookWithCollaborators extends Cookbook {
  collaborators: Collaborator[];
}

// Fully populated cookbook
export interface CookbookFull extends Cookbook {
  recipes: {
    recipe: Recipe;
    position: number;
  }[];
  collaborators: Collaborator[];
  owner: User | null;
}

// Collaborator interface
export interface Collaborator {
  id: string;
  userId: string;
  cookbookId: string;
  permission: CollaboratorPermission;
  invitedAt: Date;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

// Input types for creating/updating
export interface CookbookInput {
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isPublic: boolean;
}

export interface CookbookRecipeInput {
  recipeId: string;
  position: number;
}

export interface CollaboratorInput {
  userId: string;
  permission: CollaboratorPermission;
}

// Extended types for add-to-cookbook feature
export interface CookbookRecipeRelation {
  id: string;
  cookbookId: string;
  recipeId: string;
  position: number;
  addedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CookbookWithRecipeStatus extends Cookbook {
  hasRecipe: boolean;
  recipePosition?: number;
  recipeAddedAt?: Date;
}

// API operation types for cookbook-recipe management
export interface AddRecipeToCookbookInput {
  recipeId: string;
  position?: number; // Optional, defaults to end of list
}

export interface RemoveRecipeFromCookbookInput {
  recipeId: string;
}

export interface CookbookRecipeOperationResult {
  success: boolean;
  cookbookId: string;
  recipeId: string;
  operation: 'add' | 'remove';
  position?: number;
  message: string;
}