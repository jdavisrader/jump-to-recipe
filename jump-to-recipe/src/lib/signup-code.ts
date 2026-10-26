import { createHash, timingSafeEqual } from 'crypto';
import { env } from './env';

const sha256 = (value: string) => createHash('sha256').update(value).digest();

/**
 * Checks a submitted sign-up code against SIGNUP_CODE. Fails closed when the
 * env var is unset. Hashing gives equal-length buffers for a constant-time compare.
 */
export function isValidSignupCode(input: string): boolean {
  const expectedCode = env.SIGNUP_CODE;
  if (!expectedCode) return false;

  return timingSafeEqual(sha256(input.trim()), sha256(expectedCode));
}
