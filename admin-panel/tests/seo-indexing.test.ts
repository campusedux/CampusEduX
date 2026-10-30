import { describe, expect, it } from 'vitest';

describe('staff portal indexing', () => {
  it('returns noindex for all routes including publicly accessible login', async () => {
    const { default: config } = await import(/* @vite-ignore */ new URL('../next.config.mjs', import.meta.url).href);
    const rules = await config.headers();
    const global = rules.find((rule: { source: string }) => rule.source === '/(.*)');
    expect(global?.headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
    expect(global?.headers).toContainEqual({ key: 'X-Frame-Options', value: 'DENY' });
  });
});
