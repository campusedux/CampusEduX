import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, LayoutGrid, GraduationCap, Briefcase, FileText, Wrench } from "lucide-react";

interface ModuleTile {
  label: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  tint: string;
  bg: string;
}

/**
 * "Everything in one place" quick-access grid under the hero — mirrors the
 * mobile Home category tiles, but with a description + arrow per card. Curated
 * and static on purpose (the primary modules don't change per request); the
 * dynamic DB `categories` still get their own "Browse by category" section
 * further down the page.
 */
const MODULES: ModuleTile[] = [
  { label: "Projects", desc: "Explore and buy final year projects", href: "/projects", icon: LayoutGrid, tint: "#4F39F6", bg: "#EEF0FF" },
  { label: "Learning", desc: "Courses, tutorials and study material", href: "/learning", icon: GraduationCap, tint: "#16A34A", bg: "#DCFCE7" },
  { label: "Jobs", desc: "Find jobs & internships", href: "/jobs", icon: Briefcase, tint: "#3B82F6", bg: "#DBEAFE" },
  { label: "Resume", desc: "Build ATS-friendly resumes", href: "/resume", icon: FileText, tint: "#EA580C", bg: "#FFEDD5" },
  { label: "Custom Projects", desc: "Get your custom project built", href: "/custom-projects", icon: Wrench, tint: "#DB2777", bg: "#FCE7F3" },
];

export function ModuleGrid() {
  return (
    <section className="container-page pt-8" aria-label="Explore CampusEduX">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              href={m.href}
              className="group relative flex min-h-[128px] flex-col rounded-2xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-card active:scale-[.99] motion-reduce:transform-none"
              style={{
                borderColor: `${m.tint}1F`,
                background: `linear-gradient(150deg, ${m.bg} 0%, #ffffff 65%)`,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none"
                  style={{ backgroundColor: m.bg }}
                >
                  <Icon className="h-[22px] w-[22px]" style={{ color: m.tint }} aria-hidden />
                </span>
                <span className="text-[15px] font-bold leading-tight text-ink">{m.label}</span>
              </div>
              <p className="mt-2 pr-9 text-[13px] leading-snug text-ink-muted">{m.desc}</p>
              <span
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden
              >
                <ArrowRight className="h-4 w-4" style={{ color: m.tint }} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default ModuleGrid;
