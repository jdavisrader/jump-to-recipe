import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { env } from '@/lib/env';
import * as schema from './schema';

// For migrations
export const migrationClient = postgres(env.DATABASE_URL, { max: 1 });

// For query purposes
export const queryClient = postgres(env.DATABASE_URL);

export const db = drizzle(queryClient, { schema });

// Function to run migrations programmatically if needed
export async function runMigrations() {
  const migrationsClient = postgres(env.DATABASE_URL, { max: 1 });
  const migrationsDb = drizzle(migrationsClient);

  try {
    console.log('Running migrations...');
    await migrate(migrationsDb, { migrationsFolder: 'src/db/migrations' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await migrationsClient.end();
  }
}