/**
 * Minimal in-memory rate limiter (fixed window).
 *
 * Suited to the single-container deployment: zero dependencies, no external
 * store. State lives in this process, so it resets on restart and is not shared
 * across instances — acceptable for abuse-resistance on auth endpoints here.
 * Move to a shared store (Redis/Upstash) if the app is ever horizontally scaled.
 */
import type { NextRequest } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();
const SWEEP_THRESHOLD = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch seconds when the window resets
  retryAfter: number; // seconds until reset (0 when allowed)
}

function sweepExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Record a hit against `key` and report whether it is within `limit` per
 * `windowMs`. Rejected hits still count, so sustained abuse stays blocked for
 * the remainder of the window.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size > SWEEP_THRESHOLD) sweepExpired(now);
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  const allowed = bucket.count <= limit;
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    reset: Math.ceil(bucket.resetAt / 1000),
    retryAfter: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/** Extract the first client IP from `x-forwarded-for` header text. */
export function clientIpFromXff(xff: string | string[] | null | undefined): string {
  if (!xff) return 'unknown';
  const value = Array.isArray(xff) ? xff[0] : xff;
  return value.split(',')[0].trim() || 'unknown';
}

/** Best-effort client IP for an App Router request (behind a proxy/Docker). */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return clientIpFromXff(xff);
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Test-only: clear all rate-limit state. */
export function __resetRateLimits(): void {
  buckets.clear();
}
