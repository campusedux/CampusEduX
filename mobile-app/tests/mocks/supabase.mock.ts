/**
 * Hand-rolled mock of the `@/lib/supabase` client for service unit tests.
 *
 * The real client throws at import time if the EXPO_PUBLIC_* env vars are
 * missing, so every service test does:
 *
 *   jest.mock("@/lib/supabase", () => require("../../mocks/supabase.mock").mockModule());
 *
 * and then drives behaviour with `setTableResult` / `setRpcResult` /
 * `setFunctionResult` before calling the service.
 */

type QueryResult = { data?: unknown; error?: unknown; count?: number };

/** A chainable, awaitable PostgREST query-builder stand-in. */
function queryBuilder(result: QueryResult) {
  const state: { single: boolean; head: boolean } = { single: false, head: false };

  const builder: Record<string, unknown> = {};
  const passthrough = [
    "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "is", "in",
    "or", "and", "not", "filter", "match", "contains", "overlaps", "range",
    "order", "limit", "textSearch", "returns",
  ];
  for (const name of passthrough) {
    builder[name] = jest.fn((..._args: unknown[]) => {
      if (name === "select" && (_args[1] as { head?: boolean } | undefined)?.head) {
        state.head = true;
      }
      return builder;
    });
  }
  builder.single = jest.fn(() => {
    state.single = true;
    return builder;
  });
  builder.maybeSingle = jest.fn(() => {
    state.single = true;
    return builder;
  });

  const resolve = () => {
    if (state.head) {
      return { data: null, error: result.error ?? null, count: result.count ?? 0 };
    }
    let data = result.data ?? null;
    if (state.single && Array.isArray(data)) data = data.length ? data[0] : null;
    return { data, error: result.error ?? null, count: result.count ?? null };
  };

  // make it awaitable
  builder.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
    Promise.resolve(resolve()).then(onFulfilled, onRejected);
  builder.catch = (onRejected: (e: unknown) => unknown) =>
    Promise.resolve(resolve()).catch(onRejected);

  return builder;
}

export interface MockConfig {
  /** table name -> result, or an array used as a FIFO queue across `.from()` calls */
  tables: Record<string, QueryResult | QueryResult[]>;
  rpc: Record<string, QueryResult>;
  functions: Record<string, { data?: unknown; error?: unknown }>;
  auth: Record<string, unknown>;
}

const config: MockConfig = { tables: {}, rpc: {}, functions: {}, auth: {} };

export function resetSupabaseMock() {
  config.tables = {};
  config.rpc = {};
  config.functions = {};
  config.auth = {};
  // clear call history on the shared jest.fn()s
  supabase.from.mockClear();
  supabase.rpc.mockClear();
  supabase.functions.invoke.mockClear();
  for (const fn of Object.values(supabase.auth)) (fn as jest.Mock).mockClear?.();
}

export function setTableResult(table: string, result: QueryResult | QueryResult[]) {
  config.tables[table] = result;
}
export function setRpcResult(name: string, result: QueryResult) {
  config.rpc[name] = result;
}
export function setFunctionResult(name: string, result: { data?: unknown; error?: unknown }) {
  config.functions[name] = result;
}
export function setAuthResult(method: string, value: unknown) {
  config.auth[method] = value;
}

function nextTableResult(table: string): QueryResult {
  const entry = config.tables[table];
  if (Array.isArray(entry)) return entry.shift() ?? { data: [] };
  return entry ?? { data: [] };
}

export const supabase = {
  from: jest.fn((table: string) => queryBuilder(nextTableResult(table))),
  rpc: jest.fn((name: string) => Promise.resolve({ ...(config.rpc[name] ?? { data: null }), error: config.rpc[name]?.error ?? null })),
  functions: {
    invoke: jest.fn((name: string) =>
      Promise.resolve({
        data: config.functions[name]?.data ?? null,
        error: config.functions[name]?.error ?? null,
      })
    ),
  },
  auth: {
    signInWithPassword: jest.fn(() => Promise.resolve(config.auth.signInWithPassword ?? { data: {}, error: null })),
    signUp: jest.fn(() => Promise.resolve(config.auth.signUp ?? { data: {}, error: null })),
    signInWithOtp: jest.fn(() => Promise.resolve(config.auth.signInWithOtp ?? { error: null })),
    verifyOtp: jest.fn(() => Promise.resolve(config.auth.verifyOtp ?? { data: {}, error: null })),
    updateUser: jest.fn(() => Promise.resolve(config.auth.updateUser ?? { data: {}, error: null })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
    getSession: jest.fn(() => Promise.resolve(config.auth.getSession ?? { data: { session: null }, error: null })),
    resend: jest.fn(() => Promise.resolve(config.auth.resend ?? { data: {}, error: null })),
    getUser: jest.fn(() => Promise.resolve(config.auth.getUser ?? { data: { user: null }, error: null })),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: { path: "x" }, error: null })),
      getPublicUrl: jest.fn((p: string) => ({ data: { publicUrl: `https://cdn.test/${p}` } })),
      createSignedUrl: jest.fn((p: string) =>
        Promise.resolve({ data: { signedUrl: `https://cdn.test/signed/${p}` }, error: null })
      ),
      remove: jest.fn(() => Promise.resolve({ data: [], error: null })),
      list: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
};

/** The object handed to `jest.mock("@/lib/supabase", ...)`. */
export function mockModule() {
  return { supabase };
}
