import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/primitives';
import { FeaturedJobsList } from '../FeaturedJobsList';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Featured Jobs · CampusEduX Admin' };

const SIZE = 20;

export default async function FeaturedJobsPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const admin = await requireModule('jobs');
  const supabase = createClient();
  const q = (searchParams.q ?? '').trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * SIZE;

  let query = supabase
    .from('jobs')
    .select('id, title, company_name, is_featured, featured_priority', { count: 'exact' })
    .order('is_featured', { ascending: false })
    .order('featured_priority', { ascending: true })
    .order('created_at', { ascending: false })
    .range(from, from + SIZE - 1);
  if (q) query = query.or(`title.ilike.%${q}%,company_name.ilike.%${q}%`);

  const { data, count, error } = await query;
  const rows = (error ? [] : data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    company_name: r.company_name,
    on: r.is_featured,
    priority: r.featured_priority ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/jobs" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Jobs
        </Link>
        <PageHeader title="Featured Jobs" subtitle="Choose which jobs are promoted, and their order (lower shows first)." />
      </div>

      <SearchFilterBar placeholder="Search jobs…" />

      {rows.length === 0 ? (
        <EmptyState title="No jobs" />
      ) : (
        <>
          <FeaturedJobsList rows={rows} canEdit={admin.perms.jobs.edit} />
          <Pagination page={page} pageSize={SIZE} total={error ? 0 : count ?? 0} basePath="/jobs/featured" searchParams={{ q }} />
        </>
      )}
    </div>
  );
}
