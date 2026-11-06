import { cache } from "react";
import { getCachedJobsPage, getCachedProjectsPage, type JobsPageArgs, type ProjectsPageArgs } from "@/lib/cache";
import { publicReadDeadline } from "@/lib/publicReadDeadline";

export type CatalogState<T> =
  | { state: "empty" | "items"; data: T }
  | { state: "unavailable"; data: null; lastKnownCount: number | null };

// Counts alone can describe the last known state during an outage. Never
// substitute old rows: jobs may close and projects may be unpublished.
const counts = new Map<string, number>();

async function read<T extends { count: number }>(catalog: "projects" | "jobs", key: string, load: () => Promise<T>): Promise<CatalogState<T>> {
  const started = Date.now();
  const countKey = `${catalog}:${key}`;
  try {
    const data = await publicReadDeadline(load, 2000);
    counts.delete(countKey);
    counts.set(countKey, data.count);
    if (counts.size > 128) counts.delete(counts.keys().next().value!);
    return { state: data.count === 0 ? "empty" : "items", data };
  } catch {
    console.error(JSON.stringify({ event: "public_catalog_read_failed", catalog, duration_ms: Date.now() - started }));
    return { state: "unavailable", data: null, lastKnownCount: counts.get(countKey) ?? null };
  }
}

function key(args: object): string {
  return JSON.stringify(args, Object.keys(args).sort());
}

const projects = cache((args: string) => read("projects", args, () => getCachedProjectsPage(JSON.parse(args))));
const jobs = cache((args: string) => read("jobs", args, () => getCachedJobsPage(JSON.parse(args))));

/** Primitive cache keys share one complete result between metadata and page. */
export const getProjectsCatalogState = (args: ProjectsPageArgs) => projects(key(args));
export const getJobsCatalogState = (args: JobsPageArgs) => jobs(key(args));
