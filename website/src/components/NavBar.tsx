import Link from "next/link";
import AuthNavLink from "./AuthNavLink";
import { BRAND } from "@/lib/brand";

const LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/jobs", label: "Jobs" },
  { href: "/placement", label: "Placement" },
  { href: "/resume", label: "Resume" },
  { href: "/custom-projects", label: "Custom Projects" },
  { href: "/premium", label: "Premium" },
  { href: "/about", label: "About" },
];

/**
 * P1: brand + palette only. A full responsive nav (desktop header + mobile
 * drawer + bottom navigation mirroring the app) lands in P3.
 */
export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-primary text-base font-black text-white">
            C
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink">
            Campus<span className="text-primary">EduX</span>
          </span>
        </Link>
        <div className="hidden gap-6 text-sm md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-medium text-ink-muted hover:text-primary">
              {l.label}
            </Link>
          ))}
        </div>
        <AuthNavLink />
      </div>
    </nav>
  );
}
