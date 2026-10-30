import type { LucideIcon } from "lucide-react";
import { BookOpen, Brain, Code2, Coffee, Database, Sparkles } from "lucide-react";
import type { LearningGridCard } from "@/lib/learning.types";
import { courseAccent, coverBackground, coverGlyph, isEmojiIcon, type CoverGlyph } from "@/lib/courseCover";
import { cn } from "@/lib/cn";

export type CourseCoverData = Pick<LearningGridCard, "slug" | "name" | "icon" | "cover_image_url" | "accent_color">;

const GLYPH: Record<CoverGlyph, LucideIcon> = {
  coffee: Coffee,
  database: Database,
  brain: Brain,
  sparkles: Sparkles,
  code: Code2,
  book: BookOpen,
};

const DOTS = {
  backgroundImage: "radial-gradient(rgb(255 255 255 / 0.28) 1px, transparent 1px)",
  backgroundSize: "14px 14px",
  maskImage: "linear-gradient(115deg, #000 5%, transparent 60%)",
  WebkitMaskImage: "linear-gradient(115deg, #000 5%, transparent 60%)",
} as const;

/**
 * Course cover art, filling its (relative, sized) parent. Uses the admin
 * `cover_image_url` when set; otherwise a generated cover — a mesh gradient in
 * the course accent, a dot + ring pattern, and the course icon as a large
 * off-centre watermark. Decorative (`aria-hidden`): the course name is always
 * rendered as text next to it. Server component, CSS only.
 *
 * `banner` = the course-page hero (bigger glyph, sits right of the text);
 * `card` = hub / Home course cards (glyph tilts on the parent `group` hover).
 */
export function CourseCover({
  course,
  variant = "card",
  className,
}: {
  course: CourseCoverData;
  variant?: "card" | "banner";
  className?: string;
}) {
  const accent = courseAccent(course.accent_color, course.slug);
  const banner = variant === "banner";

  if (course.cover_image_url) {
    return (
      <div aria-hidden className={cn("absolute inset-0 overflow-hidden", className)} style={{ background: coverBackground(accent) }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- admin-supplied Storage URL (any host) */}
        <img
          src={course.cover_image_url}
          alt=""
          loading={banner ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
        />
      </div>
    );
  }

  const Glyph = GLYPH[coverGlyph(course.name)];
  const emoji = isEmojiIcon(course.icon) ? course.icon : null;

  return (
    <div aria-hidden className={cn("absolute inset-0 overflow-hidden", className)} style={{ background: coverBackground(accent) }}>
      <span className="absolute inset-0" style={DOTS} />
      <svg
        className={cn("absolute text-white/15", banner ? "-right-24 -top-40 h-[34rem] w-[34rem]" : "-right-8 -top-14 h-44 w-44")}
        viewBox="0 0 200 200"
        fill="none"
        stroke="currentColor"
        strokeWidth={banner ? 0.6 : 1}
      >
        <circle cx="100" cy="100" r="38" />
        <circle cx="100" cy="100" r="62" />
        <circle cx="100" cy="100" r="86" />
      </svg>
      <svg
        className={cn("absolute bottom-0 left-0 text-white/10", banner ? "h-40 w-72" : "h-14 w-28")}
        viewBox="0 0 160 80"
        fill="none"
        stroke="currentColor"
        preserveAspectRatio="none"
      >
        {[0, 14, 28, 42, 56].map((o) => (
          <path key={o} d={`M${-20 + o} 80 L${40 + o} 0`} />
        ))}
      </svg>

      {/* Glyph watermark: off-centre, partly cropped, soft glow behind it. */}
      <span
        className={cn(
          "absolute flex items-center justify-center",
          banner
            ? "-bottom-10 right-[-2.5rem] h-56 w-56 opacity-40 sm:right-8 sm:opacity-60 lg:right-16 lg:h-64 lg:w-64 lg:opacity-90"
            : "-bottom-2 right-4 h-20 w-20",
        )}
      >
        <span className="absolute inset-4 rounded-full bg-white/20 blur-2xl" />
        <span
          className={cn(
            "relative flex rotate-[-10deg] items-center justify-center transition-transform duration-500 motion-reduce:transform-none",
            !banner && "group-hover:rotate-[-4deg] group-hover:scale-105",
          )}
        >
          {emoji ? (
            <span className={cn("leading-none drop-shadow-[0_8px_18px_rgb(0_0_0/0.35)]", banner ? "text-[9rem] lg:text-[10.5rem]" : "text-5xl")}>
              {emoji}
            </span>
          ) : (
            <Glyph
              className={cn("text-white/90 drop-shadow-[0_8px_18px_rgb(0_0_0/0.3)]", banner ? "h-40 w-40 lg:h-48 lg:w-48" : "h-16 w-16")}
              strokeWidth={1.25}
            />
          )}
        </span>
      </span>
    </div>
  );
}

export default CourseCover;
