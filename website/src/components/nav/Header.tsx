import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileNav } from "./MobileNav";
import { HeaderLinks } from "./HeaderLinks";
import { GlobalSearchField, GlobalSearchTrigger } from "@/components/search/GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { AuthMenu } from "./AuthMenu";
import { BrandMark } from "./BrandMark";

/**
 * Site header — a frosted, sticky three-zone flex row (brand · nav · actions);
 * the nav takes the leftover width, so it can never overlap the wordmark.
 * - `xl+`: wordmark · pill nav · search field + theme + notifications + auth.
 * - `lg`: same, with the search icon (overlay) instead of the inline field.
 * - `md`–`lg`: wordmark · search icon + theme + notifications + auth +
 *   hamburger drawer (every destination + account).
 * - `< md`: wordmark · search icon + notifications + auth + hamburger; a fixed
 *   bottom tab bar (`<BottomNav>`) covers primary navigation on phones, and the
 *   theme control lives in the drawer.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70">
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/" className="shrink-0 rounded-xl transition-opacity hover:opacity-90" aria-label={`${BRAND.name} home`}>
          <BrandMark compactBelow360 />
        </Link>

        <div className="flex min-w-0 flex-1 justify-center">
          <HeaderLinks />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <div className="hidden xl:block">
            <GlobalSearchField variant="header" />
          </div>
          <GlobalSearchTrigger />
          <ThemeToggle className="hidden md:inline-flex" />
          <NotificationBell />
          <AuthMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
export default Header;
