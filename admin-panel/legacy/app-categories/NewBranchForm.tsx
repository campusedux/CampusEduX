'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Label, Input } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createBranch, toggleBranchActive } from '@/app/categories/actions';

export function NewBranchForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = () => {
    if (!name.trim()) return setError('Branch name is required.');
    setError(null);
    startTransition(async () => {
      try {
        await createBranch(name);
        setName('');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <Label>Branch name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pharmacy" />
      </div>
      <Button onClick={handleAdd} disabled={isPending}>
        {isPending ? 'Adding…' : 'Add branch'}
      </Button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}

export function BranchToggle({ branchId, isActive }: { branchId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleBranchActive(branchId, !isActive);
          router.refresh();
        })
      }
      className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
    >
      {isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}
