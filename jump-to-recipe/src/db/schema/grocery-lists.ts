import { pgTable, text, varchar, uuid, jsonb } from 'drizzle-orm/pg-core';
import { timestamps } from './_utils';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const groceryLists = pgTable('grocery_lists', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  items: jsonb('items').notNull(),
  generatedFrom: uuid('generated_from').array(),
  ...timestamps,
});

export type GroceryList = typeof groceryLists.$inferSelect;
export type NewGroceryList = typeof groceryLists.$inferInsert;