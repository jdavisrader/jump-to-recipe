// Core application types
export * from './recipe';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy Recipe interface - will be replaced by the one in recipe.ts
// Keeping for backward compatibility until all code is updated
export interface LegacyRecipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl?: string;
  sourceUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Cookbook interfaces moved to cookbook.ts
export type { Cookbook, CookbookWithRecipes } from './cookbook';

export interface GroceryList {
  id: string;
  title: string;
  items: GroceryItem[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  isCompleted: boolean;
}

// Form types
export interface RecipeFormData {
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags: string[];
  imageUrl?: string;
  sourceUrl?: string;
}

export interface CookbookFormData {
  title: string;
  description?: string;
  isPublic: boolean;
}