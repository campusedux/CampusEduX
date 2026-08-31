'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useToast } from '@/components/ui/toast';
import { APT_CATEGORIES } from '@/lib/placement/constants';
import {
  createAptitudeTopic,
  updateAptitudeTopic,
  deleteAptitudeTopic,
  createDsaTopic,
  updateDsaTopic,
  deleteDsaTopic,
} from '../actions';

type Result = { ok: boolean; error?: string };

function useSaveToast(state: Result) {
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Saved', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);
}

export function PlacementCategoryManager({
  aptTopics,
  dsaTopics,
  perms,
}: {
  aptTopics: any[];
  dsaTopics: any[];
  perms: { add: boolean; edit: boolean; delete: boolean };
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Aptitude topics" description="Grouped by aptitude / logical / verbal." />
        {perms.add ? <AptAdd /> : null}
        <div className="mt-3 space-y-2">
          {aptTopics.length === 0 ? (
            <EmptyState title="No aptitude topics" />
          ) : (
            aptTopics.map((t) => <AptRow key={t.id} t={t} perms={perms} />)
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="DSA topics" />
        {perms.add ? <DsaAdd /> : null}
        <div className="mt-3 space-y-2">
          {dsaTopics.length === 0 ? (
            <EmptyState title="No DSA topics" />
          ) : (
            dsaTopics.map((t) => <DsaRow key={t.id} t={t} perms={perms} />)
          )}
        </div>
      </Card>
    </div>
  );
}

function AptAdd() {
  const [state, action] = useFormState(createAptitudeTopic, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-2 sm:grid-cols-[1fr_140px_90px_90px_auto] sm:items-end">
      <div>
        <Label htmlFor="apt-name">Name</Label>
        <Input id="apt-name" name="name" required placeholder="Percentages" />
      </div>
      <div>
        <Label htmlFor="apt-cat">Group</Label>
        <Select id="apt-cat" name="category" defaultValue="quantitative">
          {APT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="apt-tq">Questions</Label>
        <Input id="apt-tq" name="total_questions" type="number" defaultValue={0} />
      </div>
      <div>
        <Label htmlFor="apt-so">Sort</Label>
        <Input id="apt-so" name="sort_order" type="number" defaultValue={0} />
      </div>
      <div className="w-20">
        <SubmitButton pendingLabel="…">Add</SubmitButton>
      </div>
    </form>
  );
}

function AptRow({ t, perms }: { t: any; perms: { edit: boolean; delete: boolean } }) {
  const [state, action] = useFormState(updateAptitudeTopic.bind(null, t.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-2.5">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1">
          <Input name="name" defaultValue={t.name} disabled={!perms.edit} />
        </div>
        <div className="w-36">
          <Select name="category" defaultValue={t.category} disabled={!perms.edit}>
            {APT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-24">
          <Input name="total_questions" type="number" defaultValue={t.total_questions} disabled={!perms.edit} />
        </div>
        <div className="w-16">
          <Input name="sort_order" type="number" defaultValue={t.sort_order} disabled={!perms.edit} />
        </div>
        {perms.edit ? (
          <div className="w-20">
            <SubmitButton pendingLabel="…">Save</SubmitButton>
          </div>
        ) : null}
      </form>
      {perms.delete ? <DeleteButton action={() => deleteAptitudeTopic(t.id)} confirmMessage={`Delete "${t.name}"?`} /> : null}
    </div>
  );
}

function DsaAdd() {
  const [state, action] = useFormState(createDsaTopic, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-2 sm:grid-cols-[1fr_90px_auto] sm:items-end">
      <div>
        <Label htmlFor="dsa-name">Name</Label>
        <Input id="dsa-name" name="name" required placeholder="Arrays" />
      </div>
      <div>
        <Label htmlFor="dsa-so">Sort</Label>
        <Input id="dsa-so" name="sort_order" type="number" defaultValue={0} />
      </div>
      <div className="w-20">
        <SubmitButton pendingLabel="…">Add</SubmitButton>
      </div>
    </form>
  );
}

function DsaRow({ t, perms }: { t: any; perms: { edit: boolean; delete: boolean } }) {
  const [state, action] = useFormState(updateDsaTopic.bind(null, t.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-2.5">
      <form action={action} className="flex flex-1 flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1">
          <Input name="name" defaultValue={t.name} disabled={!perms.edit} />
        </div>
        <div className="w-16">
          <Input name="sort_order" type="number" defaultValue={t.sort_order} disabled={!perms.edit} />
        </div>
        <span className="pb-2 text-xs text-ink-faint">{(t.problems ?? []).length} problems</span>
        {perms.edit ? (
          <div className="w-20">
            <SubmitButton pendingLabel="…">Save</SubmitButton>
          </div>
        ) : null}
      </form>
      {perms.delete ? <DeleteButton action={() => deleteDsaTopic(t.id)} confirmMessage={`Delete "${t.name}"?`} /> : null}
    </div>
  );
}
