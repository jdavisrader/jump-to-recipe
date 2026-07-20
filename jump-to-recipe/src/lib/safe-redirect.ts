/**
 * Sanitize a user-supplied `callbackUrl` so it can only redirect within this app.
 *
 * Accepts same-origin relative paths only (must start with a single `/`).
 * Rejects absolute URLs, protocol-relative (`//host`), and backslash-bypass
 * (`/\host`) values, which browsers can treat as off-site redirects.
 * Falls back to `/` for anything invalid.
 */
export function sanitizeCallbackUrl(callbackUrl: string | null | undefined): string {
  if (!callbackUrl || typeof callbackUrl !== 'string') {
    return '/';
  }

  if (callbackUrl[0] !== '/' || callbackUrl[1] === '/' || callbackUrl[1] === '\\') {
    return '/';
  }

  return callbackUrl;
}
