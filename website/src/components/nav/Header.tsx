import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { MobileNav } from "./MobileNav";
import { HeaderLinks } from "./HeaderLinks";
import { GlobalSearchField, GlobalSearchTrigger } from "@/components/search/GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { AuthMenu } from "./AuthMenu";

/**
 * Site header — a three-zone grid that adapts by breakpoint.
 * - `lg+`: wordmark (left) · full centred module nav with an active underline
 *   (centre) · search field + notifications + auth avatar (right).
 * - `md`–`lg`: wordmark · condensed centred nav strip · search icon +
 *   notifications + auth + hamburger drawer (for the long tail + account).
 * - `< md`: wordmark · search icon + notifications + auth + hamburger; a fixed
 *   bottom tab bar (`<BottomNav>`) covers primary navigation on phones.
 */
export function Header(){
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="container-page grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
        {/* Left — brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-90"
          aria-label={`${BRAND.name} home`}
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-base font-black text-white shadow-[0_4px_12px_-3px_rgba(79,57,246,0.5)]">
            C
          </span>
          <span className="hidden text-[15px] font-bold tracking-tight text-ink min-[360px]:inline">
            Campus<span className="text-primary">EduX</span>
          </span>
        </Link>

        {/* Centre — primary nav (md+) */}
        <div className="flex min-w-0 justify-center">
          <HeaderLinks />
        </div>

        {/* Right — actions */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <div className="hidden lg:block">
            <GlobalSearchField variant="header" />
          </div>
          <GlobalSearchTrigger />
          <NotificationBell />
          <AuthMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
export default Header;