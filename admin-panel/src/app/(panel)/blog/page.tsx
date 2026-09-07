import Link from 'next/link';
import { Plus, Newspaper, CheckCircle2, FileEdit, Star, FolderTree } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { formatNumber } from '@/lib/utils';
import { getBlogDashboard, listBlogPosts, getCategoryOptions, BLOG_PAGE_SIZE } from '@/lib/blog/queries';
import { BLOG_STATUSES, BLOG_STATUS_LABEL, BLOG_SORTS } from '@/lib/blog/constants';
import { BlogTable } from './BlogTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog · CampusEduX Admin' };

type SP = { page?: string; q?: string; status?: string; category?: string; sort?: string };

export default async function BlogDashboard({ searchParams }: { searchParams: SP }) {
  const admin = await requireModule('blog');
  const page = Math.max(1, Number(searchParams.page ?? '1') || 1);

  const [d, posts, categories] = await Promise.all([
    getBlogDashboard(),
    listBlogPosts({
      page,
      q: searchParams.q?.trim(),
      status: searchParams.status,
      category: searchParams.category,
      sort: searchParams.sort,
    }),
    getCategoryOptions(),
  ]);

  const active = {
    q: searchParams.q,
    status: searchParams.status,
    category: searchParams.category,
    sort: searchParams.sort,
  };
  const hasFilter = Object.values(active).some(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        subtitle="Write, publish and manage articles for the CampusEduX website. Published posts appear on /blog automatically."
        action={
          admin.perms.blog.add ? (
            <div className="flex items-center gap-2">
              <Link
                href="/blog/categories"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
              >
                <FolderTree size={15} /> Categories
              </Link>
              <Link
                href="/blog/new"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                <Plus size={16} /> New post
              </Link>
            </div>
          ) : (
            <Link
              href="/blog/categories"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
            >
              <FolderTree size={15} /> Categories
            </Link>
          )
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total posts" value={formatNumber(d.total)} icon={Newspaper} hint={`${formatNumber(d.categories)} categories`} />
        <StatCard label="Published" value={formatNumber(d.published)} icon={CheckCircle2} tone="success" />
        <StatCard label="Drafts" value={formatNumber(d.drafts)} icon={FileEdit} tone="warning" hint={`${formatNumber(d.archived)} archived`} />
        <StatCard label="Featured" value={formatNumber(d.featured)} icon={Star} tone="info" />
      </div>

      <Card>
        <CardHeader title="All posts" description="Search, filter and manage every article." />
        <div className="space-y-4">
          <SearchFilterBar
            placeholder="Search by title or slug…"
            filters={
              <>
                <FilterSelect
                  name="status"
                  label="Status"
                  options={BLOG_STATUSES.map((s) => ({ value: s, label: BLOG_STATUS_LABEL[s] }))}
                />
                <FilterSelect
                  name="category"
                  label="Category"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
                <FilterSelect
                  name="sort"
                  label="Sort"
                  options={BLOG_SORTS.map((s) => ({ value: s.value, label: s.label }))}
                />
              </>
            }
          />

          {posts.missing ? (
            <EmptyState
              title="Blog tables not found"
              description="Apply admin migration 037_blog.sql (or mobile 0065_blog.sql) in Supabase, then reload."
            />
          ) : posts.rows.length === 0 ? (
            <EmptyState
              title={hasFilter ? 'No posts match this filter' : 'No posts yet'}
              description={hasFilter ? 'Clear the filters above.' : 'Write your first article — it starts as a draft until you publish it.'}
              action={
                admin.perms.blog.add && !hasFilter ? (
                  <Link
                    href="/blog/new"
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    <Plus size={15} /> New post
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <BlogTable rows={posts.rows} perms={admin.perms.blog} />
              <Pagination
                page={page}
                pageSize={BLOG_PAGE_SIZE}
                total={posts.total}
                basePath="/blog"
                searchParams={active}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
