import { vi } from 'vitest';

/**
 * Hand-rolled stand-in for the `@/lib/supabase/server` client. The real one
 * calls `next/headers` cookies() and reads env vars at import time, so tests
 * mock the module and drive behaviour with the setters below.
 *
 *   vi.mock('@/lib/supabase/server', () => ({ createClient: () => supabase }));
 *
 * `supabase.calls` records every builder verb ({ table, verb, args }) and
 * every rpc ({ rpc, args }) so tests can assert what a Server Action wrote.
 */

type QueryResult = { data?: unknown; error?: unknown; count?: number | null };
export type RecordedCall = { table?: string; verb?: string; rpc?: string; args: unknown[] };

const state: {
  user: unknown;
  tables: Record<string, QueryResult>;
  rpc: Record<string, QueryResult>;
} = { user: null, tables: {}, rpc: {} };

export const supabase = {
  calls: [] as RecordedCall[],
  from: vi.fn((table: string) => builder(table)),
  rpc: vi.fn((name: string, args: unknown) => {
    supabase.calls.push({ rpc: name, args: [args] });
    return Promise.resolve(state.rpc[name] ?? { data: null, error: null });
  }),
  auth: {
    getUser: vi.fn(() => Promise.resolve({ data: { user: state.user }, error: null })),
  },
};

export function resetSupabaseMock() {
  state.user = null;
  state.tables = {};
  state.rpc = {};
  supabase.calls = [];
  supabase.from.mockClear();
  supabase.rpc.mockClear();
  supabase.auth.getUser.mockClear();
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

/** All recorded verbs for a table, or all rpc calls by name. */
export function callsFor(table: string) {
  return supabase.calls.filter((c) => c.table === table);
}
export function rpcCall(name: string) {
  return supabase.calls.find((c) => c.rpc === name);
}

/** A thenable query builder — every PostgREST verb returns `this`, awaiting resolves the table's configured result. */
function builder(table: string) {
  const result = () => state.tables[table] ?? { data: null, error: null };
  const chain: Record<string, unknown> = {};
  const verbs = [
    'select', 'insert', 'update', 'upsert', 'delete',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'is', 'or', 'and', 'not',
    'ilike', 'like', 'contains', 'overlaps', 'order', 'limit', 'range', 'filter', 'match',
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
