import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { CategoryToggle } from '@/app/placement/CategoryToggle';

export const dynamic = 'force-dynamic';

export default async function PlacementPage() {
  const supabase = createClient();
  const { data: categories, error } = await supabase
    .from('placement_categories')
    .select('*')
    .order('sort_order');
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Placement Preparation</h1>
        <p className="text-sm text-ink-muted">
          Categories shown on the mobile app&apos;s Placement Prep hub. Open a category to manage its
          topics and questions.
        </p>
      </div>

      <Card className="p-0">
        {!categories || categories.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No categories yet" description="Categories are seeded via migration; add more here if needed." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Route</th>
                <th className="px-5 py-3 font-medium">Count label</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr key={cat.key}>
                  <td className="px-5 py-3">
                    <Link href={`/placement/${cat.key}`} className="font-medium text-brand hover:underline">
                      {cat.label}
                    </Link>
                    <p className="text-xs text-ink-faint">{cat.sublabel}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{cat.route_key}</td>
                  <td className="px-5 py-3 text-ink-muted">{cat.count_label}</td>
                  <td className="px-5 py-3">
                    <Badge label={cat.is_active ? 'Active' : 'Inactive'} tone={cat.is_active ? 'success' : 'neutral'} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <CategoryToggle categoryKey={cat.key} isActive={cat.is_active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
