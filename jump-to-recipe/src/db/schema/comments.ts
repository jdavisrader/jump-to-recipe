import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_utils';
import { users } from './users';
import { recipes } from './recipes';

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  ...timestamps,
});

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;