import { Instagram, Linkedin, Youtube, Twitter, Mail } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { FooterColumns, type FooterColumn } from "./FooterColumns";

/** Link columns — every href is an existing route. */
const COLUMNS: FooterColumn[] = [
  {
    title: "Explore",
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/jobs", label: "Jobs" },
      { href: "/learning", label: "Learning" },
      { href: "/resume", label: "Resume" },
      { href: "/custom-projects", label: "Custom Projects" },
      { href: "/premium", label: "Premium" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "FAQ" },
      { href: "/support", label: "Support" },
      { href: "/referral", label: "Referral & Earn" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/refund-policy", label: "Refund Policy" },
      { href: "/cookie-policy", label: "Cookie Policy" },
      { href: "/data-and-permissions", label: "Data & Permissions" },
      { href: "/project-license", label: "Project License" },
      { href: "/community-guidelines", label: "Community Guidelines" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/grievance", label: "Grievance Redressal" },
      { href: "/delete-account", label: "Delete Account" },
      { href: "/legal", label: "All policies" },
    ],
  },
];

/** A social icon renders only when its URL is configured (see `.env.example`). */
const SOCIALS = [
  { href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM, label: "Instagram", Icon: Instagram },
  { href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN, label: "LinkedIn", Icon: Linkedin },
  { href: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE, label: "YouTube", Icon: Youtube },
  { href: process.env.NEXT_PUBLIC_SOCIAL_X, label: "X", Icon: Twitter },
].filter((s): s is { href: string; label: string; Icon: typeof Instagram } => Boolean(s.href));

export default function Footer() {
  const entity = process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME?.trim() || BRAND.name;
  const playStoreUrl = process.env.NEXT_PUBLIC_PLAY_STORE_URL;
  // `BRAND.supportEmail` can be an empty string when the env var is set-but-blank
  // (`"" ?? x` keeps `""`); fall back to the canonical address brand.ts declares.
  const supportEmail = BRAND.supportEmail || "support@campusedux.app";

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page py-12 sm:py-14">
        <div className="grid gap-x-8 gap-y-2 sm:grid-cols-3 sm:gap-y-10 lg:grid-cols-[1.7fr_repeat(3,1fr)] lg:gap-x-12">
          {/* Brand */}
          <div className="pb-4 sm:col-span-3 sm:pb-0 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-sm font-black text-white">
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
              <Mail className="h-4 w-4 flex-shrink-0 text-ink-faint" aria-hidden />
              {supportEmail}
            </a>
            {playStoreUrl && (
              <a
                href={playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-fit items-center gap-3 rounded-xl border border-line bg-white px-4 py-2.5 transition hover:border-primary/40 hover:shadow-card active:scale-[.98] motion-reduce:active:scale-100"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 flex-shrink-0" aria-hidden>
                  <path
                    d="M3 2.6v18.8a1 1 0 0 0 1.53.85l14.9-9.4a1 1 0 0 0 0-1.7L4.53 1.75A1 1 0 0 0 3 2.6Z"
                    fill="#4F39F6"
                  />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-ink-faint">Get it on</span>
                  <span className="block text-[13px] font-bold text-ink">Google Play</span>
                </span>
              </a>
            )}
          </div>

          <FooterColumns columns={COLUMNS} />
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} {entity}. All rights reserved.
          </p>
          {SOCIALS.length > 0 && (
            <div className="-mx-2 flex items-center gap-1 sm:mx-0">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-white hover:text-primary"
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
