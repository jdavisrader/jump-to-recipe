import { z } from 'zod';
import 'dotenv/config';

// Define environment variable schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Auth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  
  // OAuth Providers
  GOOGLE_ID: z.string().min(1),
  GOOGLE_SECRET: z.string().min(1),
});

// Parse and validate environment variables
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  
  return parsed.data;
}

export const env = validateEnv();