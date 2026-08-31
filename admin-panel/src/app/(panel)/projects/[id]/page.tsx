import { requireModule } from '@/lib/auth';
import { getProject } from '@/lib/projects/queries';
import { Card, CardHeader, Badge } from '@/components/ui/primitives';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { FlashToast } from '@/components/ui/FlashToast';
import { formatINR, formatDate } from '@/lib/utils';
import { toggleProjectFlag } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project Details · CampusEduX Admin' };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="max-w-[60%] text-right font-medium text-ink">{value || '—'}</span>
    </div>
  );
}

export default async function ProjectOverviewPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string; saved?: string };
}) {
  const admin = await requireModule('projects');
  const p = await getProject(params.id);
  if (!p) return null;
  const canEdit = admin.perms.projects.edit;

  return (
    <div className="space-y-5">
      {searchParams.created ? <FlashToast title="Project created" description="Now add images, video and files." /> : null}
      {searchParams.saved ? <FlashToast title="Changes saved" /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Description" />
          <p className="whitespace-pre-wrap text-sm text-ink-muted">{p.description || 'No description yet.'}</p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(p.tech_stack ?? []).map((t) => (
              <Badge key={t} label={t} tone="neutral" />
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Homepage placement" />
          {canEdit ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Featured</span>
                <ToggleSwitch checked={p.is_featured} action={toggleProjectFlag.bind(null, p.id, 'is_featured')} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Best seller</span>
                <ToggleSwitch checked={p.is_best_seller} action={toggleProjectFlag.bind(null, p.id, 'is_best_seller')} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Premium</span>
                <ToggleSwitch checked={p.is_premium} action={toggleProjectFlag.bind(null, p.id, 'is_premium')} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-faint">Read-only for your role.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Catalogue" />
          <Row label="Category" value={p.category_name} />
          <Row label="Price" value={formatINR(Number(p.price))} />
          <Row label="Platform fee" value={`${p.platform_fee_percent}%`} />
          <Row label="License" value={p.license} />
          <Row label="Developer" value={p.developer_name} />
          <Row label="Status" value={p.status} />
        </Card>
        <Card>
          <CardHeader title="Assets & links" />
          <Row label="Images" value={`${(p.images ?? []).length} uploaded`} />
          <Row label="Video" value={p.video_url ? 'Set' : 'Not set'} />
          <Row label="Source code" value={`${Number(p.source_code_size_mb).toFixed(1)} MB`} />
          <Row label="Documentation" value={`${Number(p.documentation_size_mb).toFixed(1)} MB`} />
          <Row
            label="Live demo"
            value={p.live_demo_url ? <a className="text-brand hover:underline" href={p.live_demo_url} target="_blank" rel="noreferrer">Open</a> : null}
          />
          <Row
            label="GitHub"
            value={p.github_url ? <a className="text-brand hover:underline" href={p.github_url} target="_blank" rel="noreferrer">Open</a> : null}
          />
          <Row label="Last updated" value={formatDate(p.updated_at)} />
        </Card>
      </div>
    </div>
  );
}
