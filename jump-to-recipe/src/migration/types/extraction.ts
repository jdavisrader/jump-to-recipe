/**
 * Type definitions for extraction phase
 */

export interface LegacyUser {
  id: number;
  email: string;
  username: string | null;
  encrypted_password: string;
  super_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface LegacyRecipe {
  id: number;
  name: string;
  user_id: number;
  description: string | null;
  servings: number | null;
  prep_time: number | null;
  prep_time_descriptor: string | null;
  cook_time: number | null;
  cook_time_descriptor: string | null;
  original_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyActiveStorageAttachment {
  id: number;
  name: string; // 'image' or 'original_recipe_photo'
  record_type: string; // 'Recipe'
  record_id: number; // recipe id
  blob_id: number;
  created_at: string;
}

export interface LegacyActiveStorageBlob {
  id: number;
  key: string; // Storage key/path
  filename: string;
  content_type: string | null;
  metadata: string | null; // JSON string
  service_name: string;
  byte_size: number;
  checksum: string | null;
  created_at: string;
}

export interface LegacyIngredient {
  id: number;
  recipe_id: number;
  order_number: number;
  ingredient: string;
  created_at: string;
  updated_at: string;
}

export interface LegacyInstruction {
  id: number;
  recipe_id: number;
  step_number: number;
  step: string;
  created_at: string;
  updated_at: string;
}

export interface LegacyTag {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface LegacyRecipeTag {
  id: number;
  recipe_id: number;
  tag_id: number;
  created_at: string;
  updated_at: string;
}

export interface ExportMetadata {
  exportTimestamp: string;
  legacyDatabaseVersion: string;
  recordCounts: {
    users: number;
    recipes: number;
    ingredients: number;
    instructions: number;
    tags: number;
    recipe_tags: number;
    active_storage_attachments: number;
    active_storage_blobs: number;
  };
  checksums: Record<string, string>;
  outputDirectory: string;
}

export interface ExtractionResult {
  success: boolean;
  metadata: ExportMetadata;
  outputDir: string;
  errors: string[];
}
