"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface FooterColumn {
  title: string;
  links: { href: string; label: string }[];
}

/**
 * Footer link columns.
 * - `sm+`: a plain `<h3>` + always-visible list, laid out by the footer grid.
 * - `< sm`: each column collapses into a tap-to-expand accordion so a long
 *   footer stays scannable on a phone.
 *
 * The `aria-expanded` toggle only exists in the mobile control (`sm:hidden`);
 * the desktop heading is a real heading. Purely presentational — every link is
 * a normal `next/link` to an existing route.
 */
export function FooterColumns({ columns }: { columns: FooterColumn[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <>
      {columns.map((col) => {
        const isOpen = open === col.title;
        return (
          <div key={col.title} className="border-b border-line sm:border-0">
            <h3 className="hidden text-[13px] font-semibold uppercase tracking-wide text-ink sm:block">
              {col.title}
            </h3>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : col.title)}
              className="flex w-full items-center justify-between py-3.5 text-left text-[13px] font-semibold uppercase tracking-wide text-ink sm:hidden"
            >
              {col.title}
              <ChevronDown
                aria-hidden
                className={cn(
                  "h-4 w-4 text-ink-faint transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>
            <ul
              className={cn(
                "space-y-2.5 pb-4 sm:!block sm:pb-0 sm:pt-4",
                isOpen ? "block" : "hidden",
              )}
            >
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-ink-muted transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

export default FooterColumns;
