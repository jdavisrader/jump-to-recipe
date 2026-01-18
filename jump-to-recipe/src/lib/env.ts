import { z } from 'zod';
import 'dotenv/config';

// Define environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),
  
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Auth
  NEXTAUTH_URL: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  
  // OAuth Providers
  GOOGLE_ID: z.string().min(1),
  GOOGLE_SECRET: z.string().min(1),
  
  // File Storage
  MAX_RECIPE_PHOTO_SIZE_MB: z.string().regex(/^\d+$/).default('10').transform(Number),
  MAX_RECIPE_PHOTO_COUNT: z.string().regex(/^\d+$/).default('10').transform(Number),
});

// Parse and validate environment variables
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    parsed.error.issues.forEach(issue => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    throw new Error('Invalid environment variables');
  }
  
  return parsed.data;
}

export const env = validateEnv();
