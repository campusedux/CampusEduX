import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { CategoryTree } from '@/app/categories/[branchId]/CategoryTree';
import { NewCategoryForm } from '@/app/categories/[branchId]/NewCategoryForm';

export const dynamic = 'force-dynamic';

export default async function BranchCategoriesPage({ params }: { params: { branchId: string } }) {
  const supabase = createClient();

  const [{ data: branch }, { data: categories, error }] = await Promise.all([
    supabase.from('branches').select('*').eq('id', params.branchId).maybeSingle(),
    supabase.from('categories').select('*').eq('branch_id', params.branchId).is('deleted_at', null).order('sort_order'),
  ]);
  if (error) throw new Error(error.message);
  if (!branch) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/categories" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Categories
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-ink">{branch.name}</h1>
          <Badge label={branch.is_active ? 'Active' : 'Inactive'} tone={branch.is_active ? 'success' : 'neutral'} />
        </div>
      </div>

      <Card>
        <CardHeader title="Add category" description="Leave parent empty for a top-level category under this branch." />
        <NewCategoryForm branchId={branch.id} categories={categories ?? []} />
      </Card>

      <Card>
        <CardHeader title="Category tree" />
        {!categories || categories.length === 0 ? (
          <EmptyState title="No categories yet" />
        ) : (
          <CategoryTree branchId={branch.id} categories={categories} />
        )}
      </Card>
    </div>
  );
}
