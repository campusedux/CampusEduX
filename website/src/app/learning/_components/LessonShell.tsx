"use client";

import { useState } from "react";
import { List } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import type { CourseOutline } from "@/lib/courseOutline";
import { LessonSidebar } from "./LessonSidebar";

/**
 * Focused lesson layout: sticky course sidebar (lg+) · reading column ·
 * optional right rail (table of contents, xl+). Below lg the sidebar lives in
 * a "Contents" drawer, rendered only while open so the big lesson list isn't
 * in the DOM twice.
 */
export function LessonShell({
  outline,
  currentSlug,
  rail,
  children,
}: {
  outline: CourseOutline;
  currentSlug: string;
  rail?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="container-page pb-16 pt-6 lg:grid lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[272px_minmax(0,1fr)_220px]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain pb-8 pr-2 [scrollbar-width:thin]">
          <LessonSidebar outline={outline} currentSlug={currentSlug} />
        </div>
      </aside>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-5 inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-card px-3.5 text-sm font-semibold text-ink shadow-card lg:hidden"
      >
        <List className="h-4 w-4" aria-hidden />
        Course contents
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} side="left" title="Course contents">
        {open && (
          <div className="px-2 py-3">
            <LessonSidebar outline={outline} currentSlug={currentSlug} onNavigate={() => setOpen(false)} />
          </div>
        )}
      </Drawer>

      <div className="min-w-0">{children}</div>

      {rail ? (
        <aside className="hidden xl:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-8">{rail}</div>
        </aside>
      ) : null}
    </div>
  );
}

export default LessonShell;
