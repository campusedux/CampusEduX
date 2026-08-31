import { PROJECT_SORTS } from "@/lib/marketplace";

export interface ProjectFilterState {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  flag?: string;
}

/**
 * GET `<form>` — works without JS. Rendered inside `<FilterSheet>` (desktop
 * aside + mobile drawer). Submitting navigates to `/projects?…`.
 */
export function ProjectFilters({
  categories,
  state,
}: {
  categories: { id: string; name: string }[];
  state: ProjectFilterState;
}) {
  return (
    <form action="/projects" method="get" className="space-y-4 text-sm">
      {state.q ? <input type="hidden" name="q" value={state.q} /> : null}

      <div>
        <label className="mb-1 block font-medium text-ink" htmlFor="f-category">
          Category
        </label>
        <select
          id="f-category"
          name="category"
          defaultValue={state.category ?? ""}
          className="w-full rounded-lg border border-line bg-white px-3 py-2"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className="mb-1 block font-medium text-ink">Price (₹)</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="min"
            min={0}
            placeholder="Min"
            defaultValue={state.min ?? ""}
            className="w-full rounded-lg border border-line bg-white px-3 py-2"
          />
          <span className="text-ink-faint">–</span>
          <input
            type="number"
            name="max"
            min={0}
            placeholder="Max"
            defaultValue={state.max ?? ""}
            className="w-full rounded-lg border border-line bg-white px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-medium text-ink" htmlFor="f-sort">
          Sort by
        </label>
        <select
          id="f-sort"
          name="sort"
          defaultValue={state.sort ?? "newest"}
          className="w-full rounded-lg border border-line bg-white px-3 py-2"
        >
          {Object.entries(PROJECT_SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-1 font-medium text-ink">Show only</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="flag" value="" defaultChecked={!state.flag} /> All projects
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="flag" value="premium" defaultChecked={state.flag === "premium"} /> Premium
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="flag" value="bestseller" defaultChecked={state.flag === "bestseller"} /> Best sellers
        </label>
      </fieldset>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary h-10 flex-1 px-4 text-sm">
          Apply
        </button>
        <a href="/projects" className="btn-ghost h-10 px-4 text-sm">
          Reset
        </a>
      </div>
    </form>
  );
}

export default ProjectFilters;
