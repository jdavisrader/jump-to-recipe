/**
 * SSRF-hardened fetch for user-supplied URLs (recipe import / scraping).
 *
 * Blocks requests to private, loopback, and link-local addresses (incl. cloud
 * metadata 169.254.169.254), allows only http/https, follows redirects manually
 * while re-validating each hop, and caps the response size.
 *
 * Residual risk: DNS rebinding. We resolve and validate the hostname, but the
 * subsequent `fetch` re-resolves, so a hostile resolver could return a public IP
 * to us and a private IP to fetch (TOCTOU). Fully closing this requires pinning
 * the validated IP and connecting to it directly, which the platform `fetch` does
 * not support cleanly. The lookup check + per-hop re-validation is the pragmatic
 * mitigation for this app's threat model.
 */
import net from 'net';
import dns from 'dns/promises';

const MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 15_000;
export const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Thrown when a URL is rejected by the SSRF guard (as opposed to a network error). */
export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SsrfError';
  }
}

function ipv4ToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function inCidr(ip: string, subnet: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipv4ToLong(ip) & mask) === (ipv4ToLong(subnet) & mask);
}

function isBlockedIpv4(ip: string): boolean {
  return (
    inCidr(ip, '0.0.0.0', 8) || // "this" network
    inCidr(ip, '10.0.0.0', 8) || // private
    inCidr(ip, '100.64.0.0', 10) || // carrier-grade NAT
    inCidr(ip, '127.0.0.0', 8) || // loopback
    inCidr(ip, '169.254.0.0', 16) || // link-local (incl. cloud metadata)
    inCidr(ip, '172.16.0.0', 12) || // private
    inCidr(ip, '192.168.0.0', 16) || // private
    inCidr(ip, '198.18.0.0', 15) || // benchmarking
    ip === '255.255.255.255'
  );
}

function isBlockedIpv6(ip: string): boolean {
  const addr = ip.toLowerCase();
  if (addr === '::' || addr === '::1') return true; // unspecified / loopback
  const mapped = addr.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return isBlockedIpv4(mapped[1]); // IPv4-mapped
  if (/^f[cd]/.test(addr)) return true; // unique local fc00::/7
  if (/^fe[89ab]/.test(addr)) return true; // link-local fe80::/10
  return false;
}

/** True if the literal IP address is in a private/loopback/link-local range. */
export function isBlockedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isBlockedIpv4(ip);
  if (version === 6) return isBlockedIpv6(ip);
  return true; // not a valid IP → reject conservatively
}

/**
 * Validate that a URL is safe to fetch: http/https only, and every address the
 * hostname resolves to must be public. Returns the parsed URL.
 */
export async function assertUrlIsPublic(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfError('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SsrfError('Only http and https URLs are allowed');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) {
      throw new SsrfError('URL resolves to a blocked address');
    }
    return url;
  }

  let addresses: Array<{ address: string }>;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new SsrfError('Could not resolve hostname');
  }

  if (addresses.length === 0) {
    throw new SsrfError('Could not resolve hostname');
  }
  for (const { address } of addresses) {
    if (isBlockedIp(address)) {
      throw new SsrfError('URL resolves to a blocked address');
    }
  }

  return url;
}

export interface SafeFetchInit extends Omit<RequestInit, 'redirect'> {
  timeoutMs?: number;
}

/**
 * Fetch a user-supplied URL with SSRF protection. Validates the URL and every
 * redirect hop against {@link isBlockedIp}, enforces a timeout, and never lets
 * the platform auto-follow redirects to an unvalidated host.
 */
export async function safeFetch(rawUrl: string, init: SafeFetchInit = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchInit } = init;
  let currentUrl = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertUrlIsPublic(currentUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { ...fetchInit, redirect: 'manual', signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      currentUrl = new URL(location, url).toString();
      continue;
    }

    return response;
  }

  throw new SsrfError('Too many redirects');
}

/** Read a response body as text, aborting if it exceeds the byte cap. */
export async function readCappedText(response: Response, cap: number = MAX_RESPONSE_BYTES): Promise<string> {
  const contentLength = response.headers.get('content-length');
  if (contentLength && Number(contentLength) > cap) {
    throw new SsrfError('Response too large');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return response.text();
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > cap) {
      await reader.cancel();
      throw new SsrfError('Response too large');
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks).toString('utf-8');
}
