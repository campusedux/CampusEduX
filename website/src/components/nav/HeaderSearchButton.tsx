import Link from "next/link";
import { Search } from "lucide-react";

/**
 * Icon-only search affordance for `< lg` (tablet + mobile). Navigates to the
 * projects search page — the same destination as the expanded desktop field, so
 * no new behaviour is introduced.
 */
export function HeaderSearchButton() {
  return (
    <Link
      href="/projects"
      aria-label="Search projects"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink transition hover:bg-surface lg:hidden"
    >
      <Search className="h-5 w-5" aria-hidden />
    </Link>
  );
}

export default HeaderSearchButton;
