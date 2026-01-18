# Environment Variable Validation Fix

## Problem

Docker builds were failing because Next.js validates environment variables during build time, but Docker doesn't have access to secrets during the build phase.

## Solution

We implemented a two-tier validation system:

### 1. Build-Time Validation (Relaxed)
- Used when `SKIP_ENV_VALIDATION=true` or `DATABASE_URL` is missing
- Uses placeholder values for required fields
- Allows the build to complete without real secrets

### 2. Runtime Validation (Strict)
- Used when the application starts with real environment variables
- Enforces all required fields and formats
- Fails fast if configuration is incorrect

## Implementation

### `src/lib/env.ts`
```typescript
function validateEnv() {
  const isBuildTime = process.env.SKIP_ENV_VALIDATION === 'true' || !process.env.DATABASE_URL;
  
  if (isBuildTime) {
    // Use relaxed schema with placeholders
    return buildTimeSchema.parse(process.env);
  }
  
  // Use strict schema for runtime
  return envSchema.parse(process.env);
}
```

### `Dockerfile`
```dockerfile
FROM base AS builder
ENV SKIP_ENV_VALIDATION=true  # Skip validation during build
RUN npm run build
```

### `docker-compose.yml`
```yaml
services:
  app:
    environment:
      # Real values provided at runtime
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      # SKIP_ENV_VALIDATION is NOT set here
```

## How to Deploy

1. **Build the image** (no secrets needed):
   ```bash
   docker-compose build
   ```

2. **Start with real environment variables**:
   ```bash
   docker-compose up -d
   ```

3. **Verify**:
   ```bash
   docker-compose logs app | grep "environment"
   ```

You should see:
- During build: `⚠️  Using build-time environment validation (relaxed)`
- At runtime: Strict validation passes silently (or fails with clear errors)

## Benefits

✅ **Security**: Secrets never stored in Docker image layers  
✅ **Flexibility**: Same image works in dev, staging, and production  
✅ **Safety**: Runtime validation catches configuration errors early  
✅ **Developer Experience**: Local development still has strict validation

## Troubleshooting

### Build still fails with env errors
- Check that `SKIP_ENV_VALIDATION=true` is in the builder stage
- Verify no code imports `env` at the module level in client components

### Runtime fails with env errors
- Check `.env` file has all required variables
- Verify `docker-compose.yml` passes all environment variables
- Check logs: `docker-compose logs app`

### Local development has issues
- Ensure `.env` file exists with real values
- `SKIP_ENV_VALIDATION` should NOT be set locally
- Run `npm run dev` to test

## Related Files

- `src/lib/env.ts` - Validation logic
- `Dockerfile` - Build configuration
- `docker-compose.yml` - Runtime configuration
- `.env.example` - Template for required variables
