'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Label, Input, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createCategory } from '@/app/categories/actions';

export function NewCategoryForm({
  branchId,
  categories,
}: {
  branchId: string;
  categories: Array<{ id: string; name: string }>;
}) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = () => {
    if (!name.trim()) return setError('Category name is required.');
    setError(null);
    startTransition(async () => {
      try {
        await createCategory(branchId, name, parentId || null);
        setName('');
        setParentId('');
        router.refresh();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="flex items-end gap-3">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex-1">
        <Label>Category name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Final Year Projects" />
      </div>
      <div className="flex-1">
        <Label>Parent category (optional)</Label>
        <Select value={parentId} onChange={(e) => setParentId(e.target.value)}>
          <option value="">— Top level —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <Button onClick={handleAdd} disabled={isPending}>
        {isPending ? 'Adding…' : 'Add category'}
      </Button>
    </div>
  );
}
