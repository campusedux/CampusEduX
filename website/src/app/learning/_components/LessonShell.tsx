"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, List } from "lucide-react";
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
    <div className="lesson-reading container-page pb-16 pt-3 sm:pt-6 lg:grid lg:grid-cols-[272px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[272px_minmax(0,1fr)_220px]">
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain pb-8 pr-2 [scrollbar-width:thin]">
          <LessonSidebar outline={outline} currentSlug={currentSlug} />
        </div>
      </aside>

      <div className="mb-4 flex min-w-0 items-center justify-between gap-3 border-b border-line pb-3 lg:hidden">
        <Link href={`/learning/${outline.gridSlug}`} className="inline-flex min-h-11 min-w-0 items-center gap-2 rounded-lg text-sm font-medium text-ink-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="sr-only">Back to course: </span>
          <span className="truncate">{outline.gridName}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Course contents"
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-line bg-card px-3 text-sm font-semibold text-ink"
        >
          <List className="h-4 w-4" aria-hidden />
          Contents
        </button>
      </div>
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
