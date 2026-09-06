'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { ExternalLink } from 'lucide-react';
import { Card, CardHeader, Label, Input, Select, Textarea, EmptyState, Badge, StatusPill } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { DIFFICULTIES, MOCK_TEST_CATEGORIES } from '@/lib/learning/constants';
import type { TopicMockTest, TopicCodingProblem } from '@/lib/learning/queries';
import { ReorderButtons, StatusSelect, useActionToast, type ActionResult } from '@/app/(panel)/learning/_components/shared';
import {
  createTopicMockTest,
  updateTopicMockTest,
  deleteTopicMockTest,
  setTopicMockTestField,
  createTopicCodingProblem,
  updateTopicCodingProblem,
  deleteTopicCodingProblem,
  setTopicCodingProblemField,
  reorderTopicCodingProblem,
} from '@/app/(panel)/learning/practice-actions';
import { CodingProblemFields } from './CodingProblemForm';

type Perms = { add: boolean; edit: boolean; delete: boolean };

export function PracticeManager({
  topicId,
  gridId,
  path,
  mockTests,
  codingProblems,
  perms,
}: {
  topicId: string;
  gridId: string;
  path: string;
  mockTests: TopicMockTest[];
  codingProblems: TopicCodingProblem[];
  perms: Perms;
}) {
  return (
    <>
      <Card>
        <CardHeader
          title="Mock Tests"
          description="MCQ tests shown at the bottom of this topic. Taken natively on both Website and Mobile — the same backend rows. Add questions from each test's question manager."
        />
        <div className="space-y-3">
          {mockTests.length === 0 ? (
            <EmptyState title="No mock tests yet" description="Attach the first one below." />
          ) : (
            mockTests.map((t) => <MockTestRow key={t.id} t={t} path={path} perms={perms} />)
          )}
          {perms.add ? <AddMockTest topicId={topicId} gridId={gridId} path={path} /> : null}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Coding Problems"
          description="Shown at the bottom of this topic. Full details on Website + Mobile; code execution is Website-only (mobile links out). Hidden test cases are never sent to a client."
        />
        <div className="space-y-3">
          {codingProblems.length === 0 ? (
            <EmptyState title="No coding problems yet" description="Add the first one below." />
          ) : (
            codingProblems.map((p, i) => (
              <CodingProblemRow
                key={p.id}
                p={p}
                topicId={topicId}
                path={path}
                perms={perms}
                index={i}
                total={codingProblems.length}
              />
            ))
          )}
          {perms.add ? <AddCodingProblem topicId={topicId} gridId={gridId} path={path} /> : null}
        </div>
      </Card>
    </>
  );
}

