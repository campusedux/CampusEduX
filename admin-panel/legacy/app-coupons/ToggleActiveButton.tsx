'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toggleCouponActive } from '@/app/coupons/actions';

export function ToggleActiveButton({ couponId, isActive }: { couponId: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleCouponActive(couponId, !isActive);
          router.refresh();
        })
      }
      className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
    >
      {isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}
