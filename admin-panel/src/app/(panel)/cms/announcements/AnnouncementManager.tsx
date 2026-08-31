'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, Textarea, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useToast } from '@/components/ui/toast';
import { AUDIENCES } from '@/lib/cms/constants';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../actions';

type Result = { ok: boolean; error?: string };
interface Ann {
  id: string;
  title: string;
  body: string;
  target_audience: string;
  status: string;
}

function useSaveToast(state: Result, reset?: () => void) {
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Saved', variant: 'success' });
      reset?.();
      router.refresh();
    }
  }, [state, toast, router, reset]);
}

export function AnnouncementManager({ items, perms }: { items: Ann[]; perms: { add: boolean; edit: boolean; delete: boolean } }) {
  return (
    <div className="space-y-5">
      {perms.add ? <AddForm /> : null}
      <Card>
        <CardHeader title={`Announcements (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState title="No announcements" />
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <Row key={a.id} ann={a} perms={perms} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Fields({ a, disabled }: { a?: Ann; disabled?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="title">Title</Label>
        <Input name="title" required defaultValue={a?.title ?? ''} disabled={disabled} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="body">Body</Label>
        <Textarea name="body" rows={3} defaultValue={a?.body ?? ''} disabled={disabled} />
      </div>
      <div>
        <Label htmlFor="target_audience">Audience</Label>
        <Select name="target_audience" defaultValue={a?.target_audience ?? 'all'} disabled={disabled}>
          {AUDIENCES.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={a?.status ?? 'active'} disabled={disabled}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="scheduled">Scheduled</option>
        </Select>
      </div>
    </div>
  );
}

function AddForm() {
  const [state, action] = useFormState(createAnnouncement, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="New announcement" />
      <form ref={ref} action={action} className="space-y-3">
        <Fields />
        <div className="flex justify-end">
          <div className="w-28">
            <SubmitButton pendingLabel="…">Add</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Row({ ann, perms }: { ann: Ann; perms: { edit: boolean; delete: boolean } }) {
  const [state, action] = useFormState(updateAnnouncement.bind(null, ann.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <Badge label={ann.status} tone={ann.status === 'active' ? 'success' : ann.status === 'scheduled' ? 'info' : 'neutral'} />
        {perms.delete ? <DeleteButton action={() => deleteAnnouncement(ann.id)} confirmMessage={`Delete "${ann.title}"?`} /> : null}
      </div>
      <form action={action} className="space-y-3">
        <Fields a={ann} disabled={!perms.edit} />
        {perms.edit ? (
          <div className="flex justify-end">
            <div className="w-20">
              <SubmitButton pendingLabel="…">Save</SubmitButton>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
