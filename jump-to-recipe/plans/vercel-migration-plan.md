# Vercel Migration Plan

Move Jump to Recipe from Docker Compose (Ubuntu / Raspberry Pi + nginx + Postgres container) to Vercel.

## Decisions
- **Database:** Neon via the Vercel Marketplace (`iad1`, free plan, Neon Auth off, no per-deploy DB branches yet).
- **Vercel Root Directory:** `jump-to-recipe`
- **Install Command (override):** `rm -f ../package.json ../package-lock.json && npm install` — see Cleanup #1.
- **Node.js:** Vercel default (22.x+). Node 20 is EOL (April 2026).
- **Photo storage:** TBD (Vercel Blob vs existing S3 path)
- **Existing data migration:** TBD
- **Custom domain:** TBD

## Phase 1 — Vercel project setup (in progress)
- [x] Import repo into Vercel, Root Directory `jump-to-recipe`
- [x] Create Neon DB, connected to Production + Preview with prefix `DATABASE` → `DATABASE_URL`
- [x] Add `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (Production only), `GOOGLE_ID`, `GOOGLE_SECRET`
- [x] Override Install Command (native binaries missing from root lockfile)
- [x] Green build (2026-09-23); home page loads at https://jump-to-recipe-opal.vercel.app (feed 500s until Phase 2 — expected)
- [ ] Add Vercel URL to Google OAuth origins + redirect URI (`/api/auth/callback/google`)

## Phase 2 — Database (keeping existing Pi data)
Context: the Pi applies schema with `npm run db:push` (see `scripts/docker-deploy.sh`), so there is no
Drizzle migration history. The dump carries tables + data; we do NOT run `drizzle-kit migrate` on Neon.

- [x] **2a. Serverless DB client** (PR #89) — in `src/db/index.ts`, give `queryClient` `max: 5`,
      `idle_timeout: 20`, `prepare: false` (safe with Neon's PgBouncer pooler; harmless for Docker/local)
- [x] **2b. Rehearsal dump/restore** (2026-09-24; all 11 table counts match — 132 recipes, 10 users, 38 photos.
      Dump kept on the Pi at `/srv/nextjs/jump-to-recipe/jtr.dump`) — on the Pi, `pg_dump -Fc --no-owner --no-acl` inside the db container,
      `pg_restore` into Neon using the **unpooled** connection string (from the Neon console)
- [ ] **2c. Verify** — compare per-table row counts Pi vs Neon; recipe feed loads; Google + password login work.
      Photos will 404 until Phase 3 (files still on the Pi)
- [ ] **2d. Final dump at cutover** (Phase 5) — stop writes on the Pi, re-dump, drop + restore Neon, so no data written between the rehearsal and cutover is lost
- Schema changes going forward: keep `db:push`, run from the Mac against Neon's unpooled URL

## Phase 3 — Photo storage (Vercel Blob)
Context: all uploads go through `uploadFile()` in `src/lib/file-storage.ts` (sharp resize → local disk or S3).
Two routes call it: `/api/upload` (recipe/cookbook covers, avatars — client caps at 4 MB) and
`/api/recipes/[id]/photos` (recipe photos — one file per request, 10 MB cap). Vercel rejects request bodies
over ~4.5 MB, so photos between 4.5 and 10 MB would fail.

- [x] **3a. Blob backend** (`c1e92fd` on `feat/vercel-blob-storage`; store auths via `BLOB_STORE_ID` + Vercel OIDC) — add `@vercel/blob`; in `file-storage.ts` use `put()` when
      `BLOB_READ_WRITE_TOKEN` is set (else S3/local as today, so Pi + local dev unchanged); `deleteFile()` calls
      `del()` only for URLs on our Blob store; add `*.public.blob.vercel-storage.com` to `images.remotePatterns`.
      Keeps sharp resizing server-side. Setup: create a Blob store in Vercel → Storage, connect to Prod + Preview
- [x] **3b. Large photos** (written; threshold 3.5 MB; verified in a real browser: 23 MB → 1.5 MB) — downscale in the browser before upload (canvas → JPEG, long edge ~2400px)
      so phone photos fit under 4.5 MB; falls back to the original file if the browser can't decode it (e.g. HEIC
      outside Safari). Server still resizes to 1200×800 afterwards
- [x] **Unplanned fix** (`3e7f606`): `env.ts` required `NEXTAUTH_URL` on Vercel previews (NODE_ENV=production) →
      every DB route 500'd. Now skipped when `VERCEL` is set (next-auth uses Vercel's trusted host there)
- [x] **Unplanned fix** (`9e3fbf9`): `ImageUpload` (recipe image / cookbook cover / avatar) silently ignored files
      over 4 MB. Now accepts up to 10 MB, downscales, and alerts on rejection
- [x] Blob store recreated as **Public** (first one was private → "Cannot use public access on a private store")
- [x] Photos section verified on preview for 4–10 MB files
- [x] **3d. Verify** — recipe image + Photos section uploads work on preview
- [x] **3c. Migrate existing files** (run against Neon 2026-09-25; PR #90 merged, production verified) —
      `scripts/migrate-uploads-to-blob.ts` (dry run by default, `--apply` to write, idempotent). 112/119 migrated.
      7 files were missing on the Pi itself: 5 belong to soft-deleted photos (harmless); 2 active photos on
      "Beef stroganoff" (`082acda4…`) are lost — user to delete/re-upload them **on the Pi** so the re-dump carries it.
      **At cutover:** re-copy the Pi's uploads folder (new photos since), then re-run after the final restore (2d)
- Keep `src/app/uploads/[...path]/route.ts` until after cutover (Pi still needs it)
- Out of scope, flagged separately: `/api/images/delete` lets any logged-in user delete any file (+ path
  traversal on local disk)

## Phase 4 — Cleanup (revised 2026-09-26 after re-checking each item)
- [x] **4a. Remove the root npm workspace** (PR #91; react-hook-form type errors → separate follow-up task) — root `package.json` keeps only convenience scripts
      (`npm --prefix jump-to-recipe run …`), no `workspaces`/deps; delete root `package-lock.json`; fresh
      `jump-to-recipe/package-lock.json` from a clean install (verify Linux binaries + `overrides` resolve); untrack the
      808 accidentally committed files under `node_modules/`; README + CLAUDE.md install notes. Then remove the Vercel
      Install Command override. Fixes: Mac-only lockfile, overrides ignored locally, per-platform install drift
- [x] **4b. Small tidy-ups** (PR #92) — delete dead Pages Router `export const config` in `api/upload/route.ts`;
      update the HSTS comment in `next.config.ts`
- [x] **4c. Type errors 62 → 0 + builds fail on type errors** (PR #93; added at user's request). Next's build
      check covers app code only — `npm run type-check` covers tests
- **Deferred to after cutover:** remove `output: 'standalone'` — the Pi's Dockerfile copies `.next/standalone`,
  so removing it now would break a Pi redeploy. Do it together with removing Docker/nginx/`scripts/*`
- **Dropped:** `maxDuration` on the import route (Vercel's default 300s ≫ the 15–30s fetch timeouts);
  HSTS header (Vercel already sends `max-age=63072000; includeSubDomains; preload`)

## Phase 5 — Cutover ✅ (2026-09-26)
Simplified from the drafted runbook: the Pi's data hadn't changed since the 2026-09-24 rehearsal (row counts identical,
last edit 2026-09-14) and the only preview-test edits were on a since-deleted test recipe, so no re-dump was needed.
- [x] DNS at Bluehost: `@` A → `216.198.79.1`, `www` CNAME → `9f013eb4c537d241.vercel-dns-017.com`
      (Vercel project-specific values); apex 308-redirects to `https://www.happeacook.com`
- [x] Let's Encrypt cert via Vercel (auto-renews); `/api/health` 200; Blob images load; email login verified by user
- [x] `NEXTAUTH_URL=https://www.happeacook.com` (Production) + redeploy; Google OAuth origin/redirect added
- [x] Pi: `docker compose stop app` — db container + `jtr.dump` kept as fallback
- [ ] Remove router port forwarding / stop nginx (home IP still answered 502 on :80 right after cutover)
- Accepted as-is: 2 lost "Beef stroganoff" photos (user: bad recipe)

**Rollback:** Bluehost DNS back to the home IP + `docker compose start app` on the Pi. Anything written on Vercel
since cutover would first need a Neon → Pi dump.

**After a stable period (separate PRs)**
- Remove `output: 'standalone'`, Dockerfile, docker-compose*, nginx/, `scripts/*` deploy files, `src/app/uploads/[...path]`
  route, local-disk upload path; remove `MIGRATION_AUTH_TOKEN` from old secrets; shut down the Pi stack

## Later
- Move `src/lib/rate-limit.ts` to a shared store (Upstash) — in-memory limits are per-instance on serverless
- Re-enable ESLint build failures in `next.config.ts` (TypeScript done in PR #93; lint errors remain)
- Switch from `db:push` to tracked migrations (baseline the Drizzle journal against the restored schema)
- Enable Neon preview branches once migrations run during the build
