// Recipe photo types
export interface RecipePhoto {
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
}

// Type for creating a new recipe photo (without id and timestamps)
export interface NewRecipePhoto {
  recipeId: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  position?: number;
}

// Type for recipe photo upload handling
export interface RecipePhotoUpload {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

// Type for photo reordering
export interface PhotoReorderRequest {
  photoId: string;
  newPosition: number;
}

// Type for bulk photo operations
export interface BulkPhotoOperation {
  action: 'reorder' | 'delete';
  photos: Array<{
    id: string;
    position?: number;
  }>;
}