'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Label, Input, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';

type Result = { ok: boolean; error?: string };

export function VersionForm({ action }: { action: (prev: Result, fd: FormData) => Promise<Result> }) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const seen = useRef(state);

  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not add version', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Version added', variant: 'success' });
      ref.current?.reset();
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="version">Version</Label>
          <Input id="version" name="version" required placeholder="1.2.0" />
        </div>
        <div>
          <Label htmlFor="size_mb">Size (MB)</Label>
          <Input id="size_mb" name="size_mb" type="number" min="0" step="0.1" defaultValue={0} />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-muted">
          <input type="checkbox" name="is_latest" defaultChecked className="h-4 w-4 rounded border-border text-brand" />
          Mark as latest
        </label>
      </div>
      <div>
        <Label htmlFor="changelog">Changelog (one entry per line)</Label>
        <Textarea id="changelog" name="changelog" rows={4} placeholder={'Fixed login crash\nAdded dark mode\nUpdated dependencies'} />
      </div>
      <div className="flex justify-end">
        <div className="w-36">
          <SubmitButton pendingLabel="Adding…">Add version</SubmitButton>
        </div>
      </div>
    </form>
  );
}
