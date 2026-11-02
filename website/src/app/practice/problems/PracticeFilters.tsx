import Link from "next/link";
import { Input, Select } from "@/components/ui";
import { PRACTICE_DIFFICULTIES, PRACTICE_LANGUAGES, PRACTICE_LANGUAGE_LABEL } from "@/lib/practice.types";
import type { PracticeCategory, PracticeQuery } from "@/lib/practice.types";

/**
 * GET `<form>` — works without JS. Rendered inside `<FilterSheet>` (desktop
 * aside + mobile drawer). Submitting navigates to `/practice/problems?…`.
 * Mirrors `components/marketplace/ProjectFilters.tsx`.
 */
export function PracticeFilters({
  categories,
  state,
}: {
  categories: PracticeCategory[];
  state: PracticeQuery;
}) {
  return (
    <form action="/practice/problems" method="get" className="space-y-5 text-sm">
      <div>
        <label className="mb-1.5 block font-semibold text-ink" htmlFor="f-q">
          Problem name
        </label>
        <Input id="f-q" type="search" name="q" placeholder="Search titles…" defaultValue={state.q ?? ""} />
      </div>

      <div>
        <label className="mb-1.5 block font-semibold text-ink" htmlFor="f-difficulty">
          Difficulty
        </label>
        <Select id="f-difficulty" name="difficulty" defaultValue={state.difficulty ?? ""}>
          <option value="">Any difficulty</option>
          {PRACTICE_DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block font-semibold text-ink" htmlFor="f-category">
          Topic
        </label>
        <Select id="f-category" name="category" defaultValue={state.category ?? ""}>
          <option value="">All topics</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.problem_count})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1.5 block font-semibold text-ink" htmlFor="f-lang">
          Language
        </label>
        <Select id="f-lang" name="lang" defaultValue={state.lang ?? ""}>
          <option value="">Any language</option>
          {PRACTICE_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {PRACTICE_LANGUAGE_LABEL[l]}
            </option>
          ))}
        </Select>
      </div>

      <fieldset>
        <legend className="mb-1.5 font-semibold text-ink">Progress</legend>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-ink-muted">
            <input type="radio" name="status" value="" defaultChecked={!state.status} className="accent-primary" /> All
          </label>
          <label className="flex items-center gap-2 text-ink-muted">
            <input
              type="radio"
              name="status"
              value="solved"
              defaultChecked={state.status === "solved"}
              className="accent-primary"
            />{" "}
            Solved
          </label>
          <label className="flex items-center gap-2 text-ink-muted">
            <input
              type="radio"
              name="status"
              value="unsolved"
              defaultChecked={state.status === "unsolved"}
              className="accent-primary"
            />{" "}
            Unsolved
          </label>
        </div>
        <p className="mt-1.5 text-xs text-ink-faint">Solved / Unsolved applies to the current page and needs you signed in.</p>
      </fieldset>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary h-10 flex-1 px-4 text-sm">
          Apply
        </button>
        <Link href="/practice/problems" prefetch={false} className="btn-ghost h-10 px-4 text-sm">
          Reset
        </Link>
      </div>
    </form>
  );
}

export default PracticeFilters;