// ---------------------------------------------------------------------------
// Mock tests
// ---------------------------------------------------------------------------
function MockTestFields({ t, onDirty }: { t?: TopicMockTest; onDirty?: () => void }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[1fr_130px_130px]">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input name="title" required defaultValue={t?.title ?? ''} onChange={onDirty} />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select name="category" defaultValue={t?.category ?? 'aptitude'} onChange={onDirty}>
            {MOCK_TEST_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select name="difficulty" defaultValue={t?.difficulty ?? 'Medium'} onChange={onDirty}>
            {DIFFICULTIES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea name="description" rows={2} defaultValue={t?.description ?? ''} onChange={onDirty} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="duration_minutes">Duration (min)</Label>
          <Input name="duration_minutes" type="number" min={0} defaultValue={t?.duration_minutes ?? 10} onChange={onDirty} />
        </div>
        <div>
          <Label htmlFor="negative_marking">Negative marking / wrong</Label>
          <Input name="negative_marking" type="number" min={0} step="0.25" defaultValue={t?.negative_marking ?? 0} onChange={onDirty} />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={t?.status ?? 'draft'} onChange={onDirty}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="instructions">Instructions (optional)</Label>
        <Textarea name="instructions" rows={2} defaultValue={t?.instructions ?? ''} onChange={onDirty} />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" name="show_on_website" defaultChecked={t?.show_on_website ?? true} onChange={onDirty} className="h-4 w-4 rounded border-border text-brand" />
          Show on Website
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" name="show_on_mobile" defaultChecked={t?.show_on_mobile ?? true} onChange={onDirty} className="h-4 w-4 rounded border-border text-brand" />
          Show on Mobile
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" name="is_premium" defaultChecked={t?.is_premium ?? false} onChange={onDirty} className="h-4 w-4 rounded border-border text-brand" />
          Premium only
        </label>
      </div>
    </>
  );
}

function MockTestRow({ t, path, perms }: { t: TopicMockTest; path: string; perms: Perms }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(updateTopicMockTest.bind(null, t.id, path), { ok: false } as ActionResult);
  useActionToast(state, () => setOpen(false));
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{t.title}</span>
            {t.is_premium ? <Badge label="Premium" tone="warning" /> : null}
          </div>
          <div className="text-xs text-ink-faint">
            {t.category} · {t.question_count} question{t.question_count === 1 ? '' : 's'}
            {t.duration_minutes ? ` · ${t.duration_minutes} min` : ''} · {t.difficulty}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {perms.edit ? (
            <StatusSelect value={t.status} onChange={(v) => setTopicMockTestField(t.id, path, 'status', v)} />
          ) : (
            <StatusPill status={t.status} />
          )}
          <Link
            href={`/placement/tests/${t.id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle"
          >
            <ExternalLink size={13} /> Manage questions
          </Link>
          {perms.edit ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="h-8 rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle"
            >
              {open ? 'Close' : 'Edit'}
            </button>
          ) : null}
          {perms.delete ? (
            <DeleteButton action={() => deleteTopicMockTest(t.id, path)} confirmMessage={`Delete "${t.title}"?`} />
          ) : null}
        </div>
      </div>
      {open && perms.edit ? (
        <form action={action} className="mt-3 space-y-3 border-t border-border pt-3">
          <MockTestFields t={t} />
          <div className="flex justify-end">
            <div className="w-24">
              <SubmitButton pendingLabel="…">Save</SubmitButton>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function AddMockTest({ topicId, gridId, path }: { topicId: string; gridId: string; path: string }) {
  const [state, action] = useFormState(createTopicMockTest.bind(null, topicId, gridId, path), { ok: false } as ActionResult);
  const ref = useRef<HTMLFormElement>(null);
  useActionToast(state, () => ref.current?.reset());
  return (
    <form ref={ref} action={action} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <span className="text-sm font-semibold text-ink">Add mock test</span>
      <MockTestFields />
      <div className="flex justify-end">
        <div className="w-32">
          <SubmitButton pendingLabel="Adding…">Add test</SubmitButton>
        </div>
      </div>
      <p className="text-xs text-ink-faint">After creating, use “Manage questions” to add MCQs.</p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Coding problems
// ---------------------------------------------------------------------------
function CodingProblemRow({
  p,
  topicId,
  path,
  perms,
  index,
  total,
}: {
  p: TopicCodingProblem;
  topicId: string;
  path: string;
  perms: Perms;
  index: number;
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(updateTopicCodingProblem.bind(null, p.id, path), { ok: false } as ActionResult);
  useActionToast(state, () => setOpen(false));
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {perms.edit ? (
            <ReorderButtons
              onMove={(dir) => reorderTopicCodingProblem(p.id, topicId, path, dir)}
              disabled={total < 2}
            />
          ) : null}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink">{p.title}</span>
              {p.is_premium ? <Badge label="Premium" tone="warning" /> : null}
            </div>
            <div className="text-xs text-ink-faint">
              {p.difficulty} · /coding-problems/{p.slug ?? '—'} · {(p.supported_languages ?? []).join(', ')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {perms.edit ? (
            <StatusSelect value={p.status} onChange={(v) => setTopicCodingProblemField(p.id, path, 'status', v)} />
          ) : (
            <StatusPill status={p.status} />
          )}
          {perms.edit ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="h-8 rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle"
            >
              {open ? 'Close' : 'Edit'}
            </button>
          ) : null}
          {perms.delete ? (
            <DeleteButton action={() => deleteTopicCodingProblem(p.id, path)} confirmMessage={`Delete "${p.title}"?`} />
          ) : null}
        </div>
      </div>
      {open && perms.edit ? (
        <form action={action} className="mt-3 space-y-3 border-t border-border pt-3">
          <CodingProblemFields p={p} />
          <div className="flex justify-end">
            <div className="w-24">
              <SubmitButton pendingLabel="…">Save</SubmitButton>
            </div>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function AddCodingProblem({ topicId, gridId, path }: { topicId: string; gridId: string; path: string }) {
  const [state, action] = useFormState(
    createTopicCodingProblem.bind(null, topicId, gridId, path),
    { ok: false } as ActionResult,
  );
  const ref = useRef<HTMLFormElement>(null);
  useActionToast(state, () => ref.current?.reset());
  return (
    <form ref={ref} action={action} className="space-y-3 rounded-lg border border-dashed border-border p-3">
      <span className="text-sm font-semibold text-ink">Add coding problem</span>
      <CodingProblemFields />
      <div className="flex justify-end">
        <div className="w-32">
          <SubmitButton pendingLabel="Adding…">Add problem</SubmitButton>
        </div>
      </div>
    </form>
  );
}
