import { pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './_utils';
import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    image: text('image'),
    role: varchar('role', { length: 50 }).default('user').notNull(),
    ...timestamps,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;