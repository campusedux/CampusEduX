import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader } from '@/components/ui/primitives';
import { ProjectForm } from '@/app/projects/ProjectForm';

export const dynamic = 'force-dynamic';

export default async function NewProjectPage() {
  const supabase = createClient();
  const [{ data: branches }, { data: categories }, { data: technologies }] = await Promise.all([
    supabase.from('branches').select('id, name').order('sort_order'),
    supabase.from('categories').select('id, name').order('sort_order'),
    supabase.from('technologies').select('id, name').order('name'),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">New project</h1>
        <p className="text-sm text-ink-muted">Starts as a draft — publish it once images and files are ready.</p>
      </div>
      <Card>
        <CardHeader title="Details" />
        <ProjectForm branches={branches ?? []} categories={categories ?? []} technologies={technologies ?? []} />
      </Card>
    </div>
  );
}
