import { checkRateLimit, clientIpFromXff, __resetRateLimits } from '../rate-limit';

describe('checkRateLimit', () => {
  let now = 1_000_000;

  beforeEach(() => {
    __resetRateLimits();
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows hits up to the limit then blocks', () => {
    const key = 'test:a';
    for (let i = 1; i <= 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('reports remaining counts', () => {
    const key = 'test:remaining';
    expect(checkRateLimit(key, 5, 60_000).remaining).toBe(4);
    expect(checkRateLimit(key, 5, 60_000).remaining).toBe(3);
  });

  it('isolates separate keys', () => {
    expect(checkRateLimit('test:x', 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit('test:x', 1, 60_000).allowed).toBe(false);
    // Different key is unaffected.
    expect(checkRateLimit('test:y', 1, 60_000).allowed).toBe(true);
  });

  it('resets after the window elapses', () => {
    const key = 'test:window';
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(false);

    now += 60_001; // advance past the window
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(true);
  });
});

describe('clientIpFromXff', () => {
  it('returns the first IP from a comma list', () => {
    expect(clientIpFromXff('203.0.113.5, 70.41.3.18, 150.172.238.178')).toBe('203.0.113.5');
  });

  it('handles a single value and array form', () => {
    expect(clientIpFromXff('203.0.113.5')).toBe('203.0.113.5');
    expect(clientIpFromXff(['203.0.113.5', '10.0.0.1'])).toBe('203.0.113.5');
  });

  it('falls back to "unknown" for missing/empty values', () => {
    expect(clientIpFromXff(null)).toBe('unknown');
    expect(clientIpFromXff(undefined)).toBe('unknown');
    expect(clientIpFromXff('')).toBe('unknown');
  });
});
