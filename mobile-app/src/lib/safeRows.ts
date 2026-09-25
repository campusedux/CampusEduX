/**
 * Helpers for PostgREST rows that embed a joined row (`job:jobs(...)`).
 * The embed is `null` when the joined row is hidden by RLS or deleted, so
 * mapping it blindly (`mapJobRow(row.job)`) throws and takes the whole list
 * down. Always drop those rows first.
 */

/** Rows whose embedded `key` is non-null. */
export function compactRows<T extends Record<string, any>>(rows: T[] | null | undefined, key: string): T[] {
  return (rows ?? []).filter((row) => row != null && row[key] != null);
}
