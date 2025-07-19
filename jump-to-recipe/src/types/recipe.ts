// Unit types for ingredients
export type UnitSystem = 'metric' | 'imperial';
export type MetricUnit = 'g' | 'kg' | 'ml' | 'l' | 'tsp' | 'tbsp' | 'cup' | 'pinch' | '';
export type ImperialUnit = 'oz' | 'lb' | 'fl oz' | 'cup' | 'pint' | 'quart' | 'gallon' | 'tsp' | 'tbsp' | 'pinch' | '';
export type Unit = MetricUnit | ImperialUnit;

// Difficulty levels
export type Difficulty = 'easy' | 'medium' | 'hard';

// Visibility options
export type Visibility = 'public' | 'private';

// Base interfaces
export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: Unit;
  notes?: string;
  category?: string;
}

export interface Instruction {
  id: string;
  step: number;
  content: string;
  duration?: number; // in minutes
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings?: number;
  difficulty?: Difficulty;
  tags: string[];
  notes?: string;
  imageUrl?: string;
  sourceUrl?: string;
  authorId: string;
  visibility: Visibility;
  createdAt: Date;
  updatedAt: Date;
}

// Type for creating a new recipe (without id and timestamps)
export type NewRecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>;