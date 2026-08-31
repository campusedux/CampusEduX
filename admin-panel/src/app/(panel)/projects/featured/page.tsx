import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { safe } from '@/lib/utils';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/primitives';
import { PlacementList } from '../PlacementList';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Featured Projects · CampusEduX Admin' };

const SIZE = 20;

export default async function FeaturedPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const admin = await requireModule('projects');
  const supabase = createClient();
  const q = (searchParams.q ?? '').trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * SIZE;

  let query = supabase
    .from('projects')
    .select('id, title, category_name, is_featured, featured_priority', { count: 'exact' })
    .order('is_featured', { ascending: false })
    .order('featured_priority', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, from + SIZE - 1);
  if (q) query = query.ilike('title', `%${q}%`);

  const { data, count, error } = await query;
  const rows = (error ? [] : data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    category_name: r.category_name,
    on: r.is_featured,
    priority: r.featured_priority ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projects" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Projects
        </Link>
        <PageHeader title="Featured Projects" subtitle="Toggle which projects appear on the app homepage and set their order (lower priority shows first)." />
      </div>

      <SearchFilterBar placeholder="Search projects…" />

      {rows.length === 0 ? (
        <EmptyState title="No projects" />
      ) : (
        <>
          <PlacementList rows={rows} flagField="is_featured" priorityField="featured_priority" canEdit={admin.perms.projects.edit} />
          <Pagination page={page} pageSize={SIZE} total={error ? 0 : count ?? 0} basePath="/projects/featured" searchParams={{ q }} />
        </>
      )}
    </div>
  );
}
