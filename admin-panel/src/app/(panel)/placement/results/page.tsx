import Link from 'next/link';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Results · CampusEduX Admin' };

export default async function ResultsIndexPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireModule('placement');
  const supabase = createClient();
  const q = (searchParams.q ?? '').trim();

  let tq = supabase.from('practice_tests').select('id, title, category').order('title').limit(200);
  if (q) tq = tq.ilike('title', `%${q}%`);
  const [tests, attempts] = await Promise.all([
    safe(tq, [] as { id: string; title: string; category: string }[]),
    safe(supabase.from('test_attempts').select('test_id').limit(10000), [] as { test_id: string }[]),
  ]);
  const counts = new Map<string, number>();
  for (const a of attempts) counts.set(a.test_id, (counts.get(a.test_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <PageHeader title="Results" subtitle="Pick a test to see scores, top performers and the score distribution." />
      <SearchFilterBar placeholder="Search tests…" />
      <Card>
        {tests.length === 0 ? (
          <EmptyState title="No tests" />
        ) : (
          <ul className="divide-y divide-border">
            {tests.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/placement/results/${t.id}`} className="font-medium text-ink hover:text-brand">
                    {t.title}
                  </Link>
                  <span className="ml-2">
                    <Badge label={t.category} tone="neutral" />
                  </span>
                </div>
                <span className="text-sm text-ink-muted">{formatNumber(counts.get(t.id) ?? 0)} attempts</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
