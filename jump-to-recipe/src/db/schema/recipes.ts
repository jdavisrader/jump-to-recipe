import { pgTable, text, varchar, integer, jsonb, uuid } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { timestamps } from './_utils';
import { sql } from 'drizzle-orm';
import { users } from './users';

// Define enums for recipe properties
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard']);
export const visibilityEnum = pgEnum('visibility', ['public', 'private']);

export const recipes = pgTable('recipes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  ingredients: jsonb('ingredients').notNull(),
  instructions: jsonb('instructions').notNull(),
  prepTime: integer('prep_time'),
  cookTime: integer('cook_time'),
  servings: integer('servings'),
  difficulty: difficultyEnum('difficulty'),
  tags: text('tags').array(),
  notes: text('notes'),
  imageUrl: text('image_url'),
  sourceUrl: text('source_url'),
  authorId: uuid('author_id').references(() => users.id),
  visibility: visibilityEnum('visibility').default('private').notNull(),
  ...timestamps,
});

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;