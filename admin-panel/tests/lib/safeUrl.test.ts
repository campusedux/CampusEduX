import { describe, it, expect } from 'vitest';
import { isSafeUrl, isSafeUrlOrEmpty, urlFieldError } from '@/lib/safeUrl';

describe('isSafeUrl', () => {
  it.each(['https://example.com/a?b=1', 'http://example.com', '/projects', '/a/b#c', '  https://x.io  '])('accepts %s', (u) => {
    expect(isSafeUrl(u)).toBe(true);
  });
  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'data:text/html;base64,AAAA',
    'vbscript:x',
    'file:///etc/passwd',
    '//evil.com',
    '/\\evil.com',
    'https://exa\nmple.com',
    'java\tscript:alert(1)',
    'example.com',
    'https://',
    '',
    null,
    undefined,
  ])('rejects %j', (u) => {
    expect(isSafeUrl(u as string | null | undefined)).toBe(false);
  });
  it('isSafeUrlOrEmpty allows blank', () => {
    expect(isSafeUrlOrEmpty('')).toBe(true);
    expect(isSafeUrlOrEmpty('  ')).toBe(true);
    expect(isSafeUrlOrEmpty('javascript:1')).toBe(false);
  });
});

describe('urlFieldError', () => {
  const form = (o: Record<string, string>) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(o)) fd.set(k, v);
    return fd;
  };
  it('returns null when all optional URLs are blank or safe', () => {
    expect(urlFieldError(form({ a: '', b: 'https://x.io' }), { a: 'A', b: 'B' })).toBeNull();
    expect(urlFieldError(form({}), { a: 'A' })).toBeNull();
  });
  it('names the offending field', () => {
    expect(urlFieldError(form({ a: 'https://ok.io', b: 'javascript:alert(1)' }), { a: 'A URL', b: 'B URL' })).toMatch(/^B URL:/);
  });
});
