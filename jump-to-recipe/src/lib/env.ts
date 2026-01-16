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

// Build-time schema (less strict for Docker builds)
const buildTimeSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  DATABASE_URL: z.string().optional().default('postgresql://placeholder'),
  NEXTAUTH_SECRET: z.string().optional().default('placeholder'),
  NEXTAUTH_URL: z.string().optional(),
  GOOGLE_ID: z.string().optional().default('placeholder'),
  GOOGLE_SECRET: z.string().optional().default('placeholder'),
  MAX_RECIPE_PHOTO_SIZE_MB: z.string().optional().default('10'),
  MAX_RECIPE_PHOTO_COUNT: z.string().optional().default('10'),
});

// Parse and validate environment variables
function validateEnv() {
  // During build time (when SKIP_ENV_VALIDATION is set or no DATABASE_URL), use relaxed validation
  const isBuildTime = process.env.SKIP_ENV_VALIDATION === 'true' || !process.env.DATABASE_URL;

  if (isBuildTime) {
    console.log('⚠️  Using build-time environment validation (relaxed)');
    const parsed = buildTimeSchema.safeParse(process.env);
    return parsed.success ? parsed.data : buildTimeSchema.parse({});
  }

  // Runtime validation (strict)
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