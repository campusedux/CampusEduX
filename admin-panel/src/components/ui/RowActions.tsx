import Link from 'next/link';
import type { ReactNode } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The per-row action icon cluster (view eye · edit pencil · delete trash) used
 * at the end of every data-table row. Pass hrefs for view/edit; `deleteSlot`
 * is where a page drops its own <form>/confirm button so the destructive path
 * stays a Server Action.
 */
export function RowActions({
  viewHref,
  editHref,
  deleteSlot,
  extra,
}: {
  viewHref?: string;
  editHref?: string;
  deleteSlot?: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {extra}
      {viewHref ? (
        <Link href={viewHref} aria-label="View" className={iconCls}>
          <Eye size={15} />
        </Link>
      ) : null}
      {editHref ? (
        <Link href={editHref} aria-label="Edit" className={iconCls}>
          <Pencil size={15} />
        </Link>
      ) : null}
      {deleteSlot}
    </div>
  );
}

export const iconCls = cn(
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint',
  'hover:bg-surface-subtle hover:text-ink transition-colors',
);

export const dangerIconCls = cn(
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint',
  'hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-40',
);

export function DeleteIcon() {
  return <Trash2 size={15} />;
}
