import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader } from '@/components/ui/primitives';
import { DsaProblemForm } from '@/app/dsa-problems/DsaProblemForm';

export const dynamic = 'force-dynamic';

export default async function NewDsaProblemPage() {
  const supabase = createClient();
  const { data: topics, error } = await supabase
    .from('placement_topics')
    .select('id, label')
    .eq('category_key', 'technical')
    .order('sort_order');
  if (error) throw new Error(error.message);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">New DSA Problem</h1>
      </div>
      <Card>
        <CardHeader title="Details" />
        <DsaProblemForm topics={topics ?? []} />
      </Card>
    </div>
  );
}
