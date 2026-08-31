'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Label, Input, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createTopic, deleteTopic, toggleTopicActive } from '@/app/placement/actions';

export function TopicRowActions({ id, categoryKey, isActive }: { id: string; categoryKey: string; isActive: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 items-center gap-3 text-xs font-medium">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await toggleTopicActive(id, categoryKey, !isActive);
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
          if (!window.confirm('Delete this topic?')) return;
          startTransition(async () => {
            await deleteTopic(id, categoryKey);
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

export function TopicAddForm({ categoryKey }: { categoryKey: string }) {
  const [label, setLabel] = useState('');
  const [countLabel, setCountLabel] = useState('');
  const [difficulty, setDifficulty] = useState<'' | 'Easy' | 'Medium' | 'Hard'>('');
  const [solvedCount, setSolvedCount] = useState('');
  const [totalCount, setTotalCount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = () => {
    if (!label.trim()) return setError('Label is required.');
    setError(null);
    startTransition(async () => {
      try {
        await createTopic({
          categoryKey,
          label,
          countLabel,
          difficulty: difficulty || null,
          solvedCount: solvedCount ? Number(solvedCount) : null,
          totalCount: totalCount ? Number(totalCount) : null,
          sortOrder: 0,
        });
        setLabel('');
        setCountLabel('');
        setDifficulty('');
        setSolvedCount('');
        setTotalCount('');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="rounded-lg border border-dashed border-border p-3">
      {error ? <p className="mb-2 text-xs text-danger">{error}</p> : null}
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-2">
          <Label>Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Arrays" />
        </div>
        <div>
          <Label>Count label</Label>
          <Input value={countLabel} onChange={(e) => setCountLabel(e.target.value)} placeholder="850+ Questions" />
        </div>
        <div>
          <Label>Difficulty</Label>
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}>
            <option value="">—</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </Select>
        </div>
        <div className="flex gap-1">
          <div>
            <Label>Solved</Label>
            <Input type="number" value={solvedCount} onChange={(e) => setSolvedCount(e.target.value)} />
          </div>
          <div>
            <Label>Total</Label>
            <Input type="number" value={totalCount} onChange={(e) => setTotalCount(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <Button onClick={handleAdd} disabled={isPending}>
          {isPending ? 'Adding…' : 'Add topic'}
        </Button>
      </div>
    </div>
  );
}
