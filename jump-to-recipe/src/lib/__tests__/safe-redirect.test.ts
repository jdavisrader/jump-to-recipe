import { sanitizeCallbackUrl } from '../safe-redirect';

describe('sanitizeCallbackUrl', () => {
  it('allows same-origin relative paths', () => {
    expect(sanitizeCallbackUrl('/my-recipes')).toBe('/my-recipes');
    expect(sanitizeCallbackUrl('/recipes/123?tab=notes')).toBe('/recipes/123?tab=notes');
    expect(sanitizeCallbackUrl('/')).toBe('/');
  });

  it('falls back to / for empty or missing values', () => {
    expect(sanitizeCallbackUrl(null)).toBe('/');
    expect(sanitizeCallbackUrl(undefined)).toBe('/');
    expect(sanitizeCallbackUrl('')).toBe('/');
  });

  it('rejects absolute external URLs', () => {
    expect(sanitizeCallbackUrl('https://evil.com')).toBe('/');
    expect(sanitizeCallbackUrl('http://evil.com/path')).toBe('/');
  });

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeCallbackUrl('//evil.com')).toBe('/');
    expect(sanitizeCallbackUrl('//evil.com/path')).toBe('/');
  });

  it('rejects backslash-bypass URLs', () => {
    expect(sanitizeCallbackUrl('/\\evil.com')).toBe('/');
  });

  it('rejects values that do not start with a slash', () => {
    expect(sanitizeCallbackUrl('evil.com')).toBe('/');
    expect(sanitizeCallbackUrl('javascript:alert(1)')).toBe('/');
  });
});
