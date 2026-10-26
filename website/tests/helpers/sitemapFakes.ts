import { vi } from "vitest";

/**
 * Test doubles for the sitemap routes (src/app/sitemap.xml, src/app/sitemaps/*).
 *
 * `fakeSitemapSupabase` is a chainable PostgREST stand-in: every filter
 * (`select`/`eq`/`is`/`not`/`or`/`order`/`limit`) is recorded and returns the
 * builder; `.range(from, to)` resolves that slice of the configured rows, so
 * the loaders' pagination runs for real; awaiting the builder directly
 * resolves every row. A name listed in `errors` resolves `{ data: null, error }`.
 */

type Rows = Record<string, unknown[]>;
export type FakeCall = { kind: "table" | "rpc"; name: string; ops: unknown[][] };

export function fakeSitemapSupabase({
  tables = {},
  rpcs = {},
  errors = [],
  rpcResults = {},
}: { tables?: Rows; rpcs?: Rows; errors?: string[]; rpcResults?: Record<string, unknown> } = {}) {
  const calls: FakeCall[] = [];

  function chain(name: string, rows: unknown[], rec: FakeCall) {
    const fail = errors.includes(name);
    const result = (data: unknown[]) => (fail ? { data: null, error: { message: "boom" } } : { data, error: null });
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is", "not", "or", "order", "limit", "in", "ilike"]) {
      b[m] = (...args: unknown[]) => {
        rec.ops.push([m, ...args]);
        return b;
      };
    }
    b.range = (from: number, to: number) => {
      rec.ops.push(["range", from, to]);
      return Promise.resolve(result(rows.slice(from, to + 1)));
    };
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(result(rows)).then(res, rej);
    return b;
  }

  return {
    calls,
    from(table: string) {
      const rec: FakeCall = { kind: "table", name: table, ops: [] };
      calls.push(rec);
      return chain(table, tables[table] ?? [], rec);
    },
    rpc(fn: string, args: unknown) {
      const rec: FakeCall = { kind: "rpc", name: fn, ops: [["args", args]] };
      calls.push(rec);
      if (Object.prototype.hasOwnProperty.call(rpcResults, fn)) {
        return Promise.resolve(errors.includes(fn) ? { data: null, error: { message: "boom" } } : { data: rpcResults[fn], error: null });
      }
      return chain(fn, rpcs[fn] ?? [], rec);
    },
  };
}

export const SITEMAP_SECTION_NAMES = [
  "static",
  "learning",
  "problems",
  "interview-questions",
  "jobs",
  "projects",
  "blog",
] as const;

/**
 * Fresh module graph with `next/cache` (unstable_cache → pass-through; it
 * needs Next's incremental cache otherwise) and the public Supabase client
 * replaced. Returns helpers that call the real route handlers.
 */
export async function loadSitemapRoutes(supabase: unknown) {
  vi.resetModules();
  vi.doMock("next/cache", () => ({
    unstable_cache: <T>(fn: T) => fn,
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
  }));
  vi.doMock("@/lib/supabase/server", () => ({ getPublicSupabase: () => supabase }));

  const index = await import("@/app/sitemap.xml/route");
  const sections = {
    static: await import("@/app/sitemaps/static.xml/route"),
    learning: await import("@/app/sitemaps/learning.xml/route"),
    problems: await import("@/app/sitemaps/problems.xml/route"),
    "interview-questions": await import("@/app/sitemaps/interview-questions.xml/route"),
    jobs: await import("@/app/sitemaps/jobs.xml/route"),
    projects: await import("@/app/sitemaps/projects.xml/route"),
    blog: await import("@/app/sitemaps/blog.xml/route"),
  };

  return {
    index,
    sections,
    async indexXml() {
      return (await index.GET()).text();
    },
    async sectionXml(name: (typeof SITEMAP_SECTION_NAMES)[number]) {
      return (await sections[name].GET()).text();
    },
    /** Every <loc> across all child sitemaps. */
    async allLocs() {
      const out: string[] = [];
      for (const name of SITEMAP_SECTION_NAMES) out.push(...locs(await (await sections[name].GET()).text()));
      return out;
    },
  };
}

export function unloadSitemapRoutes() {
  vi.doUnmock("next/cache");
  vi.doUnmock("@/lib/supabase/server");
  vi.resetModules();
}

export function locs(xml: string): string[] {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
}

/** `<url>` / `<sitemap>` blocks as { loc, lastmod? }. */
export function urlEntries(xml: string): { loc: string; lastmod?: string }[] {
  return [...xml.matchAll(/<(?:url|sitemap)><loc>([^<]*)<\/loc>(?:<lastmod>([^<]*)<\/lastmod>)?<\/(?:url|sitemap)>/g)].map(
    (m) => (m[2] ? { loc: m[1], lastmod: m[2] } : { loc: m[1] }),
  );
}
