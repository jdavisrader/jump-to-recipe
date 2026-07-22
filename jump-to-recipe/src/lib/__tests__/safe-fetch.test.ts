import dns from 'dns/promises';
import { ReadableStream } from 'node:stream/web';
import { isBlockedIp, assertUrlIsPublic, readCappedText, SsrfError } from '../safe-fetch';

jest.mock('dns/promises', () => ({
  __esModule: true,
  default: { lookup: jest.fn() },
}));

const mockedLookup = dns.lookup as unknown as jest.Mock;

describe('isBlockedIp', () => {
  it('blocks IPv4 loopback / private / link-local ranges', () => {
    expect(isBlockedIp('127.0.0.1')).toBe(true);
    expect(isBlockedIp('10.0.0.5')).toBe(true);
    expect(isBlockedIp('172.16.0.1')).toBe(true);
    expect(isBlockedIp('192.168.1.1')).toBe(true);
    expect(isBlockedIp('169.254.169.254')).toBe(true); // cloud metadata
    expect(isBlockedIp('0.0.0.0')).toBe(true);
  });

  it('allows public IPv4 addresses', () => {
    expect(isBlockedIp('8.8.8.8')).toBe(false);
    expect(isBlockedIp('1.1.1.1')).toBe(false);
    expect(isBlockedIp('93.184.216.34')).toBe(false);
  });

  it('blocks IPv6 loopback / unique-local / link-local and mapped IPv4', () => {
    expect(isBlockedIp('::1')).toBe(true);
    expect(isBlockedIp('::')).toBe(true);
    expect(isBlockedIp('fc00::1')).toBe(true);
    expect(isBlockedIp('fe80::1')).toBe(true);
    expect(isBlockedIp('::ffff:127.0.0.1')).toBe(true); // IPv4-mapped loopback
  });

  it('allows a public IPv6 address', () => {
    expect(isBlockedIp('2606:4700:4700::1111')).toBe(false);
  });

  it('rejects non-IP strings conservatively', () => {
    expect(isBlockedIp('not-an-ip')).toBe(true);
  });
});

describe('assertUrlIsPublic', () => {
  beforeEach(() => mockedLookup.mockReset());

  it('rejects non-http(s) schemes', async () => {
    await expect(assertUrlIsPublic('file:///etc/passwd')).rejects.toThrow(SsrfError);
    await expect(assertUrlIsPublic('gopher://example.com')).rejects.toThrow(SsrfError);
  });

  it('rejects malformed URLs', async () => {
    await expect(assertUrlIsPublic('notaurl')).rejects.toThrow(SsrfError);
  });

  it('rejects a literal private IP without DNS lookup', async () => {
    await expect(assertUrlIsPublic('http://169.254.169.254/latest/meta-data')).rejects.toThrow(
      SsrfError
    );
    expect(mockedLookup).not.toHaveBeenCalled();
  });

  it('rejects a hostname that resolves to a private address', async () => {
    mockedLookup.mockResolvedValue([{ address: '10.0.0.1', family: 4 }]);
    await expect(assertUrlIsPublic('http://internal.evil.com')).rejects.toThrow(SsrfError);
  });

  it('rejects when any resolved address is private (DNS rebinding style)', async () => {
    mockedLookup.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ]);
    await expect(assertUrlIsPublic('http://mixed.example.com')).rejects.toThrow(SsrfError);
  });

  it('allows a hostname that resolves to a public address', async () => {
    mockedLookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    const url = await assertUrlIsPublic('https://example.com/recipe');
    expect(url.hostname).toBe('example.com');
  });
});

// Minimal Response stand-in — the jsdom global Response lacks a usable
// headers/body; in the real route runtime this is undici's Response.
function makeResponse(opts: { contentLength?: string | null; body?: string }): Response {
  const { contentLength = null, body } = opts;
  return {
    headers: { get: (key: string) => (key === 'content-length' ? contentLength : null) },
    body:
      body === undefined
        ? null
        : new ReadableStream<Uint8Array>({
            start(controller) {
              controller.enqueue(new Uint8Array(Buffer.from(body)));
              controller.close();
            },
          }),
    text: async () => body ?? '',
  } as unknown as Response;
}

describe('readCappedText', () => {
  it('rejects a body that exceeds the cap via Content-Length', async () => {
    const response = makeResponse({ contentLength: '999999999', body: 'x' });
    await expect(readCappedText(response, 1024)).rejects.toThrow(SsrfError);
  });

  it('rejects a streamed body that exceeds the cap', async () => {
    const response = makeResponse({ body: 'x'.repeat(5000) });
    await expect(readCappedText(response, 1024)).rejects.toThrow(SsrfError);
  });

  it('returns the text when under the cap', async () => {
    const response = makeResponse({ body: 'hello world' });
    await expect(readCappedText(response, 1024)).resolves.toBe('hello world');
  });
});
