# Codebase Audit & Remediation Plan

_Generated 2026-06-15. Tracks findings from a security/fragility/consistency review of jump-to-recipe._

Status legend: ⬜ todo · 🟦 doing · ✅ done

Effort: **S** (minutes) · **M** (hours) · **L** (multi-session refactor) · 🟢 quick win

---

## 🔴 Critical — fix before next deploy

### ✅ 1. `POST /api/recipes` has no authentication — Effort S
`src/app/api/recipes/route.ts:230`
- POST handler never calls `getServerSession`. Comment says "handled on client side" (not enforcement).
- `authorId` comes from the request body and is inserted directly → unauthenticated users can create recipes AND forge `authorId` as any user.
- PUT/DELETE on the same resource already check session + ownership correctly.
- **Fix:** require session, override `authorId = session.user.id` server-side (ignore body value).

### ✅ 2. Middleware skips auth for ALL of `/api/recipes/*`, every method — Effort S
`src/middleware.ts:19-28`
- `publicApiRoutes` uses `startsWith('/api/recipes')` with no method check → matches POST/PUT/DELETE and every subroute.
- Middleware also does not protect any API route except `/admin` (allow-by-default for APIs).
- **Fix:** gate the `/api/recipes` public entry on `req.method === 'GET'`.

### ⬜ 3. Unauthenticated SSRF in recipe import — Effort M
`src/app/api/recipes/import/route.ts:9`
- Takes user-supplied `url`, does `fetch(url)` server-side, no auth, no host validation beyond `new URL()`.
- Can hit internal services / cloud metadata (169.254.169.254, localhost) and return response to caller.
- **Fix:** require auth; block private/link-local IPs + non-http(s) schemes; consider allowlist.

### ✅ 4. Credentials logged in plaintext on every login — Effort S 🟢
`src/lib/auth.ts:30-53`
- `console.log` of `credentials.email` (PII) and password-match outcome on every login.
- 22 non-test files contain `console.log`; API routes dump full request bodies (`import/route.ts:16`, `recipes/route.ts:236-241`).
- **Fix:** delete credential logs now; strip/route the rest through a leveled logger later.

---

## 🟠 Soon — within next sprint

### ⬜ 5. Protected-route middleware only checks cookie presence, not validity — Effort M
`src/middleware.ts:88-100` — any non-empty cookie passes. Admin branch uses `getToken()`; page branch should too.

### ⬜ 6. Visibility-filter SQL duplicated across 4 routes — Effort M
`recipes/route.ts`, `recipes/[id]/route.ts`, `recipes/search/route.ts`, `recipes/discover/route.ts`.
Extract `buildVisibilityCondition(userId, isAdmin)` into `src/lib/recipe-permissions.ts`.

### ⬜ 7. No server-side rate limiting anywhere — Effort M
Only client-side retry exists. Import + auth endpoints need throttling (SSRF/DoS vector).

### ⬜ 8. `MIGRATION_AUTH_TOKEN` shared secret outside validated env schema — Effort S
`migration/recipes/route.ts:19`. Add to `src/lib/env.ts` Zod schema; consider gating migration routes to non-prod or removing post-migration.

### ⬜ 9. `updateData: any` defeats validated types — Effort S 🟢
`recipes/[id]/route.ts:300`. Type as `Partial<typeof recipes.$inferInsert>`. Broader: 60 `: any` + 30 `as any` in non-test code; give JSONB columns real shared types in `src/types/recipe.ts`.

---

## 🟡 Later — opportunistic tech debt

### ⬜ 10. CLAUDE.md documents non-existent `src/server/actions/` — Effort S 🟢
No `src/server/` dir exists. Reconcile doc with reality.

### ⬜ 11. Leftover dead route dirs — Effort S 🟢
Empty `src/app/api/test-endpoint/`; stray `src/app/api/uploadthing/page.tsx` (uploadthing not a dep); `src/app/demo/page.tsx` with console.logs. Delete (confirm first).

### ⬜ 12. Files far over the 200-line convention — Effort L
`recipe-form.tsx` (1124), `recipe-ingredients-with-sections.tsx` (1102), `import/route.ts` (1050), `recipe-editor.tsx` (777). Highest-value split: `import/route.ts`.

### ⬜ 13. Inconsistent error-response shapes — Effort M
Mix of `{error}` / `{error,message}` / `{error,details}`; `[id]/route.ts:336-355` string-sniffs `error.message` to pick status. Standardize on `error-handling.ts`/`api-utils.ts`.

### ⬜ 14. Inconsistent indentation/style — Effort S
`recipes/route.ts` is 4-space; rest 2-space. Builds ignore lint. Run `npm run format`.

---

## Quick-win shortlist
1. #4 — delete credential logs (security)
2. #1 — session check + server-set authorId (security)
3. #9 — type `updateData`
4. #10 / #11 — fix CLAUDE.md claim, remove dead dirs
