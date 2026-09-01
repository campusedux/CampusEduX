import { JOB_SORTS, JOB_TYPES } from "@/lib/marketplace";
import { Input, Select } from "@/components/ui";

export interface JobFilterState {
  q?: string;
  location?: string;
  type?: string;
  sort?: string;
}

/** GET `<form>` — mirrors ProjectFilters. Submitting navigates to `/jobs?…`. */
export function JobFilters({ state }: { state: JobFilterState }) {
  return (
    <form action="/jobs" method="get" className="space-y-5 text-sm">
      {state.q ? <input type="hidden" name="q" value={state.q} /> : null}

      <div>
        <label className="mb-1.5 block font-semibold text-ink" htmlFor="j-location">
          Location
        </label>
        <Input
          id="j-location"
          type="text"
          name="location"
          placeholder="Any location"
          defaultValue={state.location ?? ""}
        />
      </div>

      <div>
        <label className="mb-1.5 block font-semibold text-ink" htmlFor="j-type">
          Job type
        </label>
        <Select id="j-type" name="type" defaultValue={state.type ?? ""}>
          <option value="">All types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block font-semibold text-ink" htmlFor="j-sort">
          Sort by
        </label>
        <Select id="j-sort" name="sort" defaultValue={state.sort ?? "newest"}>
          {Object.entries(JOB_SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </Select>
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
