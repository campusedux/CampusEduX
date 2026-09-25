import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, AppWindow, CheckCircle2, Code2, Globe, GraduationCap, Lightbulb, Smartphone, Wrench } from "lucide-react";

interface ProjectType {
  title: string;
  icon: LucideIcon;
}

const PROJECT_TYPES: ProjectType[] = [
  { title: "Websites", icon: Globe },
  { title: "Mobile apps", icon: Smartphone },
  { title: "Web applications", icon: AppWindow },
  { title: "Final-year projects", icon: GraduationCap },
  { title: "Custom software", icon: Code2 },
  { title: "Your own idea", icon: Lightbulb },
];

const TRUST_POINTS = ["Student friendly", "Affordable pricing", "Source code included", "Support after delivery"];

/**
 * "Custom Project Development" home banner — sits directly under the hero.
 * Real HTML/CSS (no baked image). `/projects` keeps its own image banner
 * (`components/CustomProjectBanner`). Same destinations as before:
 * /custom-projects/start and /custom-projects.
 */
export function CustomProjectPromo() {
  return (
    <section className="container-page pt-8 sm:pt-10" aria-labelledby="custom-project-promo-title">
      <div className="relative overflow-hidden rounded-3xl bg-[#0F0B2E] text-white shadow-card-lg">
        {/* Colour washes — fixed dark panel in both themes (a deliberate accent block). */}
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-primary/50 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 right-0 h-72 w-80 rounded-full bg-accent-pink/30 blur-3xl" />

        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12 lg:p-12">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-inset ring-white/15">
              <Wrench className="h-3.5 w-3.5" aria-hidden />
              Custom Project Development
            </span>
            <h2 id="custom-project-promo-title" className="mt-4 font-display text-[1.75rem] font-bold leading-tight tracking-tight sm:text-4xl">
              Have a project idea? <span className="text-[#B7ADFF]">We&apos;ll build it for you.</span>
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/75">
              Share your idea for a website, mobile app or software project — our team turns it into a complete,
              working solution.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {TRUST_POINTS.map((p) => (
                <li key={p} className="flex items-center gap-1.5 text-sm text-white/80">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#9EF0C4]" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/custom-projects/start"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 text-[0.95rem] font-semibold text-[#2A1FA8] shadow-card transition hover:-translate-y-px motion-reduce:transform-none"
              >
                Start your project <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/custom-projects"
                className="inline-flex h-12 items-center rounded-xl border border-white/25 bg-white/5 px-6 text-[0.95rem] font-semibold text-white transition hover:bg-white/10"
              >
                Get a free consultation
              </Link>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
            {PROJECT_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <li
                  key={t.title}
                  className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3 text-sm font-semibold text-white/90 backdrop-blur"
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-4 w-4 text-[#C9C2FF]" aria-hidden />
                  </span>
                  {t.title}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default CustomProjectPromo;
