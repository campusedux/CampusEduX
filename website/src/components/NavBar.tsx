import Link from "next/link";
import AuthNavLink from "./AuthNavLink";

const LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/jobs", label: "Jobs" },
  { href: "/placement", label: "Placement" },
  { href: "/resume", label: "Resume" },
  { href: "/custom-projects", label: "Custom Projects" },
  { href: "/premium", label: "Premium" },
  { href: "/about", label: "About" },
];

export default function NavBar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-navy/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-serif text-lg font-medium text-navy">
          ProjectHub <span className="align-middle text-[0.6rem] font-sans font-medium text-slate">BY CAMPUSEDUX</span>
        </Link>
        <div className="hidden gap-6 text-sm md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-navy hover:text-marigold">
              {l.label}
            </Link>
          ))}
        </div>
        <AuthNavLink />
      </div>
    </nav>
  );
}
