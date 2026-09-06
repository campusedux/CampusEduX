"use client";

import { useState } from "react";
import { List } from "lucide-react";
import { Drawer } from "@/components/ui";
import type { LearningTree } from "@/lib/learning";
import { LearningNav } from "./LearningNav";

/**
 * Documentation layout: a sticky left navigation rail on desktop, a slide-in
 * "Contents" drawer on mobile/tablet. `children` is the main content column.
 */
export function DocsShell({
  tree,
  gridSlug,
  children,
}: {
  tree: LearningTree;
  gridSlug: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="container-page py-8 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
      {/* desktop rail */}
      <aside className="hidden lg:block lg:border-r lg:border-line">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8 pr-6">
          <LearningNav tree={tree} gridSlug={gridSlug} />
        </div>
      </aside>

      {/* mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink lg:hidden"
      >
        <List className="h-4 w-4" aria-hidden />
        Contents
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} side="left" title={tree.grid.name}>
        <div className="px-1 py-2">
          <LearningNav tree={tree} gridSlug={gridSlug} onNavigate={() => setOpen(false)} />
        </div>
      </Drawer>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default DocsShell;
