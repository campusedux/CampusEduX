import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { DsaProblemRowActions } from '@/app/dsa-problems/DsaProblemRowActions';

export const dynamic = 'force-dynamic';

export default async function DsaProblemsPage() {
  const supabase = createClient();
  const { data: problems, error } = await supabase
    .from('dsa_problems')
    .select('*, topic:placement_topics(label)')
    .order('sort_order');
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">DSA Problems</h1>
          <p className="text-sm text-ink-muted">Powers Solve Problem → Solution in the app&apos;s DSA Practice module</p>
        </div>
        <Link href="/dsa-problems/new">
          <Button>
            <Plus size={16} /> New problem
          </Button>
        </Link>
      </div>

      <Card className="p-0">
        {!problems || problems.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No problems yet" description="Add your first DSA problem to show it in the app." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Topic</th>
                <th className="px-5 py-3 font-medium">Difficulty</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {problems.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-medium text-ink">{p.title}</td>
                  <td className="px-5 py-3 text-ink-muted">{p.topic?.label ?? '—'}</td>
                  <td className="px-5 py-3">
                    <Badge label={p.difficulty} tone={p.difficulty === 'Easy' ? 'success' : p.difficulty === 'Medium' ? 'warning' : 'danger'} />
                  </td>
                  <td className="px-5 py-3">
                    <Badge label={p.is_active ? 'Active' : 'Inactive'} tone={p.is_active ? 'success' : 'neutral'} />
                  </td>
                  <td className="px-5 py-3">
                    <DsaProblemRowActions id={p.id} isActive={p.is_active} />
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
