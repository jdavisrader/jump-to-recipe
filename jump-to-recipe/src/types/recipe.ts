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
  displayAmount?: string; // Original fraction format for display (e.g., "1½", "¾")
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
  description: string | null;
  ingredients: Ingredient[];
  instructions: Instruction[];
  ingredientSections?: Array<{
    id: string;
    name: string;
    order: number;
    items: Ingredient[];
  }>;
  instructionSections?: Array<{
    id: string;
    name: string;
    order: number;
    items: Instruction[];
  }>;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  difficulty: Difficulty | null;
  tags: string[];
  notes: string | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  authorId: string | null;
  visibility: Visibility;
  commentsEnabled: boolean;
  viewCount: number;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Type for creating a new recipe (without id and timestamps)
export type NewRecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> & {
  difficulty?: Difficulty | null;
};

// Extended recipe types for cookbook integration
export interface RecipeInCookbook {
  recipe: Recipe;
  position: number;
  addedAt: Date;
}

export interface RecipeWithCookbooks extends Recipe {
  cookbooks: {
    cookbook: {
      id: string;
      title: string;
      isOwned: boolean;
      permission: 'view' | 'edit' | 'owner';
    };
    position: number;
    addedAt: Date;
  }[];
}

// Extended recipe types for photos integration
export interface RecipeWithPhotos extends Recipe {
  photos: Array<{
    id: string;
    recipeId: string;
    filePath: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    position: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

// Recipe display context types
export interface RecipeDisplayContext {
  showAddToCookbook: boolean;
  userCanEdit: boolean;
  isOwner: boolean;
}