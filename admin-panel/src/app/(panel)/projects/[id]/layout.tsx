import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { getProject } from '@/lib/projects/queries';
import { Badge, StatusPill } from '@/components/ui/primitives';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { formatINR, formatDate, formatNumber } from '@/lib/utils';
import { ProjectTabs } from './ProjectTabs';
import { deleteProject } from '../actions';

export const dynamic = 'force-dynamic';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const admin = await requireModule('projects');
  const project = await getProject(params.id);
  if (!project) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-card border border-border bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {project.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.thumbnail_url} alt="" className="h-16 w-24 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-surface-subtle text-xs text-ink-faint">
              No image
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-ink">{project.title}</h1>
              <StatusPill status={project.status ?? 'published'} />
              {project.is_premium ? <Badge label="Premium" tone="brand" /> : null}
              {project.is_best_seller ? <Badge label="Best seller" tone="warning" /> : null}
              {project.is_featured ? <Badge label="Featured" tone="info" /> : null}
            </div>
            <p className="mt-0.5 text-sm text-ink-muted">
              {project.category_name || 'Uncategorised'} · {formatINR(Number(project.price))} ·{' '}
              {formatNumber(project.sales_count)} sales · {Number(project.rating).toFixed(1)}★ ({project.review_count})
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {project.id} · added {formatDate(project.created_at)}
            </p>
          </div>
        </div>
        {admin.perms.projects.edit ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${project.id}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
            >
              <Pencil size={14} /> Edit
            </Link>
            {admin.perms.projects.delete ? (
              <DeleteButton
                action={deleteProject.bind(null, project.id)}
                confirmMessage={`Delete "${project.title}"?`}
                label="Delete"
                redirectTo="/projects"
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <ProjectTabs id={params.id} />
      {children}
    </div>
  );
}
