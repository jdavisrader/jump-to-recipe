# Docker Deployment Fixes - Requirements Document

## Introduction

This document outlines the requirements for fixing critical production deployment issues in the Jump to Recipe Next.js application when deploying via Docker. The application currently fails during `next build` due to improper use of client-only React hooks without Suspense boundaries, async params handling issues, and other Next.js App Router violations that surface only during production builds.

## Requirements

### Requirement 1: Fix useSearchParams Without Suspense Boundaries

**User Story:** As a DevOps engineer, I want the Docker build to succeed without prerender errors, so that I can deploy the application to production.

#### Acceptance Criteria

1. WHEN a component uses `useSearchParams()` THEN it SHALL be wrapped in a `<Suspense>` boundary
2. WHEN `useSearchParams()` is used in a client component THEN the parent page SHALL provide a Suspense fallback
3. WHEN the build runs THEN it SHALL NOT fail with "useSearchParams() should be wrapped in a suspense boundary" errors
4. IF a component is already client-side THEN it SHALL still require Suspense when using `useSearchParams()`

### Requirement 2: Fix Client Component Async Params Handling

**User Story:** As a developer, I want dynamic route params to be handled correctly in client components, so that the application works in both development and production.

#### Acceptance Criteria

1. WHEN a client component receives `params` as a prop THEN it SHALL handle it as a Promise in Next.js 15
2. WHEN params are accessed in a client component THEN they SHALL be unwrapped using `use()` hook or `await` in useEffect
3. WHEN the build runs THEN it SHALL NOT fail with async params-related errors
4. IF a page is marked with 'use client' THEN params SHALL be treated as Promise<{ id: string }>

### Requirement 3: Ensure Proper Client/Server Component Boundaries

**User Story:** As a developer, I want clear separation between client and server components, so that the application prerenders correctly.

#### Acceptance Criteria

1. WHEN a component uses client-only hooks (useRouter, usePathname, useSearchParams) THEN it SHALL be marked with 'use client'
2. WHEN a server component imports a client component THEN it SHALL NOT cause prerender failures
3. WHEN the build runs THEN all components SHALL be correctly classified as client or server
4. IF a component needs client features THEN it SHALL be explicitly marked as a client component

### Requirement 4: Fix Environment Variable Validation

**User Story:** As a DevOps engineer, I want environment validation to work correctly during Docker builds, so that builds succeed without compromising runtime security.

#### Acceptance Criteria

1. WHEN Docker builds the image THEN environment validation SHALL use relaxed mode
2. WHEN the container starts at runtime THEN environment validation SHALL use strict mode
3. WHEN required env vars are missing at runtime THEN the application SHALL fail with clear error messages
4. IF SKIP_ENV_VALIDATION is set THEN build-time validation SHALL use placeholder values

### Requirement 5: Verify All Pages Can Prerender

**User Story:** As a developer, I want all static pages to prerender successfully, so that the application has optimal performance.

#### Acceptance Criteria

1. WHEN `next build` runs THEN all static pages SHALL prerender without errors
2. WHEN a page cannot be static THEN it SHALL be explicitly marked as dynamic
3. WHEN the build completes THEN the build output SHALL show successful prerendering
4. IF a page uses dynamic features THEN it SHALL opt out of static generation appropriately

### Requirement 6: Fix RecipeSearch Component Suspense

**User Story:** As a user, I want the recipe search to work reliably, so that I can find recipes without errors.

#### Acceptance Criteria

1. WHEN RecipeSearch component uses useSearchParams THEN it SHALL be wrapped in Suspense by parent
2. WHEN the component is used in multiple pages THEN each usage SHALL have proper Suspense boundaries
3. WHEN the page loads THEN search parameters SHALL be read without causing prerender failures
4. IF search params are missing THEN the component SHALL handle it gracefully

### Requirement 7: Fix Admin Layout Suspense Issues

**User Story:** As an admin, I want the admin panel to load correctly, so that I can manage the platform.

#### Acceptance Criteria

1. WHEN AdminLayout uses useSearchParams THEN it SHALL be wrapped in Suspense
2. WHEN unauthorized query param is present THEN it SHALL display toast without breaking prerender
3. WHEN the admin page loads THEN it SHALL not cause build failures
4. IF the layout needs client features THEN it SHALL be properly structured with Suspense

### Requirement 8: Fix Cookbook List Client Suspense

**User Story:** As an admin, I want the cookbook management page to work, so that I can manage cookbooks.

#### Acceptance Criteria

1. WHEN CookbookListClient uses useSearchParams THEN its parent SHALL wrap it in Suspense
2. WHEN search/filter params change THEN the URL SHALL update without errors
3. WHEN the page prerenders THEN it SHALL not fail due to missing Suspense
4. IF the component is client-side THEN the server component parent SHALL provide Suspense

### Requirement 9: Validate Docker Build Process

**User Story:** As a DevOps engineer, I want the Docker build to complete successfully, so that I can deploy to production.

#### Acceptance Criteria

1. WHEN `docker-compose build` runs THEN it SHALL complete without errors
2. WHEN the build reaches the Next.js build step THEN it SHALL succeed
3. WHEN the container starts THEN it SHALL validate environment variables strictly
4. IF any build step fails THEN it SHALL provide clear error messages

### Requirement 10: Ensure No Regression in Functionality

**User Story:** As a user, I want all features to work after deployment fixes, so that my experience is not degraded.

#### Acceptance Criteria

1. WHEN fixes are applied THEN all existing features SHALL continue to work
2. WHEN users navigate the site THEN search, filters, and navigation SHALL work correctly
3. WHEN the application runs THEN performance SHALL not be degraded
4. IF any feature breaks THEN it SHALL be identified and fixed before deployment
