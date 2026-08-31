'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteBanner, toggleBannerActive } from '@/app/banners/actions';

export function BannerRowActions({
  bannerId,
  isActive,
  storagePath,
}: {
  bannerId: string;
  isActive: boolean;
  storagePath: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-3 text-xs font-medium">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleBannerActive(bannerId, !isActive);
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
          if (!window.confirm('Delete this banner? This cannot be undone.')) return;
          startTransition(async () => {
            await deleteBanner(bannerId, storagePath);
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
