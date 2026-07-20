# Security Audit & Remediation Plan

_Jump to Recipe — generated 2026-07-14_

## Context

A scan was triggered after a production incident: an "odd redirect" on the site
that was resolved only by restarting the Docker container (no code change). That
symptom — transient, cleared by a process restart — points at **poisoned shared
server state**, not a logic bug in the redirect code (the app's redirects are
deterministic). Two known-CVE candidates fit exactly:

1. `undici` HTTP response queue poisoning via keep-alive socket reuse
   (GHSA-35p6-xmwp-9g52) + cross-user disclosure via shared cache
   (GHSA-pr7r-676h-xcf6). The server makes outbound `fetch()` calls during recipe
   import/scraping (Node `fetch` == undici). A misbehaving/malicious upstream can
   desync the pooled keep-alive socket so a response — including a redirect — is
   handed to the wrong request. A restart drops the poisoned socket pool. **Most
   likely culprit.**
2. Next.js "Cache Key Confusion for Image Optimization API Routes" (critical) —
   cache-key collisions serve one response in place of another until the cache/
   process resets.

Both are closed by the dependency upgrades in Phase 1. Which one actually fired
can't be proven without the incident logs, but both warrant fixing regardless.

## What is already solid (do not touch)

- Core recipe mutation routes (`src/app/api/recipes/route.ts`,
  `src/app/api/recipes/[id]/route.ts`) enforce ownership/role authz correctly and
  never trust a client-supplied `authorId` on create.
- Photo routes use the `withRecipePermission(handler, 'edit')` wrapper.
- Password change route (`src/app/api/user/password/route.ts`) verifies the
  current password, blocks OAuth users, and uses bcrypt(12).
- Recent fix already stopped credential logging during login.

---

## Phase 1 — Dependencies (directly targets the redirect incident)

**Priority: Critical. Status: DONE** (branch `security/phase1-dependency-upgrades`, not yet merged/deployed).

Applied:
- [x] Direct bumps: `next` 15.5.20 (critical image cache-key CVE), `drizzle-orm`
      0.45.2 (SQLi), `multer` 2.2.0, `next-auth` 4.24.14, `uuid` 11.1.1,
      `eslint-config-next` 15.5.20.
- [x] Transitive overrides in `jump-to-recipe/package.json` (Docker's install
      root): `undici` ^7.28.0 (queue-poisoning — redirect-incident fix),
      `fast-xml-parser` ^5.7.0, `ws` ^8.21.1.
- [x] Verified: prod build passes, 0 new type errors, test failures all
      pre-existing, Docker-context resolution confirmed (undici 7.28.0, ws 8.21.1,
      fast-xml-parser dropped by newer @aws-sdk).

**Note on overrides:** they only take effect in the Docker/standalone install
(where `jump-to-recipe/package.json` is the project root); npm ignores them in the
local workspace install, so local `npm audit` still flags these transitive deps.
See the removal plan below.

### Phase 1 follow-up — prune the security overrides (do ASAP, once upstreams catch up)

**Priority: Medium (hygiene). Effort: ~30 min per review.**

Overrides are temporary patches. A caret override (`^7.28.0`) auto-absorbs future
patch/minor fixes, but if an upstream jumps a **major** (e.g. cheerio → `undici@^8`),
a stale override silently pins them back and can break the upgrade. Remove each one
as soon as its parent package requires a patched version on its own.

Per-override removal criteria and check:

- [ ] **`fast-xml-parser`** — likely already redundant: a fresh install pulls a
      newer `@aws-sdk` with no `fast-xml-parser` dependency. Confirm with
      `npm view @aws-sdk/xml-builder dependencies.fast-xml-parser` and by bumping
      `@aws-sdk/client-s3`; if the tree no longer contains a vulnerable
      `fast-xml-parser`, delete the override. **Lowest risk to remove first.**
- [ ] **`ws`** — dev/test-only (via `jsdom`), never shipped. Remove once
      `npm view jsdom dependencies.ws` resolves to a patched line, or on any
      `jsdom` bump. Low stakes.
- [ ] **`undici`** — the one that matters (runtime request path via `cheerio`).
      Keep until `npm view cheerio dependencies.undici` lands on a patched version
      by itself, then remove. **Remove last.**

Review procedure (for each): remove the override line → reinstall → `npm audit`
+ confirm the resolved transitive version is still patched (via the Docker-context
check, since local install ignores overrides). Trigger this review on the next
dependency-maintenance pass or whenever the import/scraper (cheerio) code is touched.

---

## Phase 2 — Quick, self-contained wins

### 2a. Open redirect on login — `src/app/auth/login/page.tsx:29,66`
**Priority: High. Status: DONE.**

`callbackUrl` comes from the query string and is passed straight to
`router.push(callbackUrl)` after login, allowing
`/auth/login?callbackUrl=https://evil.com` to bounce an authenticated user off-site.

- [x] Accept only same-origin relative paths: reject any value that does not start
      with a single `/` (block `//host` and `/\host`). Implemented as
      `sanitizeCallbackUrl()` in `src/lib/safe-redirect.ts`.
- [x] Fall back to `/` when invalid. Sanitized once at the source (line 29) so both
      `router.push(callbackUrl)` and the `signIn(provider, { callbackUrl })` call are covered.
