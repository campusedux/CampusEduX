import { unstable_cache } from "next/cache";

/** Thrown inside a cached read so a failed RPC is never stored in the data cache. */
export class RpcFailed extends Error {}

/**
 * Cross-request cache for a public (anon-client) RPC read.
 *
 * Errors THROW inside the cached function (`RpcFailed`), so a transient failure is
 * never cached; the caller gets `fallback` and the next request retries. "Not found"
 * (null) IS cached and carries the same tags, so publishing it later is picked up
 * by tag revalidation. Only ever use this with the anon client (never cookies).
 */
export async function cachedPublicRead<A extends string[], R>(
  key: string,
  args: A,
  tags: string[],
  ttl: number,
  read: (...a: A) => Promise<R>,
  fallback: R,
): Promise<R> {
  try {
    return await unstable_cache(read, [key, ...args], { revalidate: ttl, tags })(...args);
  } catch {
    return fallback;
  }
}
