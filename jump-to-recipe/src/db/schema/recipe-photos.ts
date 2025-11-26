import { pgTable, text, varchar, integer, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { timestamps } from './_utils';
import { recipes } from './recipes';

export const recipePhotos = pgTable('recipe_photos', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  position: integer('position').notNull().default(0),
  deletedAt: timestamp('deleted_at'),
  ...timestamps,
}, (table) => ({
  recipeIdIdx: index('idx_recipe_photos_recipe_id').on(table.recipeId),
  positionIdx: index('idx_recipe_photos_position').on(table.recipeId, table.position).where(sql`${table.deletedAt} IS NULL`),
}));

export type RecipePhoto = typeof recipePhotos.$inferSelect;
export type NewRecipePhoto = typeof recipePhotos.$inferInsert;