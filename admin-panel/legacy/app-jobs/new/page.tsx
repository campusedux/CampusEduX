import { Card, CardHeader } from '@/components/ui/primitives';
import { JobForm } from '@/app/jobs/JobForm';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function NewJobPage() {
  const supabase = createClient();
  const { data: companies, error } = await supabase.from('companies').select('id, name, logo_url').order('name');
  if (error) throw new Error(error.message);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">New job</h1>
      </div>
      <Card>
        <CardHeader title="Details" />
        <JobForm companies={companies ?? []} />
      </Card>
    </div>
  );
}
