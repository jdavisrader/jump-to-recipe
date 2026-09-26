/**
 * @jest-environment node
 */

// Keep the developer's local .env out of these tests.
jest.mock('dotenv/config', () => ({}));

const BASE_ENV = {
  DATABASE_URL: 'postgres://localhost/test',
  NEXTAUTH_SECRET: 'secret',
  GOOGLE_ID: 'google-id',
  GOOGLE_SECRET: 'google-secret',
  NODE_ENV: 'production',
};

const originalEnv = process.env;

async function loadEnvWith(overrides: Record<string, string | undefined>) {
  process.env = { ...BASE_ENV, ...overrides } as NodeJS.ProcessEnv;
  let loaded: unknown;
  await jest.isolateModulesAsync(async () => {
    loaded = (await import('../env')).env;
  });
  return loaded;
}

describe('env NEXTAUTH_URL requirement', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('requires NEXTAUTH_URL in production off Vercel (Docker / Pi)', async () => {
    await expect(loadEnvWith({})).rejects.toThrow('Invalid environment variables');
  });

  it('does not require NEXTAUTH_URL on Vercel, where NextAuth uses the trusted forwarded host', async () => {
    await expect(loadEnvWith({ VERCEL: '1' })).resolves.toBeDefined();
  });

  it('does not require NEXTAUTH_URL during the build phase', async () => {
    await expect(loadEnvWith({ NEXT_PHASE: 'phase-production-build' })).resolves.toBeDefined();
  });

  it('accepts production off Vercel when NEXTAUTH_URL is set', async () => {
    await expect(loadEnvWith({ NEXTAUTH_URL: 'https://recipes.example.com' })).resolves.toBeDefined();
  });
});
