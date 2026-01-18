# Docker Deployment Fixes - Design Document

## Overview

This design addresses critical production deployment failures in the Jump to Recipe Next.js 15 application when building with Docker. The root causes are violations of Next.js App Router rules that only surface during `next build` in production mode, specifically around client-only hooks, Suspense boundaries, and async params handling.

## Architecture

### Problem Analysis

The application has several architectural issues that prevent successful Docker deployment:

1. **Missing Suspense Boundaries**: Components using `useSearchParams()` are not wrapped in `<Suspense>`, causing prerender failures
2. **Client Component Async Params**: Client components receive `params` but don't handle them as Promises (Next.js 15 requirement)
3. **Improper Client/Server Boundaries**: Some components use client hooks without 'use client' directive
4. **Environment Validation Timing**: Env validation runs at build time when vars aren't available

### Solution Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Build Process                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Dependencies Installation                            │
│  2. Build Stage (SKIP_ENV_VALIDATION=true)              │
│     ├─ Relaxed env validation                           │
│     ├─ All pages prerender successfully                 │
│     └─ No Suspense boundary errors                      │
│  3. Runtime Stage                                        │
│     ├─ Strict env validation                            │
│     ├─ Real environment variables                       │
│     └─ Full functionality                               │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              Component Hierarchy Fixes                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Server Component (Page)                                │
│    └─ <Suspense fallback={...}>                        │
│         └─ Client Component (uses useSearchParams)      │
│                                                          │
│  Client Component Page (uses params)                    │
│    └─ useEffect(() => {                                 │
│         const getParams = async () => {                 │
│           const resolved = await params;                │
│         }                                                │
│       })                                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Suspense Boundary Pattern

**Affected Components:**
- `src/app/my-recipes/page.tsx` - Already has Suspense ✓
- `src/app/auth/login/page.tsx` - Already has Suspense ✓
- `src/app/auth/error/page.tsx` - Already has Suspense ✓
- `src/app/admin/layout.tsx` - Already has Suspense ✓
- `src/app/admin/cookbooks/page.tsx` - Needs Suspense around CookbookListClient
- `src/components/recipes/recipe-search.tsx` - Used in multiple places, parents need Suspense

**Pattern:**
```typescript
// Server Component (page.tsx)
export default async function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ClientComponentUsingSearchParams />
    </Suspense>
  );
}

// Client Component
'use client';
export function ClientComponentUsingSearchParams() {
  const searchParams = useSearchParams(); // Now safe
  // ...
}
```

### 2. Async Params Handling Pattern

**Affected Components:**
- `src/app/cookbooks/[id]/add-recipes/page.tsx` - Client component with Promise params

**Current (Broken):**
```typescript
'use client';
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Trying to use params.id directly - FAILS
}
```

**Fixed Pattern:**
```typescript
'use client';
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [cookbookId, setCookbookId] = useState<string>('');
  
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setCookbookId(resolvedParams.id);
    };
    getParams();
  }, [params]);
  
  // Use cookbookId state
}
```

### 3. Environment Validation Strategy

**File:** `src/lib/env.ts`

**Current Issue:** Validates strictly at import time, fails during Docker build

**Solution:**
```typescript
// Build-time schema (relaxed)
const buildTimeSchema = z.object({
  DATABASE_URL: z.string().default('postgresql://placeholder'),
  NEXTAUTH_SECRET: z.string().default('placeholder'),
  // ... all fields with defaults
});

// Runtime schema (strict)
const runtimeSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  // ... all fields required
});

function validateEnv() {
  const isBuildTime = 
    process.env.SKIP_ENV_VALIDATION === 'true' || 
    !process.env.DATABASE_URL;
  
  if (isBuildTime) {
    console.log('⚠️  Build-time validation (relaxed)');
    return buildTimeSchema.parse(process.env);
  }
  
  console.log('✅ Runtime validation (strict)');
  return runtimeSchema.parse(process.env);
}
```

### 4. RecipeSearch Component Integration

**Problem:** RecipeSearch uses `useSearchParams()` but is used in multiple pages without consistent Suspense wrapping

**Pages Using RecipeSearch:**
- `src/app/my-recipes/page.tsx` - Has Suspense ✓
- `src/app/recipes/RecipesClient.tsx` - Needs Suspense check

**Solution:** Ensure every usage is wrapped:
```typescript
<Suspense fallback={<SearchSkeleton />}>
  <RecipeSearch onSearch={handleSearch} />
</Suspense>
```

