import { JOB_SORTS, JOB_TYPES } from "@/lib/marketplace";

export interface JobFilterState {
  q?: string;
  location?: string;
  type?: string;
  sort?: string;
}

/** GET `<form>` — mirrors ProjectFilters. Submitting navigates to `/jobs?…`. */
export function JobFilters({ state }: { state: JobFilterState }) {
  return (
    <form action="/jobs" method="get" className="space-y-4 text-sm">
      {state.q ? <input type="hidden" name="q" value={state.q} /> : null}

      <div>
        <label className="mb-1 block font-medium text-ink" htmlFor="j-location">
          Location
        </label>
        <input
          id="j-location"
          type="text"
          name="location"
          placeholder="Any location"
          defaultValue={state.location ?? ""}
          className="w-full rounded-lg border border-line bg-white px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block font-medium text-ink" htmlFor="j-type">
          Job type
        </label>
        <select
          id="j-type"
          name="type"
          defaultValue={state.type ?? ""}
          className="w-full rounded-lg border border-line bg-white px-3 py-2"
        >
          <option value="">All types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block font-medium text-ink" htmlFor="j-sort">
          Sort by
        </label>
        <select
          id="j-sort"
          name="sort"
          defaultValue={state.sort ?? "newest"}
          className="w-full rounded-lg border border-line bg-white px-3 py-2"
        >
          {Object.entries(JOB_SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary h-10 flex-1 px-4 text-sm">
          Apply
        </button>
        <a href="/jobs" className="btn-ghost h-10 px-4 text-sm">
          Reset
        </a>
      </div>
    </form>
  );
}

export default JobFilters;
