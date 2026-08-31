'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ProjectTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const base = `/projects/${id}`;
  const tabs = [
    { href: base, label: 'Overview' },
    { href: `${base}/images`, label: 'Images' },
    { href: `${base}/video`, label: 'Video' },
    { href: `${base}/documentation`, label: 'Documentation' },
    { href: `${base}/source-code`, label: 'Source Code' },
    { href: `${base}/versions`, label: 'Versions' },
    { href: `${base}/reviews`, label: 'Reviews' },
    { href: `${base}/analytics`, label: 'Analytics' },
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
