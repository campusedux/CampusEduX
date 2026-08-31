'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function StudentTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/students/${id}`;
  const tabs = [
    { href: base, label: 'Overview' },
    { href: `${base}/purchases`, label: 'Purchases' },
    { href: `${base}/downloads`, label: 'Downloads' },
    { href: `${base}/wallet`, label: 'Wallet' },
    { href: `${base}/progress`, label: 'Progress' },
    { href: `${base}/reports`, label: 'Reports' },
    { href: `${base}/block`, label: 'Block / Unblock' },
  ];

  return (
    <div className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((t) => {
        const active = t.href === base ? pathname === base : pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              '-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-brand text-brand'
                : 'border-transparent text-ink-muted hover:border-border hover:text-ink',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