- [x] Unit test added: `src/lib/__tests__/safe-redirect.test.ts` (external URL,
      protocol-relative, backslash bypass, non-slash, valid path — 6 cases, passing).

### 2b. Remove legacy migration endpoints — `src/app/api/migration/users/route.ts`, `.../recipes/route.ts`
**Priority: High. Status: DONE.**

Guarded only by a static bearer token, but `POST /api/migration/users` accepts an
arbitrary `id`, `role: 'admin'`, and a pre-computed password hash → instant admin
creation/takeover if the token leaks or is unset.

**Decision (confirmed by owner):** the legacy site was migrated once and these
endpoints are no longer needed. **Delete them** rather than gate them — least
standing risk, and recoverable via git if ever required again.

- [x] Deleted `src/app/api/migration/users/route.ts` and
      `src/app/api/migration/recipes/route.ts` (and the now-empty
      `src/app/api/migration/` dir).
- [x] Left the `src/migration/` CLI pipeline in place — separate tooling; only the
      HTTP endpoints were removed. (Note: the CLI's `batch-importer` / `user-importer`
      still POST to these now-gone routes; the one-time import is complete, so this is
      dead-but-harmless client code. Not touched per the decision above.)
- [ ] **Ops action (not code):** remove `MIGRATION_AUTH_TOKEN` from deployed env/secrets.
- [x] Grepped for references: remaining hits are all in `src/migration/**` docs and CLI
      code (left intentionally) and `plans/`. No app/runtime code references the deleted routes.

---

## Phase 3 — SSRF guard on the import/scrape fetch path

**Priority: High. Effort: 1–2 hrs.**
Files: `src/app/api/recipes/import/route.ts`, `src/lib/recipe-scraper.ts`
(`fetchHtmlContent`).

The import endpoint fetches a user-supplied URL after validating only that it
parses, and the handler is **unauthenticated** (middleware `protectedRoutes` are
page paths; no API route is gated by middleware and this handler never calls
`getServerSession`). This allows requests to cloud metadata (169.254.169.254),
`localhost`, sibling containers, and `file://`/`gopher://`.

- [ ] Require an authenticated session on `POST /api/recipes/import`.
- [ ] Create one shared guarded-fetch helper (both fetch paths must use it):
  - [ ] Allow only `http`/`https` schemes.
  - [ ] Resolve the hostname and reject private/loopback/link-local ranges
        (127/8, 10/8, 172.16/12, 192.168/16, 169.254/16, `::1`, `fc00::/7`, `0.0.0.0`).
  - [ ] `redirect: 'manual'` (or re-validate each hop against the same rules).
  - [ ] Enforce a response-size cap and keep the existing timeout.
- [ ] Add tests: private-IP URL, protocol-relative, redirect-to-internal, oversize body.

---

## Phase 4 — Abuse resistance & info leakage

### 4a. User enumeration + rate limiting
**Priority: Medium. Effort: ~half day.**
Files: `src/app/api/auth/register/route.ts`, credentials login, `src/app/api/user/password/route.ts`.

- [ ] Add per-IP + per-email rate limiting to register, login, and password change.
- [ ] Reduce enumeration signal on register where UX allows (generic messaging).

### 4b. Log & error hygiene — `src/app/api/recipes/import/route.ts`
**Priority: Medium. Effort: ~30 min.**

- [ ] Remove `console.log('Request body:', requestBody)` and the verbose recipe dumps.
- [ ] Gate stack traces / `error.message` behind `NODE_ENV === 'development'`
      everywhere (the reorder route already does this — reuse that pattern).

---

## Phase 5 — Config hardening

**Priority: Low. Effort: ~1 hr.**

- [ ] Make `NEXTAUTH_URL` required in production (`src/lib/env.ts:13`) to remove the
      host-header-injection surface from NextAuth callback derivation.
- [ ] Add a `headers()` block in `next.config.ts`: CSP, HSTS,
      `X-Content-Type-Options: nosniff`, `X-Frame-Options`/frame-ancestors.
- [ ] Tighten `remotePatterns` wildcards (`*.amazonaws.com`, `*.cloudfront.net`,
      `*.wp.com`) if specific hosts can be enumerated.
- [ ] Enforce `npm run type-check` + `npm run lint` in CI so security regressions
      aren't hidden by `ignoreBuildErrors`/`ignoreDuringBuilds` in production builds.

---

## Execution order

1. **Phase 1** — dependency upgrades (closes the redirect incident). _Needs dep approval._
2. **Phase 2** — open redirect + migration endpoints (fast, high impact, low risk).
3. **Phase 3** — SSRF guard + auth on import.
4. **Phase 4** — rate limiting + log hygiene.
5. **Phase 5** — headers, env, CI hardening.

Each phase is independently committable (conventional commits, one logical change
each). Recommend a branch per phase off `master`.

## Open questions

- Are the `/api/migration/*` endpoints ever needed in the deployed environment, or
  is the pipeline always run against a non-prod target? (Determines remove vs. gate.)
- Do we have the logs from the redirect incident to confirm undici vs. Next cache?
- Preferred rate-limit backend (in-memory, Redis/Upstash, edge middleware)?