## Data Models

### Environment Configuration

```typescript
interface EnvironmentConfig {
  // Database
  DATABASE_URL: string;
  
  // Auth
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET: string;
  
  // OAuth
  GOOGLE_ID: string;
  GOOGLE_SECRET: string;
  
  // App
  NODE_ENV: 'development' | 'test' | 'production';
  
  // File Storage
  MAX_RECIPE_PHOTO_SIZE_MB: number;
  MAX_RECIPE_PHOTO_COUNT: number;
}

interface ValidationMode {
  mode: 'build' | 'runtime';
  strict: boolean;
  skipValidation: boolean;
}
```

### Component Props Patterns

```typescript
// Server Component with dynamic params
interface ServerPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Client Component with dynamic params
interface ClientPageProps {
  params: Promise<{ id: string }>;
}
```

## Error Handling

### Build-Time Errors

**Error:** `Error: useSearchParams() should be wrapped in a suspense boundary`

**Detection:** Occurs during `next build` when prerendering pages

**Resolution:**
1. Identify component using `useSearchParams()`
2. Ensure it's marked with 'use client'
3. Wrap component usage in `<Suspense>` in parent
4. Provide appropriate fallback UI

**Error:** `Error: params is a Promise but accessed synchronously`

**Detection:** Occurs in client components during build

**Resolution:**
1. Add state to store resolved params
2. Use `useEffect` to resolve params asynchronously
3. Handle loading state while params resolve

### Runtime Errors

**Error:** `Invalid environment variables`

**Detection:** Occurs when container starts with missing/invalid env vars

**Resolution:**
1. Check docker-compose.yml has all required env vars
2. Verify .env file is properly configured
3. Ensure env vars are passed to container

## Testing Strategy

### Build Validation Tests

```bash
# Test 1: Docker build succeeds
docker-compose build
# Expected: Build completes without errors

# Test 2: Prerender succeeds
# Check build output for:
# ✓ Generating static pages
# ○ /page (static)
# ○ /recipes (static)
# etc.

# Test 3: No Suspense errors
# Build output should NOT contain:
# "useSearchParams() should be wrapped in a suspense boundary"
```

### Runtime Validation Tests

```bash
# Test 1: Container starts successfully
docker-compose up -d
docker-compose logs app | grep "Ready"

# Test 2: Environment validation works
docker-compose logs app | grep "Runtime validation"

# Test 3: Pages load correctly
curl http://localhost:3000/
curl http://localhost:3000/recipes
curl http://localhost:3000/my-recipes
```

### Functional Tests

1. **Search Functionality**
   - Navigate to /my-recipes
   - Use search filters
   - Verify URL updates with query params
   - Verify results update correctly

2. **Admin Panel**
   - Navigate to /admin/cookbooks
   - Use search and filters
   - Verify pagination works
   - Verify no console errors

3. **Dynamic Routes**
   - Navigate to /cookbooks/[id]
   - Verify page loads correctly
   - Navigate to /cookbooks/[id]/add-recipes
   - Verify params are resolved

## Performance Considerations

### Build Performance

- Relaxed validation during build reduces build time
- No runtime overhead from validation logic
- Prerendering still works for static pages

### Runtime Performance

- Strict validation only runs once at startup
- No performance impact on page loads
- Suspense boundaries add minimal overhead
- Async params resolution happens once per page load

## Security Considerations

### Environment Variables

- Build-time: Uses placeholder values (safe, no secrets exposed)
- Runtime: Requires real values (strict validation)
- Secrets never logged or exposed in build output
- Validation errors don't leak sensitive information

### Component Boundaries

- Client components properly isolated
- Server components don't leak server-only data
- Suspense boundaries prevent hydration mismatches
- Async params prevent race conditions

## Migration Path

### Phase 1: Fix Critical Build Blockers
1. Add Suspense to CookbookListClient usage
2. Fix async params in add-recipes page
3. Verify env validation works

### Phase 2: Validate Build
1. Run `docker-compose build`
2. Check for prerender errors
3. Verify all pages build successfully

### Phase 3: Runtime Testing
1. Start containers
2. Test all affected pages
3. Verify functionality unchanged

### Phase 4: Deployment
1. Deploy to staging
2. Run smoke tests
3. Deploy to production

## Rollback Plan

If issues occur:
1. Revert to previous Docker image
2. Investigate specific failure
3. Apply targeted fix
4. Rebuild and redeploy

All changes are isolated to specific files and can be reverted independently.
