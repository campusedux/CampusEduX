import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * App-style pill search. Renders as a GET `<form>` so it works without JS
 * (server components). Pass extra hidden filters via `hiddenParams`.
 */
export function SearchBar({
  action,
  name = "q",
  defaultValue,
  placeholder = "Search…",
  hiddenParams,
  className,
}: {
  action: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  hiddenParams?: Record<string, string | undefined>;
  className?: string;
}) {
  return (
    <form action={action} method="get" role="search" className={cn("flex w-full items-center gap-2", className)}>
      <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3.5">
        <Search className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
        <input
          type="search"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
      </div>
      {hiddenParams &&
        Object.entries(hiddenParams).map(([k, v]) =>
          v ? <input key={k} type="hidden" name={k} value={v} /> : null,
        )}
      <button
        type="submit"
        className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-600"
      >
        Search
      </button>
    </form>
  );
}

export default SearchBar;
