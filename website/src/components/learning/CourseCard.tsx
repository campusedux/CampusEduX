import Link from "next/link";
import { ArrowRight, BookOpen, Layers, Sparkles } from "lucide-react";
import type { LearningGridCard } from "@/lib/learning.types";
import { Badge } from "@/components/ui/Badge";
import { CourseCardProgress } from "./CourseCardProgress";
import { CourseCover } from "./CourseCover";

export type CourseCardData = Pick<
  LearningGridCard,
  "id" | "slug" | "name" | "description" | "icon" | "cover_image_url" | "accent_color" | "is_featured" | "is_premium" | "section_count" | "topic_count"
>;


/**
 * Course (Learning grid) card: cover art, title, Featured / Free / Premium
 * badges, sections · lessons, a two-line outcome (the description), and a
 * progress row (device-only progress; "Not started" until the visitor starts).
 * Server component; the progress row is a tiny client island.
 */
export function CourseCard({
  course,
  compactOnMobile = false,
  className,
}: {
  course: CourseCardData;
  /** Below `sm`: drop the cover art for a compact row (Learning hub lists). */
  compactOnMobile?: boolean;
  className?: string;
}) {
  const icon = <BookOpen className="h-5 w-5" aria-hidden />;
  return (
    <Link
      href={`/learning/${course.slug}`}
      className={`course-card ${compactOnMobile ? "course-card-compact" : ""} card card-hover group flex min-w-0 flex-col overflow-hidden [overflow-wrap:anywhere] ${className ?? ""}`}
    >
      <div className={`course-card-cover relative h-28 overflow-hidden md:h-32 ${compactOnMobile ? "hidden sm:block" : ""}`}>
        <CourseCover course={course} className="course-cover-art" />
        {/* Solid card-coloured underlay so the tinted badges stay legible on any cover image. */}
        <span className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
          {course.is_featured && (
            <span className="inline-flex rounded-full bg-card shadow-card">
              <Badge tone="neutral" className="border-0">
                <Sparkles className="h-3 w-3" aria-hidden />
                Featured
              </Badge>
            </span>
          )}
          <span className="inline-flex rounded-full bg-card shadow-card">
            {course.is_premium ? <Badge variant="pro">Premium</Badge> : <Badge variant="free">Free</Badge>}
          </span>
        </span>
      </div>

      <div className="course-card-body flex min-w-0 flex-1 flex-col p-4">
        {compactOnMobile && (
          <div className="course-card-badges mb-2.5 flex items-center gap-2 sm:hidden">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-lg text-accent-teal"
            >
              {icon}
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              {course.is_featured && <Badge tone="neutral" className="border-0">Featured</Badge>}
              {course.is_premium ? <Badge variant="pro">Premium</Badge> : <Badge variant="free">Free</Badge>}
            </div>
          </div>
        )}
        <h3 className="line-clamp-2 min-h-10 font-display text-base font-semibold leading-5 tracking-tight text-ink group-hover:text-primary">
          {course.name}
        </h3>
        {/* Always two lines tall, so every card in a row lines up exactly. */}
        <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-ink-muted">{course.description}</p>
        <div className="mt-auto min-w-0 pt-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-ink-faint">
            {course.section_count > 0 && (
              <span className="inline-flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" aria-hidden />
                {course.section_count} section{course.section_count === 1 ? "" : "s"}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              {course.topic_count} lesson{course.topic_count === 1 ? "" : "s"}
            </span>
            <ArrowRight
              className="ml-auto h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
              aria-hidden
            />
          </div>
          <CourseCardProgress gridSlug={course.slug} totalLessons={course.topic_count} />
        </div>
      </div>
    </Link>
  );
}

export default CourseCard;
