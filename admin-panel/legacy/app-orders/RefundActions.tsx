'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { approveRefund, rejectRefund } from '@/app/orders/actions';

export function RefundActions({ refundId }: { refundId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    startTransition(async () => {
      try {
        await approveRefund(refundId);
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const handleReject = () => {
    const reason = window.prompt('Reason for rejecting this refund (optional):') ?? '';
    startTransition(async () => {
      try {
        await rejectRefund(refundId, reason);
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      <button
        type="button"
        disabled={isPending}
        onClick={handleApprove}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-success hover:bg-success/10 disabled:opacity-50"
        aria-label="Approve refund"
      >
        <Check size={15} />
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={handleReject}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-danger hover:bg-danger/10 disabled:opacity-50"
        aria-label="Reject refund"
      >
        <X size={15} />
      </button>
    </div>
  );
}
