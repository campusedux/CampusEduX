import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// The shared revalidation value must never reach the browser: it may only be
// read by server-only modules. These are static guards over the admin source.
const root = join(__dirname, '..', '..', 'src');
const VAR = 'REVALIDATE_' + 'SECRET';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}
const files = walk(root).map((f) => ({ f, rel: f.slice(root.length + 1), src: readFileSync(f, 'utf8') }));
const isClient = (src: string) => /^\s*['"]use client['"]/.test(src);

describe('revalidation value stays server-side', () => {
  it('is never exposed through a NEXT_PUBLIC_ variable', () => {
    for (const { rel, src } of files) expect(src, rel).not.toContain('NEXT_PUBLIC_' + VAR);
  });

  it('is only read by the Learning helper and the existing Blog action', () => {
    const readers = files.filter(({ src }) => src.includes(VAR)).map(({ rel }) => rel);
    expect(readers.sort()).toEqual(['app/(panel)/blog/actions.ts', 'lib/learning/siteRevalidate.ts']);
  });

  it('no client component imports the server helpers or mentions the variable', () => {
    for (const { rel, src } of files) {
      if (!isClient(src)) continue;
      expect(src, rel).not.toMatch(/learning\/siteRevalidate|learning\/siteSync/);
      expect(src, rel).not.toContain(VAR);
    }
  });

  it('the server helper modules are not client modules', () => {
    const helpers = files.filter(({ rel }) => /^lib\/learning\/site(Revalidate|Sync)\.ts$/.test(rel));
    expect(helpers).toHaveLength(2);
    for (const { src } of helpers) expect(isClient(src)).toBe(false);
  });

  it('the retry action is a server action that checks permission and re-validates tags', () => {
    const retry = files.find(({ rel }) => rel === 'app/(panel)/learning/site-sync-actions.ts')!;
    expect(retry.src.trimStart().startsWith("'use server'")).toBe(true);
    expect(retry.src).toContain("requirePermission('learning', 'edit')");
    expect(retry.src).toContain('sanitizeTags(');
  });
});
