/**
 * A job is publicly listable only when status = 'open' AND it has not passed its
 * deadline. RLS on `jobs` only checks audience targeting, so every public read
 * must apply this filter itself (see proposed policy in
 * mobile-app/supabase/proposed/jobs_public_open_only.sql).
 */

/** PostgREST `or` expression for "no deadline, or deadline not yet passed". */
export function activeDeadlineFilter(now: Date = new Date()): string {
  return `application_deadline.is.null,application_deadline.gte.${now.toISOString()}`;
}

/** Restricts a `jobs` query builder to open, unexpired rows. */
export function onlyActiveJobs<T>(builder: T, referencedTable?: string): T {
  // Loosely typed on purpose: the concrete PostgREST builder types recurse too deeply for a structural constraint.
  const q = builder as unknown as { eq: (c: string, v: string) => { or: (f: string, options?: { referencedTable: string }) => T } };
  const active = q.eq(referencedTable ? `${referencedTable}.status` : "status", "open");
  return referencedTable ? active.or(activeDeadlineFilter(), { referencedTable }) : active.or(activeDeadlineFilter());
}

export type JobAvailability = "open" | "closed" | "draft";

/** Classifies a fetched job row. Anything not 'open' and not 'draft' (or past deadline) is closed. */
export function jobAvailability(
  job: { status?: string | null; application_deadline?: string | null },
  now: Date = new Date(),
): JobAvailability {
  if (job.status === "draft") return "draft";
  // A missing status is treated as open: the column is NOT NULL DEFAULT 'open' in the DB.
  if (job.status != null && job.status !== "open") return "closed";
  if (job.application_deadline && new Date(job.application_deadline).getTime() < now.getTime()) return "closed";
  return "open";
}
