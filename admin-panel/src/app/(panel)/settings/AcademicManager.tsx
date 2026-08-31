'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { useToast } from '@/components/ui/toast';
import {
  saveCourse,
  deleteCourse,
  saveBranch,
  deleteBranch,
  saveYear,
  deleteYear,
} from './actions';

type Result = { ok: boolean; error?: string };
type Kind = 'course' | 'branch' | 'year';

interface Row {
  id: string;
  name?: string;
  label?: string;
  code?: string;
  course_id?: string | null;
  status: string;
  sort_order: number;
}

const CFG = {
  course: { save: saveCourse, del: deleteCourse, primaryField: 'name', primaryLabel: 'Name' },
  branch: { save: saveBranch, del: deleteBranch, primaryField: 'name', primaryLabel: 'Name' },
  year: { save: saveYear, del: deleteYear, primaryField: 'label', primaryLabel: 'Label' },
} as const;

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

export function AcademicManager({
  kind,
  rows,
  courses = [],
  perms,
}: {
  kind: Kind;
  rows: Row[];
  courses?: { id: string; name: string }[];
  perms: { add: boolean; edit: boolean; delete: boolean };
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [courseFilter, setCourseFilter] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const name = (r.name ?? r.label ?? '').toLowerCase();
      if (q && !name.includes(q) && !(r.code ?? '').toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (kind === 'branch' && courseFilter && (r.course_id ?? '') !== courseFilter) return false;
      return true;
    });
  }, [rows, search, statusFilter, courseFilter, kind]);

  return (
    <div className="space-y-5">
      {perms.add ? <AddForm kind={kind} courses={courses} /> : null}
      <Card>
        <CardHeader title={`Items (${filtered.length}${filtered.length !== rows.length ? ` of ${rows.length}` : ''})`} />
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[220px]"
          />
          {kind === 'branch' && courses.length > 0 ? (
            <Select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="max-w-[200px]">
              <option value="">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          ) : null}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="max-w-[150px]"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Nothing yet" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matches" description="Adjust the search or filters above." />
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <RowForm key={r.id} kind={kind} row={r} courses={courses} perms={perms} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Fields({ kind, row, courses, disabled }: { kind: Kind; row?: Row; courses: { id: string; name: string }[]; disabled?: boolean }) {
  const cfg = CFG[kind];
  return (
    <>
      <div>
        <Label htmlFor={cfg.primaryField}>{cfg.primaryLabel}</Label>
        <Input name={cfg.primaryField} required defaultValue={(row?.[cfg.primaryField as 'name' | 'label'] as string) ?? ''} disabled={disabled} />
      </div>
      {kind === 'branch' ? (
        <div>
          <Label htmlFor="course_id">Course</Label>
          <Select name="course_id" defaultValue={row?.course_id ?? ''} disabled={disabled}>
            <option value="">— none —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
      {kind !== 'year' ? (
        <div>
          <Label htmlFor="code">Code</Label>
          <Input name="code" defaultValue={row?.code ?? ''} disabled={disabled} />
        </div>
      ) : null}
      <div>
        <Label htmlFor="sort_order">Sort</Label>
        <Input name="sort_order" type="number" defaultValue={row?.sort_order ?? 0} disabled={disabled} />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={row?.status ?? 'active'} disabled={disabled}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>
    </>
  );
}

function AddForm({ kind, courses }: { kind: Kind; courses: { id: string; name: string }[] }) {
  const [state, action] = useFormState(CFG[kind].save.bind(null, null), { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="Add" />
      <form ref={ref} action={action} className="grid items-end gap-3 sm:grid-cols-4">
        <Fields kind={kind} courses={courses} />
        <div className="w-24">
          <SubmitButton pendingLabel="…">Add</SubmitButton>
        </div>
      </form>
    </Card>
  );
}

function RowForm({
  kind,
  row,
  courses,
  perms,
}: {
  kind: Kind;
  row: Row;
  courses: { id: string; name: string }[];
  perms: { edit: boolean; delete: boolean };
}) {
  const cfg = CFG[kind];
  const [state, action] = useFormState(cfg.save.bind(null, row.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-2.5">
      <form action={action} className="grid flex-1 items-end gap-2 sm:grid-cols-4">
        <Fields kind={kind} row={row} courses={courses} disabled={!perms.edit} />
        {perms.edit ? (
          <div className="w-20">
            <SubmitButton pendingLabel="…">Save</SubmitButton>
          </div>
        ) : (
          <Badge label={row.status} tone={row.status === 'active' ? 'success' : 'neutral'} />
        )}
      </form>
      {perms.delete ? (
        <DeleteButton action={() => cfg.del(row.id)} confirmMessage={`Delete "${row.name ?? row.label}"?`} />
      ) : null}
    </div>
  );
}
