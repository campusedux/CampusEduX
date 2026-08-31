import Link from 'next/link';
import { Plus, FolderKanban, Layers, Crown, Star, TrendingUp } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, StatusPill, Badge, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { RowActions } from '@/components/ui/RowActions';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { formatINR, formatDate, formatNumber } from '@/lib/utils';
import { listProjects, getProjectStats, getCategories, PROJECT_PAGE_SIZE } from '@/lib/projects/queries';
import { deleteProject } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Projects · CampusEduX Admin' };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; category?: string; status?: string; flag?: string; targeting?: string };
}) {
  const admin = await requireModule('projects');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const category = searchParams.category ?? '';
  const status = searchParams.status ?? '';
  const flag = searchParams.flag ?? '';
  const targeting = searchParams.targeting ?? '';

  const [{ rows, total, missing }, stats, categories] = await Promise.all([
    listProjects({ page, q, category, status, flag, targeting }),
    getProjectStats(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        subtitle="The project catalogue students browse, buy and download."
        action={
          <div className="flex gap-2">
            <Link href="/projects/categories">
              <Button variant="secondary">Categories</Button>
            </Link>
            <Link href="/projects/technologies">
              <Button variant="secondary">Technologies</Button>
            </Link>
            {admin.perms.projects.add ? (
              <Link href="/projects/new">
                <Button>
                  <Plus size={16} /> Add Project
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <SearchFilterBar
        placeholder="Search projects by title…"
        filters={
          <>
            <FilterSelect
              name="category"
              label="Category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
            <FilterSelect
              name="status"
              label="Status"
              options={[
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <FilterSelect
              name="flag"
              label="Flag"
              options={[
                { value: 'premium', label: 'Premium' },
                { value: 'best_seller', label: 'Best seller' },
                { value: 'featured', label: 'Featured' },
              ]}
            />
            <FilterSelect
              name="targeting"
              label="Audience"
              options={[
                { value: 'global', label: 'Global' },
                { value: 'course', label: 'Course-wide' },
                { value: 'branch', label: 'Branch-specific' },
              ]}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total" value={formatNumber(stats.total)} icon={FolderKanban} />
        <StatCard label="Published" value={formatNumber(stats.published)} icon={Layers} tone="success" />
        <StatCard label="Premium" value={formatNumber(stats.premium)} icon={Crown} tone="brand" />
        <StatCard label="Best sellers" value={formatNumber(stats.best)} icon={Star} tone="warning" />
        <StatCard label="Total sales" value={formatNumber(stats.totalSales)} icon={TrendingUp} tone="info" />
      </div>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No projects found"
            description={missing ? 'The projects table isn’t available yet — apply the mobile migrations.' : 'Try a different search or filter.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Project</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Price</th>
                  <th className="pb-2 font-medium">Rating</th>
                  <th className="pb-2 font-medium">Sales</th>
                  <th className="pb-2 font-medium">Flags</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <Link href={`/projects/${p.id}`} className="font-medium text-ink hover:text-brand">
                        {p.title}
                      </Link>
                      <p className="text-xs text-ink-faint">{p.id}</p>
                    </td>
                    <td className="py-2.5 text-ink-muted">{p.category_name || '—'}</td>
                    <td className="py-2.5 font-mono">{formatINR(Number(p.price))}</td>
                    <td className="py-2.5 text-ink-muted">
                      {Number(p.rating).toFixed(1)} <span className="text-ink-faint">({p.review_count})</span>
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatNumber(p.sales_count)}</td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {p.is_premium ? <Badge label="Premium" tone="brand" /> : null}
                        {p.is_best_seller ? <Badge label="Best" tone="warning" /> : null}
                        {p.is_featured ? <Badge label="Featured" tone="info" /> : null}
                      </div>
                    </td>
                    <td className="py-2.5">
                      <StatusPill status={p.status ?? 'published'} />
                    </td>
                    <td className="py-2.5">
                      <RowActions
                        viewHref={`/projects/${p.id}`}
                        editHref={admin.perms.projects.edit ? `/projects/${p.id}/edit` : undefined}
                        deleteSlot={
                          admin.perms.projects.delete ? (
                            <DeleteButton
                              action={deleteProject.bind(null, p.id)}
                              confirmMessage={`Delete "${p.title}"? Images, files and versions go with it.`}
                            />
                          ) : null
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination
            page={page}
            pageSize={PROJECT_PAGE_SIZE}
            total={total}
            basePath="/projects"
            searchParams={{ q, category, status, flag, targeting }}
          />
        </div>
      </Card>
    </div>
  );
}
