import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { HEADER_LINKS } from "./navConfig";
import { MobileNav } from "./MobileNav";
import { AuthMenu } from "./AuthMenu";

/**
 * Site header. Desktop: wordmark + primary module links + auth menu.
 * Mobile (`md:` down): wordmark + hamburger (opens the drawer) + auth menu.
 * A separate fixed bottom tab bar (`<BottomNav>`) handles primary mobile
 * navigation, mirroring the app.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <MobileNav />

        <Link href="/" className="flex items-center gap-2.5" aria-label={`${BRAND.name} home`}>
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-primary text-base font-black text-white">
            C
          </span>
          <span className="text-[15px] font-bold tracking-tight text-ink">
            Campus<span className="text-primary">EduX</span>
          </span>
        </Link>

        <nav className="ml-4 hidden flex-1 items-center gap-6 text-sm md:flex">
          {HEADER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-medium text-ink-muted hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto md:ml-0">
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}

export default Header;
