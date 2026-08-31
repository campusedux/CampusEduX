import Link from "next/link";
import { BRAND } from "@/lib/brand";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/projects", label: "Projects" },
      { href: "/jobs", label: "Jobs" },
      { href: "/placement", label: "Placement Prep" },
      { href: "/resume", label: "Resume Builder" },
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
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/refund-policy", label: "Refund Policy" },
      { href: "/project-license", label: "Project License" },
      { href: "/community-guidelines", label: "Community Guidelines" },
      { href: "/disclaimer", label: "Disclaimer" },
      { href: "/delete-account", label: "Delete Account" },
    ],
  },
];

export default function Footer() {
  const entity = process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary text-sm font-black text-white">
                C
              </span>
              <span className="text-[15px] font-bold tracking-tight text-ink">
                Campus<span className="text-primary">EduX</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-ink-muted">{BRAND.tagline} — built for students, from sign-up to placement.</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-semibold text-ink">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-ink-muted hover:text-primary">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-line pt-6 text-xs text-ink-faint">
          {entity
            ? `© ${new Date().getFullYear()} ${entity}. All rights reserved.`
            : "Legal entity name not yet configured — set NEXT_PUBLIC_LEGAL_ENTITY_NAME."}
        </div>
      </div>
    </footer>
  );
}
