import { requireModule } from '@/lib/auth';
import { getProjectVersions } from '@/lib/projects/queries';
import { Card, CardHeader, Badge, EmptyState } from '@/components/ui/primitives';
import { ActionButton } from '@/components/ui/ActionButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { formatDate } from '@/lib/utils';
import { VersionForm } from './VersionForm';
import { addVersion, setLatestVersion, deleteVersion } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Version History · CampusEduX Admin' };

export default async function ProjectVersionsPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('projects');
  const versions = await getProjectVersions(params.id);
  const canEdit = admin.perms.projects.edit;

  return (
    <div className="space-y-5">
      {canEdit ? (
        <Card>
          <CardHeader title="Add a version" description="Publish a release with its changelog." />
          <VersionForm action={addVersion.bind(null, params.id)} />
        </Card>
      ) : null}

      <Card>
        <CardHeader title={`Version history (${versions.length})`} />
        {versions.length === 0 ? (
          <EmptyState title="No versions yet" />
        ) : (
          <ol className="space-y-4">
            {versions.map((v) => (
              <li key={v.id} className="border-l-2 border-border pl-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">v{v.version}</span>
                  {v.is_latest ? <Badge label="Latest" tone="success" /> : null}
                  <span className="text-xs text-ink-faint">
                    {formatDate(v.released_at)} · {Number(v.size_mb).toFixed(1)} MB
                  </span>
                  {canEdit ? (
                    <span className="ml-auto flex items-center gap-1">
                      {!v.is_latest ? (
                        <ActionButton
                          action={setLatestVersion.bind(null, params.id, v.id)}
                          successToast="Marked as latest"
                        >
                          Set latest
                        </ActionButton>
                      ) : null}
                      <DeleteButton
                        action={deleteVersion.bind(null, params.id, v.id)}
                        confirmMessage={`Delete v${v.version}?`}
                      />
                    </span>
                  ) : null}
                </div>
                {Array.isArray(v.changelog) && v.changelog.length ? (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-ink-muted">
                    {v.changelog.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-ink-faint">No changelog entries.</p>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
