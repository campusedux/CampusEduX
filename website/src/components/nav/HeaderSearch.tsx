import { Search } from "lucide-react";

/**
 * Always-on search pill in the desktop header (`lg+`). Plain GET `<form>` to
 * the marketplace — same target as the homepage search, works without JS. The
 * field widens on focus. Below `lg` the icon-only `<HeaderSearchButton>` takes
 * over so the bar stays uncluttered.
 */
export function HeaderSearch() {
  return (
    <form action="/projects" method="get" role="search" className="hidden lg:flex">
      <div className="flex h-10 w-48 items-center gap-2 rounded-full border border-line bg-surface px-4 transition-[width,background-color,border-color,box-shadow] focus-within:border-primary focus-within:bg-white focus-within:shadow-sm xl:w-64 xl:focus-within:w-72">
        <Search className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
        <input
          type="search"
          name="q"
          placeholder="Search projects…"
          aria-label="Search projects"
          className="h-full w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
      </div>
    </form>
  );
}

export default HeaderSearch;
