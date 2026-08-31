'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteJob, toggleJobActive, toggleJobFeatured } from '@/app/jobs/actions';

export function JobRowActions({
  jobId,
  isActive,
  isFeatured,
}: {
  jobId: string;
  isActive: boolean;
  isFeatured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-end gap-3 text-xs font-medium">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleJobFeatured(jobId, !isFeatured);
            router.refresh();
          })
        }
        className="text-ink-muted hover:underline disabled:opacity-50"
      >
        {isFeatured ? 'Unfeature' : 'Feature'}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleJobActive(jobId, !isActive);
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
          if (!window.confirm('Delete this job? This cannot be undone.')) return;
          startTransition(async () => {
            await deleteJob(jobId);
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
