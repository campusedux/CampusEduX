import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { DonutChart } from '@/components/charts/DonutChart';
import { formatNumber } from '@/lib/utils';
import { getDifficultyCounts } from '@/lib/placement/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Difficulty Levels · CampusEduX Admin' };

const TONE: Record<string, string> = { Easy: 'text-success', Medium: 'text-[#B77A1B]', Hard: 'text-danger' };

export default async function DifficultyLevelsPage() {
  await requireModule('placement');
  const rows = await getDifficultyCounts();
  const totals = rows.map((r) => ({ ...r, total: r.dsa + r.mcq }));

  return (
    <div className="space-y-6">
      <PageHeader title="Difficulty Levels" subtitle="Question counts by Easy / Medium / Hard across DSA and MCQ banks." />

      <div className="grid gap-4 sm:grid-cols-3">
        {totals.map((r) => (
          <Card key={r.difficulty}>
            <p className={`text-sm font-semibold ${TONE[r.difficulty]}`}>{r.difficulty}</p>
            <p className="mt-2 text-3xl font-bold text-ink">{formatNumber(r.total)}</p>
            <p className="mt-1 text-xs text-ink-faint">
              {formatNumber(r.dsa)} DSA · {formatNumber(r.mcq)} MCQ
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Distribution" />
        <DonutChart data={totals.map((r) => ({ label: r.difficulty, value: r.total }))} centerLabel="Questions" />
      </Card>
    </div>
  );
}
