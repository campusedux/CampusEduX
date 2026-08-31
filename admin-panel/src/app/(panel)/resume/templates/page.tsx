import Link from 'next/link';
import { Plus, Crown } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { FlashToast } from '@/components/ui/FlashToast';
import { getTemplates } from '@/lib/resume/queries';
import { deleteTemplate } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Resume Templates · CampusEduX Admin' };

export default async function TemplatesPage({ searchParams }: { searchParams: { created?: string; saved?: string } }) {
  const admin = await requireModule('resume');
  const templates = await getTemplates();

  return (
    <div className="space-y-6">
      {searchParams.created ? <FlashToast title="Template created" /> : null}
      {searchParams.saved ? <FlashToast title="Template saved" /> : null}

      <PageHeader
        title="Resume Templates"
        subtitle="The templates students pick from in the resume builder."
        action={
          <div className="flex gap-2">
            <Link href="/resume/templates/categories">
              <Button variant="secondary">Categories</Button>
            </Link>
            {admin.perms.resume.add ? (
              <Link href="/resume/templates/new">
                <Button>
                  <Plus size={16} /> Add Template
                </Button>
              </Link>
            ) : null}
          </div>
        }
      />

      {templates.length === 0 ? (
        <EmptyState title="No templates yet" description="Apply admin migration 006, or add one." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t: any) => (
            <Card key={t.id} className="flex flex-col">
              <div
                className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-lg border border-border"
                style={{ background: `${t.accent_color}14` }}
              >
                {t.preview_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.preview_image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-semibold" style={{ color: t.accent_color }}>
                    {t.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ink">{t.name}</p>
                {t.is_premium ? (
                  <Badge label="Premium" tone="brand" />
                ) : null}
                <Badge label={t.status} tone={t.status === 'active' ? 'success' : 'neutral'} />
              </div>
              <p className="mt-1 text-xs text-ink-faint">{t.category}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{t.description || 'No description.'}</p>
              <div className="mt-3 flex items-center gap-2">
                {admin.perms.resume.edit ? (
                  <Link
                    href={`/resume/templates/${t.id}/edit`}
                    className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
                  >
                    Edit
                  </Link>
                ) : null}
                {admin.perms.resume.delete ? (
                  <DeleteButton action={deleteTemplate.bind(null, t.id)} confirmMessage={`Delete "${t.name}"?`} />
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
