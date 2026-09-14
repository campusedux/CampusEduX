import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { WhatsAppSupport } from "@/components/support/WhatsAppSupport";

/*
 * Site footer — renders on every route, so it is a Server Component with
 * **zero** client-side JavaScript:
 *  - no "use client"
 *  - social icons are inline SVG (no lucide-react / no icon-font request)
 *  - the link groups render twice from the same typed array: as plain columns
 *    from `sm` up (`hidden sm:block`), and as native <details>/<summary>
 *    accordions below `sm` (`sm:hidden`). A closed <details> hides its content
 *    on every viewport via built-in UA behaviour that a CSS `display` cannot
 *    override, so the desktop layout can't reuse the same <details> element —
 *    hence the two render paths. Only one is ever in the layout/a11y tree.
 *
 * Every link lives in the typed `NAV_GROUPS` / `SOCIALS` / `BOTTOM_LINKS`
 * arrays below and is mapped — there is no per-link JSX.
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

interface SocialLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

// Brand glyphs as inline SVG (24×24, `currentColor`) — no icon library, so
// this adds nothing to the client bundle or the request count.
const SOCIALS: readonly SocialLink[] = [
  {
    label: "Instagram",
    // TODO: replace with the real CampusEduX Instagram URL
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden focusable="false">
        <rect x="2" y="2" width="20" height="20" rx="5.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    // TODO: replace with the real CampusEduX LinkedIn URL
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden focusable="false">
        <path
          fill="currentColor"
          d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z"
        />
      </svg>
    ),
  },
  {
    label: "YouTube",
    // TODO: replace with the real CampusEduX YouTube URL
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden focusable="false">
        <path
          fill="currentColor"
          d="M23.5 6.5a3.02 3.02 0 0 0-2.12-2.14C19.5 3.85 12 3.85 12 3.85s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.5C0 8.39 0 12 0 12s0 3.61.5 5.5a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14c.5-1.89.5-5.5.5-5.5s0-3.61-.5-5.5zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"
        />
      </svg>
    ),
  },
  {
    label: "X",
    // TODO: replace with the real CampusEduX X (Twitter) URL
    href: "#",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden focusable="false">
        <path
          fill="currentColor"
          d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.59-6.64 7.59H.46l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z"
        />
      </svg>
    ),
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
 * The `<li>` list for one nav group — shared by the desktop columns and the
 * mobile accordions so each route is declared exactly once (in `NAV_GROUPS`).
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
      <div className="container-page py-12 sm:py-14">
        <div className="grid gap-x-8 gap-y-0 sm:grid-cols-3 sm:gap-y-10 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-x-12">
          {/* Brand — always visible, above the accordions on mobile. */}
          <div className="pb-8 sm:col-span-3 sm:pb-0 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">
                C
              </span>
              <span className="text-[15px] font-bold tracking-tight text-ink">
                Campus<span className="text-primary">EduX</span>
              </span>
            </div>

            <p className="mt-3.5 max-w-xs text-sm leading-relaxed text-ink-muted">
              {BRAND.tagline} — one student account for projects, jobs, placement prep and resumes, on the web and the
              CampusEduX app.
            </p>

            <a
              href={`mailto:${supportEmail}`}
              className="mt-4 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-primary"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden focusable="false">
                <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {supportEmail}
            </a>

            {/* WhatsApp Support — renders only while the channel is switched on
             *  (src/lib/whatsapp.ts). Server component, no client JS. */}
            <WhatsAppSupport variant="inline" className="mt-3 flex w-fit" />

            <div className="mt-5 flex items-center gap-1">
              {SOCIALS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white hover:text-primary"
                >
                  {icon}
                </a>
              ))}
            </div>

            {/*
             * Google Play badge. Rendered as an inline-SVG button so it costs
             * no extra request and stays on the design tokens (no black badge
             * chrome). To use Google's official artwork instead, drop the PNG
             * into /public and swap this <a> for a lazy `next/image` with
             * explicit width/height.
             * TODO: replace href with the real Play Store listing URL.
             */}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get the CampusEduX app on Google Play"
              className="mt-5 inline-flex w-fit items-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5 transition hover:border-primary/40 hover:shadow-card"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 flex-shrink-0 text-primary" aria-hidden focusable="false">
                <path
                  fill="currentColor"
                  d="M3 2.6v18.8a1 1 0 0 0 1.53.85l14.9-9.4a1 1 0 0 0 0-1.7L4.53 1.75A1 1 0 0 0 3 2.6Z"
                />
              </svg>
              <span className="text-left leading-tight">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Get it on</span>
                <span className="block text-[13px] font-bold text-ink">Google Play</span>
              </span>
            </a>
          </div>

          {/* Desktop (>= sm): one plain column per group. */}
          {NAV_GROUPS.map((group) => (
            <nav
              key={`col-${group.id}`}
              aria-labelledby={`footer-nav-${group.id}`}
              className="hidden sm:block"
            >
              <h2 id={`footer-nav-${group.id}`} className={headingCls}>
                {group.title}
              </h2>
              <div className="mt-4">
                <FooterLinkList links={group.links} />
              </div>
            </nav>
          ))}

          {/* Mobile (< sm): native <details> accordions — no JS, no state. */}
          <div className="sm:hidden">
            {NAV_GROUPS.map((group) => (
              <details
                key={`acc-${group.id}`}
                className="group border-b border-line last:border-b-0 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between py-4">
                  <h2 id={`footer-nav-m-${group.id}`} className={headingCls}>
                    {group.title}
                  </h2>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 flex-shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                    aria-hidden
                    focusable="false"
                  >
                    <path
                      d="m6 9 6 6 6-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <nav aria-labelledby={`footer-nav-m-${group.id}`} className="pb-4">
                  <FooterLinkList links={group.links} />
                </nav>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom bar. */}
        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
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
