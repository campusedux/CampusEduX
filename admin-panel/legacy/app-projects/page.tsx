import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState, Input, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { formatINR } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
};

async function getProjects(searchParams: { [key: string]: string | undefined }) {
  const supabase = createClient();
  let query = supabase
    .from('projects')
    .select('id, title, slug, price, discount_price, status, rating_avg, download_count, branches(name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (searchParams.q) query = query.ilike('title', `%${searchParams.q}%`);
  if (searchParams.status) query = query.eq('status', searchParams.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function getBranches() {
  const supabase = createClient();
  const { data } = await supabase.from('branches').select('id, name').order('sort_order');
  return data ?? [];
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  const [projects] = await Promise.all([getProjects(searchParams), getBranches()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Projects</h1>
          <p className="text-sm text-ink-muted">{projects.length} project{projects.length === 1 ? '' : 's'}</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus size={16} /> New project
          </Button>
        </Link>
      </div>

      <Card>
        <form className="mb-4 flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input name="q" placeholder="Search by title…" defaultValue={searchParams.q} className="pl-9" />
          </div>
          <Select name="status" defaultValue={searchParams.status} className="w-44">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {projects.length === 0 ? (
          <EmptyState title="No projects found" description="Try a different search or create a new project." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-medium">Title</th>
                <th className="pb-2 font-medium">Branch</th>
                <th className="pb-2 font-medium">Price</th>
                <th className="pb-2 font-medium">Rating</th>
                <th className="pb-2 font-medium">Downloads</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project: any) => (
                <tr key={project.id} className="border-t border-border">
                  <td className="py-2.5">
                    <Link href={`/projects/${project.id}`} className="font-medium text-ink hover:text-brand hover:underline">
                      {project.title}
                    </Link>
                  </td>
                  <td className="py-2.5 text-ink-muted">{project.branches?.name ?? '—'}</td>
                  <td className="py-2.5 font-mono">
                    {formatINR(Number(project.discount_price ?? project.price))}
                    {project.discount_price ? (
                      <span className="ml-1 text-xs text-ink-faint line-through">{formatINR(Number(project.price))}</span>
                    ) : null}
                  </td>
                  <td className="py-2.5 text-ink-muted">
                    {Number(project.rating_avg).toFixed(1)} ⭐
                  </td>
                  <td className="py-2.5 text-ink-muted">{project.download_count}</td>
                  <td className="py-2.5">
                    <Badge label={project.status} tone={STATUS_TONE[project.status] ?? 'neutral'} />
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
