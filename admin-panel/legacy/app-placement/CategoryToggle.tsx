'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleCategoryActive } from '@/app/placement/actions';

export function CategoryToggle({ categoryKey, isActive }: { categoryKey: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleCategoryActive(categoryKey, !isActive);
          router.refresh();
        })
      }
      className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
    >
      {isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}
