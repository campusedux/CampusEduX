import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Student Progress · CampusEduX Admin' };

const CATS = ['aptitude', 'logical', 'verbal', 'hr', 'company'];

export default async function StudentProgressPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [attempts, dsa] = await Promise.all([
    safe(
      supabase
        .from('test_attempts')
        .select('score, total_marks, correct_count, incorrect_count, created_at, test:practice_tests(title, category)')
        .eq('user_id', params.id)
        .order('created_at', { ascending: false }),
      [] as any[],
    ),
    safe(
      supabase
        .from('user_dsa_progress')
        .select('status, problem:dsa_problems(difficulty)')
        .eq('user_id', params.id),
      [] as any[],
    ),
  ]);

  const byCat = CATS.map((cat) => {
    const rows = attempts.filter((a) => a.test?.category === cat);
    const pct =
      rows.length === 0
        ? 0
        : Math.round(
            (rows.reduce((s, r) => s + (r.total_marks ? r.score / r.total_marks : 0), 0) / rows.length) * 100,
          );
    return { cat, attempts: rows.length, pct };
  });

  const dsaByDiff = ['Easy', 'Medium', 'Hard'].map((d) => ({
    d,
    solved: dsa.filter((x) => x.status === 'solved' && x.problem?.difficulty === d).length,
  }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Subject-wise performance" description="Average score across attempted mock tests." />
        {attempts.length === 0 ? (
          <EmptyState title="No test attempts yet" />
        ) : (
          <div className="space-y-3">
            {byCat.map((c) => (
              <div key={c.cat}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium capitalize text-ink">{c.cat}</span>
                  <span className="text-ink-muted">
                    {c.pct}% · {c.attempts} attempt{c.attempts === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, c.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="DSA problems solved" />
          <div className="flex gap-3">
            {dsaByDiff.map((x) => (
              <div key={x.d} className="flex-1 rounded-lg bg-surface-subtle p-3 text-center">
                <p className="text-2xl font-bold text-ink">{x.solved}</p>
                <p className="text-xs text-ink-muted">{x.d}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent test activity" />
          {attempts.length === 0 ? (
            <EmptyState title="Nothing yet" />
          ) : (
            <ul className="divide-y divide-border">
              {attempts.slice(0, 8).map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{a.test?.title || 'Test'}</p>
                    <p className="text-xs text-ink-faint">{formatDateTime(a.created_at)}</p>
                  </div>
                  <Badge
                    label={`${a.score}/${a.total_marks}`}
                    tone={a.total_marks && a.score / a.total_marks >= 0.6 ? 'success' : 'warning'}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
