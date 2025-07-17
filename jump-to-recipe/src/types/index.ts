// Core application types

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
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

export interface Cookbook {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  recipes: Recipe[];
  createdAt: Date;
  updatedAt: Date;
}

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