'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Flag, X } from 'lucide-react';
import { moderateReview } from '@/app/reviews/actions';

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const act = (status: 'approved' | 'rejected' | 'flagged') =>
    startTransition(async () => {
      await moderateReview(reviewId, status);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => act('approved')}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-success hover:bg-success/10 disabled:opacity-50"
        aria-label="Approve review"
      >
        <Check size={15} />
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => act('rejected')}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-danger hover:bg-danger/10 disabled:opacity-50"
        aria-label="Reject review"
      >
        <X size={15} />
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => act('flagged')}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-warning hover:bg-warning/10 disabled:opacity-50"
        aria-label="Flag review"
      >
        <Flag size={15} />
      </button>
    </div>
  );
}
