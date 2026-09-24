"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HEADER_LINKS } from "./navConfig";
import { cn } from "@/lib/cn";

/**
 * Desktop primary navigation (lg+), a segmented pill centred in the leftover
 * header width. Below lg the hamburger drawer (which lists every destination)
 * takes over. Lower-priority modules join as the viewport widens, so the pill
 * never has to overflow into the wordmark or the action buttons:
 * - `lg`: Projects · Learning · Jobs · Blog · Resume
 * - `xl`: + Practice
 * - `2xl`: + Home (the wordmark already links home) + Premium (also in the
 *   account menu, drawer and footer)
 * The active module is a raised card pill with an indigo label. Client-only so
 * the root layout stays static.
 */
const SHOW_FROM: Record<string, string> = {
  "/practice": "hidden xl:flex",
  "/": "hidden 2xl:flex",
  "/premium": "hidden 2xl:flex",
};

export function HeaderLinks() {
  const pathname = usePathname();
  const matches = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  // A more specific sibling wins, so a nested route doesn't also light its parent tab.
  const isActive = (href: string) =>
    matches(href) &&
    !HEADER_LINKS.some((o) => o.href !== href && o.href.startsWith(href + "/") && matches(o.href));

  return (
    <nav className="hidden items-center gap-0.5 rounded-full border border-line/70 bg-surface/70 p-1 lg:flex">
      {HEADER_LINKS.map((l) => {
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-8 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition lg:px-3.5",
              SHOW_FROM[l.href],
              active ? "bg-card text-primary shadow-card" : "text-ink-muted hover:bg-card/70 hover:text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default HeaderLinks;
