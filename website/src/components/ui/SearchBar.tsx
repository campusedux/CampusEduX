import { ArrowRight, Search } from "lucide-react";
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
  label,
  className,
}: {
  label?: string;
  action: string;
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  hiddenParams?: Record<string, string | undefined>;
  className?: string;
}) {
  return (
    <form action={action} method="get" role="search" className={cn("flex min-w-0 w-full items-center gap-2", className)}>
      <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3 transition-colors focus-within:border-primary focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/15 sm:px-3.5">
        <Search className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
        {label && <span className="sr-only">{label}</span>}
        <input
          type="search"
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={label ?? placeholder}
          className="h-10 min-w-0 w-full flex-1 bg-transparent text-base text-ink outline-none placeholder:text-sm placeholder:text-ink-faint sm:text-sm"
        />
      </div>
      {hiddenParams &&
        Object.entries(hiddenParams).map(([k, v]) =>
          v ? <input key={k} type="hidden" name={k} value={v} /> : null,
        )}
      <button
        type="submit"
        aria-label="Search"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition duration-[120ms] hover:bg-primary-600 sm:w-auto sm:px-4"
      >
        <ArrowRight className="h-4 w-4 sm:hidden" aria-hidden />
        <span className="sr-only sm:not-sr-only">Search</span>
      </button>
    </form>
  );
}

export default SearchBar;
