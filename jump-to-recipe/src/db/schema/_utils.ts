import { timestamp } from 'drizzle-orm/pg-core';

// Common timestamp columns for all tables
export const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
};