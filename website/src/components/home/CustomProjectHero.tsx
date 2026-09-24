import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Globe,
  Smartphone,
  AppWindow,
  GraduationCap,
  Code2,
  Lightbulb,
  Users,
  PackageCheck,
  ShieldCheck,
  LifeBuoy,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

type Accent = "indigo" | "sky" | "emerald" | "amber" | "pink" | "teal";

/** Literal class strings so Tailwind's JIT keeps them (mirrors ModuleGrid). */
const ACCENT: Record<Accent, { tile: string; fg: string }> = {
  indigo: { tile: "bg-primary-50", fg: "text-primary" },
  sky: { tile: "bg-accent-sky/10", fg: "text-accent-sky" },
  emerald: { tile: "bg-accent-emerald/10", fg: "text-accent-emerald" },
  amber: { tile: "bg-accent-amber/10", fg: "text-accent-amber" },
  pink: { tile: "bg-accent-pink/10", fg: "text-accent-pink" },
  teal: { tile: "bg-accent-teal/10", fg: "text-accent-teal" },
};

interface FeatureCard {
  title: string;
  desc: string;
  icon: LucideIcon;
  accent: Accent;
}

const FEATURES: FeatureCard[] = [
  { title: "Website Development", desc: "Business, portfolio, e-commerce & more", icon: Globe, accent: "indigo" },
  { title: "Mobile App Development", desc: "Android & iOS apps", icon: Smartphone, accent: "sky" },
  { title: "Web Application", desc: "Custom web apps & platforms", icon: AppWindow, accent: "emerald" },
  { title: "Final Year Projects", desc: "Academic & research projects", icon: GraduationCap, accent: "amber" },
  { title: "Custom Software", desc: "Any kind of software solution", icon: Code2, accent: "pink" },
  { title: "Unique Idea?", desc: "We'll help you plan and build it", icon: Lightbulb, accent: "teal" },
];

const TRUST_POINTS = ["Student Friendly", "Affordable Pricing", "On-Time Delivery", "Complete Support"];

interface TrustStat {
  title: string;
  desc: string;
  icon: LucideIcon;
}

const TRUST_STRIP: TrustStat[] = [
  { title: "Built for Students", desc: "By people who get college deadlines", icon: Users },
  { title: "Source Code Included", desc: "Yours to keep and explain", icon: PackageCheck },
  { title: "High Quality", desc: "Clean & well documented", icon: ShieldCheck },
  { title: "Ongoing Support", desc: "Even after delivery", icon: LifeBuoy },
];

/**
 * "Custom Project Development" homepage promo — real HTML/CSS, not a single
 * baked-in banner image. `/projects` keeps the original image banner
 * (`CustomProjectBanner`); this is a homepage-only redesign.
 */
export function CustomProjectHero() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-primary-50 via-card to-primary-50/40 shadow-card">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 hidden h-80 w-80 text-primary opacity-[0.10] lg:block"
        style={{
          backgroundImage: "radial-gradient(currentColor 1.6px, transparent 1.6px)",
          backgroundSize: "18px 18px",
          WebkitMaskImage: "radial-gradient(circle at center, #000, transparent 72%)",
          maskImage: "radial-gradient(circle at center, #000, transparent 72%)",
        }}
      />

      <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:p-14">
        <div className="flex flex-col justify-center">
          <span className="eyebrow inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Custom Project Development
          </span>

          <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
            Have a Project Idea?
            <span className="block text-primary">We&apos;ll Build It for You.</span>
          </h2>

          <p className="lede mt-4 max-w-lg">
            Share your idea for a website, mobile app, or software project. Our team will turn your idea into a
            complete, working solution.
          </p>

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5">
            {TRUST_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-1.5 text-sm font-medium text-ink-muted">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/custom-projects/start" rightIcon={ArrowRight} size="lg">
              Start Your Project
            </Button>
            <Button href="/custom-projects" variant="ghost" size="lg">
              Get a Free Consultation
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            const a = ACCENT[f.accent];
            return (
              <div key={f.title} className="card card-hover p-4">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", a.tile)}>
                  <Icon className={cn("h-5 w-5", a.fg)} aria-hidden />
                </span>
                <p className="mt-3 text-[14px] font-bold leading-tight text-ink">{f.title}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-ink-muted">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-4 border-t border-line/70 bg-card/70 px-6 py-6 sm:grid-cols-4 sm:px-10 lg:px-14">
        {TRUST_STRIP.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.title} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden />
              <div>
                <p className="text-[13px] font-bold leading-tight text-ink">{t.title}</p>
                <p className="text-[12px] leading-snug text-ink-muted">{t.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CustomProjectHero;
