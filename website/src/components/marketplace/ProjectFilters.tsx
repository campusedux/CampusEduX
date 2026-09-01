import { PROJECT_SORTS } from "@/lib/marketplace";
import { Input, Select } from "@/components/ui";

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
    <form action="/projects" method="get" className="space-y-5 text-sm">
      {state.q ? <input type="hidden" name="q" value={state.q} /> : null}

      <div>
        <label className="mb-1.5 block font-semibold text-ink" htmlFor="f-category">
          Category
        </label>
        <Select id="f-category" name="category" defaultValue={state.category ?? ""}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <span className="mb-1.5 block font-semibold text-ink">Price (₹)</span>
        <div className="flex items-center gap-2">
          <Input type="number" name="min" min={0} placeholder="Min" defaultValue={state.min ?? ""} />
          <span className="text-ink-faint">–</span>
          <Input type="number" name="max" min={0} placeholder="Max" defaultValue={state.max ?? ""} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block font-semibold text-ink" htmlFor="f-sort">
          Sort by
        </label>
        <Select id="f-sort" name="sort" defaultValue={state.sort ?? "newest"}>
          {Object.entries(PROJECT_SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      <fieldset>
        <legend className="mb-1.5 font-semibold text-ink">Show only</legend>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-ink-muted">
            <input type="radio" name="flag" value="" defaultChecked={!state.flag} className="accent-primary" /> All projects
          </label>
          <label className="flex items-center gap-2 text-ink-muted">
            <input type="radio" name="flag" value="premium" defaultChecked={state.flag === "premium"} className="accent-primary" /> Premium
          </label>
          <label className="flex items-center gap-2 text-ink-muted">
            <input
              type="radio"
              name="flag"
              value="bestseller"
              defaultChecked={state.flag === "bestseller"}
              className="accent-primary"
            />{" "}
            Best sellers
          </label>
        </div>
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
