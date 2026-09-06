"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { LearningTree } from "@/lib/learning";

/**
 * Documentation side-navigation — sections and their topics, in the database
 * `sort_order`. Rendered both in the sticky desktop rail and inside the mobile
 * "Contents" drawer.
 */
export function LearningNav({
  tree,
  gridSlug,
  onNavigate,
}: {
  tree: LearningTree;
  gridSlug: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Learning contents" className="space-y-5 text-sm">
      <Link
        href={`/learning/${gridSlug}`}
        onClick={onNavigate}
        className={cn(
          "block rounded-lg px-2.5 py-1.5 font-semibold",
          pathname === `/learning/${gridSlug}` ? "bg-primary-50 text-primary" : "text-ink hover:bg-surface",
        )}
      >
        {tree.grid.name}
      </Link>

      {tree.sections.map((section) => (
        <div key={section.id}>
          <p className="px-2.5 pb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{section.name}</p>
          <ul className="space-y-0.5 border-l border-line">
            {section.topics.map((topic) => {
              const href = `/learning/${gridSlug}/${topic.slug}`;
              const active = pathname === href;
              return (
                <li key={topic.id}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "-ml-px flex items-center gap-1.5 rounded-r-md border-l-2 px-3 py-1.5 leading-snug transition-colors",
                      active
                        ? "border-primary bg-primary-50/70 font-semibold text-primary"
                        : "border-transparent text-ink-muted hover:border-line hover:bg-surface hover:text-ink",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{topic.title}</span>
                    {topic.is_premium ? <Lock className="h-3 w-3 flex-shrink-0 text-amber-500" aria-label="Premium" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default LearningNav;
