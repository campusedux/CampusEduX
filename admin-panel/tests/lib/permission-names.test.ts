import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { MODULES } from '@/lib/permissions';

/**
 * ADM-01 guard: once DB-level has_permission() enforcement lands, a
 * requirePermission('<module>', '<action>') whose module is not a
 * role_permissions row would hard-fail for every non-super_admin. Every literal
 * module/action used in admin server code must be a known module + action.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(f)) out.push(p);
  }
  return out;
}

describe('requirePermission names', () => {
  const src = walk(join(__dirname, '../../src')).map((p) => ({ p, s: readFileSync(p, 'utf8') }));
  const actions = new Set(['view', 'add', 'edit', 'delete']);

  it('every literal module/action pair exists in the permission model', () => {
    const literal = /requirePermission\(\s*'([a-z_]+)'\s*,\s*'([a-z_]+)'/g;
    let n = 0;
    for (const { p, s } of src) {
      for (const m of s.matchAll(literal)) {
        n++;
        expect(MODULES as readonly string[], `${p}: module ${m[1]}`).toContain(m[1]);
        expect(actions.has(m[2]), `${p}: action ${m[2]}`).toBe(true);
      }
    }
    expect(n).toBeGreaterThan(50);
  });

  it('every `const MODULE = ...` constant used with requirePermission is a known module', () => {
    for (const { p, s } of src) {
      const m = s.match(/const MODULE = '([a-z_]+)'/);
      if (m) expect(MODULES as readonly string[], p).toContain(m[1]);
    }
  });
});
