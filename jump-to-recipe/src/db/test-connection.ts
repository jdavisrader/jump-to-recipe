import { db } from './index';
import { users } from './schema';
import { sql } from 'drizzle-orm';

async function testConnection() {
  try {
    // Test the database connection with a simple query
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('Database connection successful:', result);
    
    // Test a simple query against the users table
    console.log('Testing users table query...');
    const usersCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    console.log('Users count:', usersCount[0].count);
    
    console.log('All database tests passed!');
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testConnection()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}