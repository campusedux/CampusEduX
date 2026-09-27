'use client';

import { useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useSiteNotice } from '@/components/learning/useSiteNotice';
import { cn } from '@/lib/utils';

export type ActionResult = { ok: boolean; error?: string; warning?: string; retryTags?: string[] };

/** Toast + refresh when a `useFormState` result changes. */
export function useActionToast(state: ActionResult, onOk?: () => void) {
  const { toast } = useToast();
  const router = useRouter();
  const notify = useSiteNotice();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      if (!notify(state)) toast({ title: 'Saved', variant: 'success' });
      onOk?.();
      router.refresh();
    }
  }, [state, toast, router, onOk, notify]);
}

/** Up / down arrows bound to a reorder Server Action. */
export function ReorderButtons({
  onMove,
  disabled,
}: {
  onMove: (dir: 'up' | 'down') => Promise<ActionResult>;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const notify = useSiteNotice();

  const move = (dir: 'up' | 'down') =>
    start(async () => {
      const res = await onMove(dir);
      if (!res?.ok) toast({ title: 'Reorder failed', description: res?.error, variant: 'error' });
      else {
        notify(res);
        router.refresh();
      }
    });

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-label="Move up"
        disabled={disabled || pending}
        onClick={() => move('up')}
        className="rounded p-0.5 text-ink-faint hover:bg-surface-subtle hover:text-ink disabled:opacity-40"
      >
        <ArrowUp size={14} />
      </button>
      <button
        type="button"
        aria-label="Move down"
        disabled={disabled || pending}
        onClick={() => move('down')}
        className="rounded p-0.5 text-ink-faint hover:bg-surface-subtle hover:text-ink disabled:opacity-40"
      >
        <ArrowDown size={14} />
      </button>
    </div>
  );
}

/** 3-state publication select bound to a Server Action. */
export function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => Promise<ActionResult>;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  const notify = useSiteNotice();
  return (
    <select
      value={value}
      disabled={disabled || pending}
      onChange={(e) => {
        const next = e.target.value;
        start(async () => {
          const res = await onChange(next);
          if (!res?.ok) toast({ title: 'Update failed', description: res?.error, variant: 'error' });
          else {
            notify(res);
            router.refresh();
          }
        });
      }}
      className={cn(
        'h-8 rounded-lg border border-border bg-white px-2 text-xs font-medium text-ink',
        'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light',
        value === 'published' && 'text-success',
        value === 'archived' && 'text-ink-faint',
        pending && 'opacity-70',
      )}
    >
      <option value="draft">Draft</option>
      <option value="published">Published</option>
      <option value="archived">Archived</option>
    </select>
  );
}

/** "Preview on site" link — opens the website route in a new tab. */
export function PreviewLink({ href, label = 'Preview' }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle"
    >
      <ExternalLink size={13} />
      {label}
    </a>
  );
}
