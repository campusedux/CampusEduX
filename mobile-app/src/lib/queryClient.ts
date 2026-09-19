import { QueryClient } from "@tanstack/react-query";

/**
 * App-wide React Query client. Lives in its own module (not RootProvider) so
 * non-React code — notably `performLogoutCleanup()` — can clear the cache.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

/**
 * Scope a query key to the signed-in user. The user id is appended, so the
 * unscoped base key stays a valid *prefix* for `invalidateQueries` calls, while
 * two accounts on the same device can never share a cache entry.
 */
export function userScopedKey<T extends readonly unknown[]>(base: T, userId: string | null | undefined) {
  return [...base, userId ?? "anon"] as const;
}
