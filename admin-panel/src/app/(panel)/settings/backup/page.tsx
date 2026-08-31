import Link from 'next/link';
import { ArrowLeft, Database, Download } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, StatusPill, EmptyState } from '@/components/ui/primitives';
import { ActionButton } from '@/components/ui/ActionButton';
import { formatDateTime } from '@/lib/utils';
import { getBackups } from '@/lib/settings/queries';
import { createBackup } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Backup · CampusEduX Admin' };

function bytes(n: number) {
  if (!n) return '—';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(1)} ${u[i]}`;
}

export default async function BackupPage() {
  const admin = await requireModule('backup');
  const backups = await getBackups();

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <Link href="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Settings
        </Link>
        <PageHeader
          title="Backup"
          subtitle="Snapshot history. The database itself is backed up by Supabase; this records manual snapshot requests."
          action={
            admin.perms.backup.add ? (
              <ActionButton action={createBackup} variant="primary" successToast="Backup recorded">
                <Database size={15} /> Create Backup
              </ActionButton>
            ) : null
          }
        />
      </div>

      <Card>
        <CardHeader title={`History (${backups.length})`} />
        {backups.length === 0 ? (
          <EmptyState title="No backups recorded" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">When</th>
                  <th className="pb-2 font-medium">By</th>
                  <th className="pb-2 font-medium">Size</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Download</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b: any) => (
                  <tr key={b.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5 text-ink-muted">{formatDateTime(b.created_at)}</td>
                    <td className="py-2.5 text-ink-muted">{b.created_by_email || '—'}</td>
                    <td className="py-2.5 text-ink-muted">{bytes(Number(b.size_bytes))}</td>
                    <td className="py-2.5">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="py-2.5 text-right">
                      {b.download_url ? (
                        <a href={b.download_url} className="inline-flex items-center gap-1 text-brand hover:underline">
                          <Download size={13} /> Download
                        </a>
                      ) : (
                        <span className="text-xs text-ink-faint">not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
