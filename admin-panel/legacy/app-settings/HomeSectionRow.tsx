'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { reorderHomeSection, toggleHomeSection } from '@/app/settings/actions';

interface Section {
  section_key: string;
  title: string;
  sort_order: number;
  is_enabled: boolean;
}

export function HomeSectionRow({ section }: { section: Section }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const move = (delta: number) =>
    startTransition(async () => {
      await reorderHomeSection(section.section_key, section.sort_order + delta);
      router.refresh();
    });

  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{section.title}</p>
        <p className="text-xs text-ink-faint">{section.section_key}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => move(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-subtle disabled:opacity-30"
            aria-label="Move up"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => move(1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-subtle disabled:opacity-30"
            aria-label="Move down"
          >
            <ArrowDown size={13} />
          </button>
        </div>
        <label className="relative inline-flex h-6 w-11 cursor-pointer items-center">
          <input
            type="checkbox"
            checked={section.is_enabled}
            disabled={isPending}
            onChange={(e) =>
              startTransition(async () => {
                await toggleHomeSection(section.section_key, e.target.checked);
                router.refresh();
              })
            }
            className="peer sr-only"
          />
          <span className="absolute inset-0 rounded-full bg-border transition-colors peer-checked:bg-brand" />
          <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
        </label>
      </div>
    </li>
  );
}
