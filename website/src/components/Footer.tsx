import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { WhatsAppSupport } from "@/components/support/WhatsAppSupport";

/*
 * Site footer — renders on every route, so it is a Server Component with
 * **zero** client-side JavaScript beyond the (also zero-JS) `WhatsAppSupport`
 * link. No "use client".
 *
 * All link groups render fully expanded at every viewport — no
 * <details>/accordion, no hidden/collapsed links. Every route in
 * `NAV_GROUPS` / `BOTTOM_LINKS` is visible and tappable by default on mobile,
 * tablet and desktop alike.
 *
 * Every link lives in the typed `NAV_GROUPS` / `BOTTOM_LINKS` arrays below and
 * is mapped — there is no per-link JSX. There is deliberately no social-links
 * row or app-store badge here: CampusEduX has no live social accounts or
 * Play Store listing yet, and a footer full of dead `#` links is worse than
 * no row at all. Add one back (mirroring the `WhatsAppSupport` on/off +
 * `NEXT_PUBLIC_*` override pattern in `src/lib/whatsapp.ts`) once a real URL
 * exists.
 */

interface FooterLink {
  href: string;
  label: string;
  /** `true` → render with `next/link` prefetch off / plain anchor (non-page target). */
  external?: boolean;
}

interface FooterNavGroup {
  /** Slug used for the group's heading id + `aria-labelledby`. */
  id: string;
  title: string;
  links: readonly FooterLink[];
}

const NAV_GROUPS: readonly FooterNavGroup[] = [
  {
    id: "explore",
    title: "Explore",
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/jobs", label: "Jobs" },
      { href: "/learning", label: "Learning" },
      { href: "/compiler", label: "Compiler" },
      { href: "/resume", label: "Resume" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    id: "company",
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
      { href: "/support", label: "Support" },
      { href: "/referral", label: "Referral & Earn" },
      { href: "/premium", label: "Premium" },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    // Only the four most-requested policies live on the footer; the rest
    // (Cookie Policy, Data & Permissions, Project License, Community
    // Guidelines, Disclaimer, Grievance Redressal) stay reachable from the
    // "All policies" index at /legal.
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/refund-policy", label: "Refund Policy" },
      { href: "/delete-account", label: "Delete Account" },
      { href: "/legal", label: "All policies →" },
    ],
  },
];

const BOTTOM_LINKS: readonly FooterLink[] = [
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/sitemap.xml", label: "Sitemap", external: true },
];

const linkCls = "text-sm text-ink-muted transition-colors hover:text-primary";
const headingCls = "text-[13px] font-semibold uppercase tracking-wide text-ink";

/**
 * The `<li>` list for one nav group — reused for every group so each route
 * is declared exactly once (in `NAV_GROUPS`).
 */
function FooterLinkList({ links }: { links: readonly FooterLink[] }) {
  return (
    <ul className="space-y-2.5">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className={linkCls}>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  const entity = process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() || BRAND.name;
  // `BRAND.supportEmail` can be an empty string when the env var is set-but-blank
  // (`"" ?? x` keeps `""`); fall back to the canonical address brand.ts declares.
  const supportEmail = BRAND.supportEmail || "support@campusedux.app";

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page py-10 sm:py-12">
        <div className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-3 sm:gap-y-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-x-10">
          {/* Brand — always visible above the link groups. */}
          <div className="pb-8 sm:col-span-3 sm:pb-0 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-base font-black text-white shadow-[0_4px_12px_-3px_rgba(79,57,246,0.5)]">
                C
              </span>
              <span className="text-base font-bold tracking-tight text-ink">
                Campus<span className="text-primary">EduX</span>
              </span>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              {BRAND.tagline} — one student account for projects, jobs, placement prep and resumes, on the web and the
              CampusEduX app.
            </p>

            <div className="mt-5 flex flex-col items-start gap-3">
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 flex-shrink-0 text-ink-faint"
                  aria-hidden
                  focusable="false"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {supportEmail}
              </a>

              {/* WhatsApp Support CTA — renders only while the channel is
               *  switched on (src/lib/whatsapp.ts). Server component, no client JS. */}
              <WhatsAppSupport variant="button" label="Chat on WhatsApp" className="w-fit" />
            </div>
          </div>

          {/* One plain, always-expanded column per group — same markup at
           *  every viewport. A top border separates stacked sections on
           *  mobile only; from `sm` up the grid's own column gap does that
           *  job, so the border/padding are removed. */}
          {NAV_GROUPS.map((group) => (
            <nav
              key={group.id}
              aria-labelledby={`footer-nav-${group.id}`}
              className="border-t border-line pt-6 sm:border-0 sm:pt-0"
            >
              <h2 id={`footer-nav-${group.id}`} className={headingCls}>
                {group.title}
              </h2>
              <div className="mt-4">
                <FooterLinkList links={group.links} />
              </div>
            </nav>
          ))}
        </div>

        {/* Bottom bar. */}
        <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-muted">
            © {year} {entity}. All rights reserved.
          </p>
          <nav aria-label="Legal and site map" className="flex items-center gap-3 text-xs text-ink-muted">
            {BOTTOM_LINKS.map((l, i) => (
              <span key={l.href} className="flex items-center gap-3">
                {i > 0 && (
                  <span aria-hidden className="text-ink-faint">
                    ·
                  </span>
                )}
                {l.external ? (
                  <a href={l.href} className="transition-colors hover:text-primary">
                    {l.label}
                  </a>
                ) : (
                  <Link href={l.href} className="transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
