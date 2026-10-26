# Sign-up code gate

## Context
Anyone can create an account right now, so bots can sign up and get into the site. We'll require a single shared sign-up code (stored as an env var) to register. Google OAuth is hidden in the UI but still live on the server, so `/api/auth/signin/google` would get around the code. We're removing that provider.

**Decisions made:** a single shared code in `SIGNUP_CODE` (no DB table or admin UI). Remove `GoogleProvider` completely.

## Chunk 1: `feat: require sign-up code to register`
1. **`src/lib/env.ts`**: add `SIGNUP_CODE: z.string().min(8).optional()`.
   - It's optional so that local dev, tests and the build don't break. **The API fails closed:** if the var is unset, every registration gets rejected.
2. **`src/lib/signup-code.ts`** (new, about 15 lines): `isValidSignupCode(input: string): boolean`.
   - Returns false when `env.SIGNUP_CODE` is unset.
   - Otherwise it SHA-256 hashes both strings and compares them with `crypto.timingSafeEqual`. Hashing makes the buffers the same length and keeps the comparison constant-time.
   - Trims the input. The comparison is case-sensitive.
3. **`src/app/api/auth/register/route.ts`**:
   - Add `signupCode: z.string().min(1)` to `registerSchema`.
   - Check `isValidSignupCode` after validation and the per-IP rate limit, before the email limit and the DB lookup.
   - A bad code returns `403 { error: 'Invalid sign-up code.' }`. The existing 10/hour per-IP limit already blocks brute-forcing, so no new limiter is needed.
4. **`src/app/auth/register/page.tsx`**: add a "Sign-up code" field, matching the existing input/label/error pattern.
   - Pre-fill it from a `?code=` query param so you can share invite links like `/auth/register?code=XYZ`. This uses `useSearchParams`, which needs a `<Suspense>` wrapper.
5. **Tests**: `src/lib/__tests__/signup-code.test.ts` covers valid, wrong, unset env and whitespace cases.

## Chunk 2: `feat: remove Google OAuth provider`
1. **`src/lib/auth.ts`**: remove the `GoogleProvider` import and entry.
2. **`src/lib/env.ts`**: remove `GOOGLE_ID` and `GOOGLE_SECRET` from the schema, and update `src/lib/__tests__/env.test.ts` to match.
   - The values in `.env` and in Vercel are left alone; you can delete them yourself later.
3. **`src/app/auth/login/page.tsx`**: remove the commented-out Google block, `handleOAuthSignIn` and the now-unused `oauthLoading` state and `Mail` import.
   - That code is dead once the provider is gone.
4. **Caveat:** any existing user who only ever signed in with Google (no password) loses access. I'll give you a read-only SQL query against `accounts WHERE provider='google'` so you can check this in Neon before deploying.

## Your action items (I won't touch env files)
- Add `SIGNUP_CODE` to `.env.local` and to Vercel env vars (Production and Preview), then redeploy.

## Verification
- Run `npm test` (the new signup-code tests and the updated env tests) and `npx tsc --noEmit`.
- On your running dev server at :3000, I won't start a second server:
  - Register with no code: the form error shows.
  - Wrong code: 403 message.
  - Correct code: redirects to `/auth/login?registered=true`.
  - `?code=` pre-fills the field.
- Calling `/api/auth/signin/google` should no longer list or start Google sign-in.
