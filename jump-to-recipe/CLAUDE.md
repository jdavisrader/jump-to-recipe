# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Next.js dev server (Turbopack) on :3000
npm run build            # Production build (standalone output)
npm run lint             # ESLint (next/core-web-vitals + next/typescript + prettier)
npm run lint:fix         # Auto-fix lint issues
npm run type-check       # tsc --noEmit (run this — builds skip TS errors, see below)
npm run format           # Prettier write
npm run test             # Jest (jsdom)
npm run test:watch       # Jest watch mode
npx jest path/to/file    # Run a single test file
npx jest -t "test name"  # Run a single test by name
```

**Production builds do NOT fail on TypeScript or ESLint errors** — `next.config.ts` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` so Docker builds complete. Always run `npm run type-check` and `npm run lint` locally before committing; CI-style checks won't catch regressions during `npm run build`.

### Database (Drizzle ORM, PostgreSQL)

```bash
npm run db:generate      # Generate SQL migration from schema changes
npm run db:push          # Push schema directly (dev only)
npm run db:studio        # Open Drizzle Studio
npm run db:seed          # Seed via src/db/seed.ts
npm run migrate:positions  # One-off: backfill explicit positions on recipe steps
```

Drizzle reads `DATABASE_URL` from `.env` via `drizzle.config.js`. Schema lives in `src/db/schema/*` and is re-exported from `src/db/schema/index.ts`; SQL migrations are written to `src/db/migrations/`.

### Legacy Rails migration pipeline (separate from DB migrations)

`src/migration/` is a **one-time ETVI pipeline** (Extract → Transform → Validate → Import) that pulls recipes from a legacy Rails app via SSH tunnel. Do not confuse with Drizzle migrations.

```bash
npm run migrate          # Full pipeline (cli.ts)
npm run migration:extract / :transform / :validate / :import / :verify
```

It has its own env file (`.env.migration`) and its own tsconfig (`tsconfig.migration.json`).

## Architecture

### Stack
Next.js 15 (App Router, React 19 Server Components), TypeScript strict, Tailwind v4, shadcn/ui (new-york style, Radix under the hood), Drizzle ORM + `postgres`/`pg`, NextAuth.js, Zod for validation. Path alias: `@/*` → `src/*`.

### Routing & auth model
- `src/app/` is App Router; API routes live under `src/app/api/<resource>/route.ts`.
- `src/middleware.ts` is the single source of truth for route protection. Three tiers:
  1. **Public** (`/`, `/auth/*`) — always allowed.
  2. **Public API** (`/api/auth`, `/api/recipes/search`, `/api/recipes/discover`, and GET on `/api/recipes`) — skip auth.
  3. **Protected** (`/profile`, `/my-recipes`, `/recipes/new`, `/recipes/import`, `/cookbooks`, `/grocery-lists`) — require session cookie.
  4. **Admin** (`/admin/*`) — decodes the JWT with `getToken()` and requires `token.role === 'admin'`. Non-admins are bounced to `/?unauthorized=1`.
- Auth is configured in `src/lib/auth.ts`: Google OAuth + Credentials (bcrypt-hashed passwords), DrizzleAdapter, **JWT session strategy** (not DB sessions — the role claim lives on the JWT, which is why middleware can check it cheaply).
- When adding a new top-level protected route, update the `protectedRoutes` array in `src/middleware.ts` — the middleware doesn't auto-discover.

### Data model quirks
- `recipes.ingredients` / `instructions` are **JSONB** (flat lists), and there are parallel **`ingredientSections`** / **`instructionSections`** JSONB columns for sectioned recipes. Code must handle both shapes; see `src/lib/section-utils.ts` and `src/lib/section-position-utils.ts`.
- Recipe steps carry **explicit `position`** fields (backfilled by `migrate:positions`). Don't rely on array index — always sort by `position`. Recent commits fixed create/edit bugs caused by missing positions.
- Schemas are split by domain in `src/db/schema/` (users, recipes, recipe-photos, cookbooks, comments, grocery-lists) with relations isolated in `relations.ts`.

### Validation layer
All request/form validation goes through Zod schemas in `src/lib/validations/` (recipe, recipe-sections, cookbook-recipes, photo-validation, admin-cookbook). API routes and React Hook Form share the same schemas — when changing a field, update the schema first and both ends follow.

### File storage
`src/lib/file-storage.ts` + `file-storage-config.ts` abstract local vs S3 storage, toggled by `USE_S3`. Uploaded images route through `/api/upload` and `/api/images`; Sharp is used for optimization. `next.config.ts` has a long allowlist of remote recipe-site hostnames for `next/image` — add to `remotePatterns` when importing from a new source domain.

### Recipe import
`src/lib/recipe-scraper.ts` + `recipe-parser.ts` + `recipe-import-normalizer.ts` form the import pipeline (JSON-LD parsing via cheerio, then normalization into the internal shape). `recipe-normalizer.ts` and `recipe-migration.ts` handle in-app conversions between flat and sectioned formats.

### Testing
Jest + React Testing Library in jsdom (`jest.config.js` wraps `next/jest`). `jest.setup.ts` is the shared setup. Co-located tests live in `__tests__/` folders next to the code they cover (e.g. `src/lib/__tests__/`, `src/app/api/recipes/__tests__/`, `src/lib/validations/__tests__/`). The `test:migration` script uses a separate Jest config for the migration pipeline.

## Reference docs in-repo

- `docs/implementation/` — detailed summaries of prior tasks (drag/drop, sections, photos, permissions, validation). Useful historical context when touching those areas.
- `src/lib/validations/README.md` + `VALIDATION-EXAMPLES.md` — validation patterns.
- `src/db/migrations/README-position-migration.md` — why explicit positions exist.
- `src/migration/README.md` — legacy-import pipeline details.

## Plan Naming
When creating plans, name them descriptively using the pattern:
`<feature-or-topic>-plan.md` (e.g., `contact-form-plan.md`, `autho-refactor-plan.md`)
Never use random/generated names.
Store all plans in ./plans