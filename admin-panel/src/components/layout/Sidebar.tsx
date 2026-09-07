'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GraduationCap,
  FolderKanban,
  Hammer,
  Briefcase,
  BookOpen,
  Newspaper,
  FileText,
  ShoppingCart,
  Gift,
  Image as ImageIcon,
  Star,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import type { ModuleKey, PermissionMatrix } from '@/lib/permissions';
import { signOutAction } from '@/actions/auth';

const NAV: { href: string; label: string; module: ModuleKey; icon: typeof LayoutDashboard }[] = [
  { href: '/', label: 'Dashboard', module: 'dashboard', icon: LayoutDashboard },
  { href: '/students', label: 'Students', module: 'students', icon: GraduationCap },
  { href: '/projects', label: 'Projects', module: 'projects', icon: FolderKanban },
  { href: '/custom-projects', label: 'Custom Projects', module: 'custom_projects', icon: Hammer },
  { href: '/jobs', label: 'Jobs', module: 'jobs', icon: Briefcase },
  { href: '/learning', label: 'Learning', module: 'learning', icon: BookOpen },
  { href: '/blog', label: 'Blog', module: 'blog', icon: Newspaper },
  { href: '/resume', label: 'Resume Builder', module: 'resume', icon: FileText },
  { href: '/orders', label: 'Orders & Payments', module: 'orders', icon: ShoppingCart },
  { href: '/referrals', label: 'Referral & Wallet', module: 'referrals', icon: Gift },
  { href: '/cms', label: 'Banner & CMS', module: 'cms', icon: ImageIcon },
  { href: '/reviews', label: 'Reviews & Ratings', module: 'reviews', icon: Star },
  { href: '/reports', label: 'Reports', module: 'reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', module: 'settings', icon: Settings },
];

export function Sidebar({ perms }: { perms: PermissionMatrix }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => perms[n.module]?.view);

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col bg-sidebar text-white">
      <div className="flex h-16 items-center border-b border-white/5 px-5">
        <Logo onDark />
      </div>

      <nav className="scroll-slim flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-sidebar-active text-white shadow-sm' : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-white',
              )}
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-danger/90 transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut size={17} strokeWidth={2} />
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
