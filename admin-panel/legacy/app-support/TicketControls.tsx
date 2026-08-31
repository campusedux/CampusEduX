'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/primitives';
import { assignTicketToSelf, updateTicketStatus } from '@/app/support/actions';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

export function TicketControls({
  ticketId,
  status,
  isAssigned,
}: {
  ticketId: string;
  status: (typeof STATUSES)[number];
  isAssigned: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        disabled={isPending}
        className="h-8 w-32 text-xs"
        onChange={(e) =>
          startTransition(async () => {
            await updateTicketStatus(ticketId, e.target.value as any);
            router.refresh();
          })
        }
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace('_', ' ')}
          </option>
        ))}
      </Select>
      {!isAssigned ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await assignTicketToSelf(ticketId);
              router.refresh();
            })
          }
          className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
        >
          Assign to me
        </button>
      ) : null}
    </div>
  );
}
