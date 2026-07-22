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
}).superRefine((data, ctx) => {
  // Require NEXTAUTH_URL at runtime in production so NextAuth does not derive
  // the callback host from a (spoofable) Host header. Skip during the Next.js
  // build phase, where runtime env vars are not yet present.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (data.NODE_ENV === 'production' && !isBuildPhase && !data.NEXTAUTH_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['NEXTAUTH_URL'],
      message: 'NEXTAUTH_URL is required in production',
    });
  }
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
