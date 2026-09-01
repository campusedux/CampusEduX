"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HEADER_LINKS } from "./navConfig";
import { cn } from "@/lib/cn";

/**
 * Desktop primary navigation (`lg+`), horizontally centred in the header grid.
 * Each item fills the header height; the active module gets an indigo label and
 * a 2px underline flush with the header's bottom border. Client-only so the root
 * layout stays static.
 */
export function HeaderLinks() {
  const pathname = usePathname();
  const matches = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
  // A more specific sibling wins, so a nested route doesn't also light its parent tab.
  const isActive = (href: string) =>
    matches(href) && !HEADER_LINKS.some((o) => o.href !== href && o.href.startsWith(href + "/") && matches(o.href));

  return (
    <nav className="hidden h-16 items-center lg:flex">
      {HEADER_LINKS.map((l) => {
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex h-16 items-center whitespace-nowrap px-3 text-sm font-medium transition-colors",
              active ? "text-primary" : "text-ink-muted hover:text-ink",
            )}
          >
            {l.label}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-2.5 bottom-0 h-[2px] rounded-full bg-primary transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export default HeaderLinks;
