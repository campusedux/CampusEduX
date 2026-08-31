'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleDsaProblemActive, deleteDsaProblem } from '@/app/dsa-problems/actions';

export function DsaProblemRowActions({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-3 text-xs font-medium">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleDsaProblemActive(id, !isActive);
            router.refresh();
          })
        }
        className="text-brand hover:underline disabled:opacity-50"
      >
        {isActive ? 'Deactivate' : 'Activate'}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm('Delete this problem? This cannot be undone.')) return;
          startTransition(async () => {
            await deleteDsaProblem(id);
            router.refresh();
          });
        }}
        className="text-danger hover:underline disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
