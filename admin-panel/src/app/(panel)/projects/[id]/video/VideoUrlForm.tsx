'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Label, Input } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';

type Result = { ok: boolean; error?: string };

export function VideoUrlForm({
  action,
  current,
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  current: string;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Video URL saved', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="min-w-[280px] flex-1">
        <Label htmlFor="video_url">Video URL (YouTube, Vimeo or an uploaded file URL)</Label>
        <Input id="video_url" name="video_url" defaultValue={current} placeholder="https://…" />
      </div>
      <div className="w-28">
        <SubmitButton pendingLabel="…">Save</SubmitButton>
      </div>
    </form>
  );
}
