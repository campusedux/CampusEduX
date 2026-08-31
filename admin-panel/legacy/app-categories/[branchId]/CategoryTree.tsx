'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/primitives';
import { deleteCategory, toggleCategoryActive } from '@/app/categories/actions';

interface CategoryRow {
  id: string;
  parent_id: string | null;
  name: string;
  is_active: boolean;
}

function buildTree(categories: CategoryRow[], parentId: string | null, depth: number): Array<CategoryRow & { depth: number }> {
  return categories
    .filter((c) => c.parent_id === parentId)
    .flatMap((c) => [{ ...c, depth }, ...buildTree(categories, c.id, depth + 1)]);
}

export function CategoryTree({ branchId, categories }: { branchId: string; categories: CategoryRow[] }) {
  const rows = buildTree(categories, null, 0);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="divide-y divide-border">
      {rows.map((cat) => (
        <div key={cat.id} className="flex items-center justify-between py-2 text-sm" style={{ paddingLeft: cat.depth * 20 }}>
          <div className="flex items-center gap-2">
            <span className="text-ink">{cat.name}</span>
            <Badge label={cat.is_active ? 'Active' : 'Inactive'} tone={cat.is_active ? 'success' : 'neutral'} />
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await toggleCategoryActive(cat.id, branchId, !cat.is_active);
                  router.refresh();
                })
              }
              className="text-brand hover:underline disabled:opacity-50"
            >
              {cat.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm('Delete this category?')) return;
                startTransition(async () => {
                  await deleteCategory(cat.id, branchId);
                  router.refresh();
                });
              }}
              className="text-danger hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
