// Drizzle Kit configuration for production Docker builds
// Uses CommonJS for compatibility without TypeScript execution
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/** @type {import('drizzle-kit').Config} */
module.exports = {
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
};
