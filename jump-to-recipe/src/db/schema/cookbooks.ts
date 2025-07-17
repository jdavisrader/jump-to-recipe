import { pgTable, text, varchar, uuid, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { timestamps } from './_utils';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { recipes } from './recipes';

export const cookbooks = pgTable('cookbooks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  coverImageUrl: text('cover_image_url'),
  ownerId: uuid('owner_id').references(() => users.id),
  isPublic: boolean('is_public').default(false).notNull(),
  ...timestamps,
});

export const cookbookRecipes = pgTable('cookbook_recipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  cookbookId: uuid('cookbook_id').references(() => cookbooks.id, { onDelete: 'cascade' }).notNull(),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }).notNull(),
  position: integer('position').notNull(),
  addedAt: timestamp('added_at').defaultNow().notNull(),
  ...timestamps,
});

export const cookbookCollaborators = pgTable('cookbook_collaborators', {
  id: uuid('id').primaryKey().defaultRandom(),
  cookbookId: uuid('cookbook_id').references(() => cookbooks.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  permission: varchar('permission', { length: 50 }).default('view').notNull(),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
  ...timestamps,
});

export type Cookbook = typeof cookbooks.$inferSelect;
export type NewCookbook = typeof cookbooks.$inferInsert;
export type CookbookRecipe = typeof cookbookRecipes.$inferSelect;
export type NewCookbookRecipe = typeof cookbookRecipes.$inferInsert;
export type CookbookCollaborator = typeof cookbookCollaborators.$inferSelect;
export type NewCookbookCollaborator = typeof cookbookCollaborators.$inferInsert;