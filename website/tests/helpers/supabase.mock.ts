import { vi } from "vitest";

/**
 * Hand-rolled stand-in for the website's Supabase clients
 * (`@/lib/supabase/authed-server` and `@/lib/supabase/server`). Adapted from
 * admin-panel/tests/helpers/supabase.mock.ts, plus a `storage` shim for the
 * resume upload path.
 *
 *   vi.mock('@/lib/supabase/authed-server', () => ({ createAuthedServerSupabase: () => supabase }));
 *   vi.mock('@/lib/supabase/server', () => ({ getPublicSupabase: () => supabase }));
 */

type QueryResult = { data?: unknown; error?: unknown; count?: number | null };
export type RecordedCall = {
  table?: string;
  verb?: string;
  rpc?: string;
  storage?: string;
  args: unknown[];
};

const state: {
  user: unknown;
  tables: Record<string, QueryResult>;
  rpc: Record<string, QueryResult>;
  signedUrl: { data?: unknown; error?: unknown };
  exchangeCodeForSession: { data?: unknown; error?: unknown };
} = {
  user: null,
  tables: {},
  rpc: {},
  signedUrl: { data: { signedUrl: "https://signed.example/resume.pdf" }, error: null },
  exchangeCodeForSession: { data: {}, error: null },
};

export const supabase = {
  calls: [] as RecordedCall[],
  from: vi.fn((table: string) => builder(table)),
  rpc: vi.fn((name: string, args: unknown) => {
    supabase.calls.push({ rpc: name, args: [args] });
    return Promise.resolve(state.rpc[name] ?? { data: null, error: null });
  }),
  storage: {
    from: vi.fn((bucket: string) => ({
      upload: vi.fn((...args: unknown[]) => {
        supabase.calls.push({ storage: bucket, verb: "upload", args });
        return Promise.resolve({ data: { path: String(args[0] ?? "") }, error: null });
      }),
      createSignedUrl: vi.fn((...args: unknown[]) => {
        supabase.calls.push({ storage: bucket, verb: "createSignedUrl", args });
        return Promise.resolve(state.signedUrl);
      }),
    })),
  },
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: state.user }, error: null })),
    exchangeCodeForSession: vi.fn((code: string) => {
      supabase.calls.push({ verb: "exchangeCodeForSession", args: [code] });
      return Promise.resolve(state.exchangeCodeForSession);
    }),
  },
};

export function resetSupabaseMock() {
  state.user = null;
  state.tables = {};
  state.rpc = {};
  state.signedUrl = { data: { signedUrl: "https://signed.example/resume.pdf" }, error: null };
  state.exchangeCodeForSession = { data: {}, error: null };
  supabase.calls = [];
  supabase.from.mockClear();
  supabase.rpc.mockClear();
  supabase.storage.from.mockClear();
  supabase.auth.getUser.mockClear();
  supabase.auth.exchangeCodeForSession.mockClear();
}

export function setUser(user: unknown) {
  state.user = user;
}
export function setTableResult(table: string, result: QueryResult) {
  state.tables[table] = result;
}
export function setRpcResult(name: string, result: QueryResult) {
  state.rpc[name] = result;
}
export function setSignedUrlResult(result: { data?: unknown; error?: unknown }) {
  state.signedUrl = result;
}
export function setExchangeCodeForSessionResult(result: { data?: unknown; error?: unknown }) {
  state.exchangeCodeForSession = result;
}

export function callsFor(table: string) {
  return supabase.calls.filter((c) => c.table === table);
}
export function rpcCall(name: string) {
  return supabase.calls.find((c) => c.rpc === name);
}
export function storageCalls(bucket: string) {
  return supabase.calls.filter((c) => c.storage === bucket);
}

/** A thenable query builder — every PostgREST verb returns `this`; awaiting resolves the table's configured result. */
function builder(table: string) {
  const result = () => state.tables[table] ?? { data: null, error: null };
  const chain: Record<string, unknown> = {};
  const verbs = [
    "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "gt", "gte", "lt", "lte", "in", "is", "or", "and", "not",
    "ilike", "like", "contains", "overlaps", "order", "limit", "range", "filter", "match",
  ];
  for (const v of verbs) {
    chain[v] = vi.fn((...args: unknown[]) => {
      supabase.calls.push({ table, verb: v, args });
      return chain;
    });
  }
  chain.single = vi.fn(() => Promise.resolve(result()));
  chain.maybeSingle = vi.fn(() => Promise.resolve(result()));
  chain.then = (onOk: (v: QueryResult) => unknown, onErr?: (e: unknown) => unknown) =>
    Promise.resolve(result()).then(onOk, onErr);
  return chain;
}
