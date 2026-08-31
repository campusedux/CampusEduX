import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, CardHeader } from '@/components/ui/primitives';
import { NewBranchForm, BranchToggle } from '@/app/categories/NewBranchForm';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  const supabase = createClient();
  const { data: branches, error } = await supabase
    .from('branches')
    .select('*, categories(count)')
    .is('deleted_at', null)
    .order('sort_order');
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Categories</h1>
        <p className="text-sm text-ink-muted">Branches (Engineering, Pharmacy, …) and their nested category trees.</p>
      </div>

      <Card>
        <CardHeader title="Add branch" />
        <NewBranchForm />
      </Card>

      <Card className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
            <tr>
              <th className="px-5 py-3 font-medium">Branch</th>
              <th className="px-5 py-3 font-medium">Categories</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(branches ?? []).map((branch) => (
              <tr key={branch.id}>
                <td className="px-5 py-3">
                  <Link href={`/categories/${branch.id}`} className="font-medium text-brand hover:underline">
                    {branch.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-ink-muted">{branch.categories?.[0]?.count ?? 0}</td>
                <td className="px-5 py-3">
                  <Badge label={branch.is_active ? 'Active' : 'Inactive'} tone={branch.is_active ? 'success' : 'neutral'} />
                </td>
                <td className="px-5 py-3 text-right">
                  <BranchToggle branchId={branch.id} isActive={branch.is_active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
