import { createClient } from '@/lib/supabase/server';
import { Card, EmptyState } from '@/components/ui/primitives';
import { Pagination } from '@/components/ui/Pagination';
import { formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Student Downloads · CampusEduX Admin' };

const SIZE = 15;

export default async function StudentDownloadsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const from = (page - 1) * SIZE;

  const { data, count, error } = await supabase
    .from('downloads')
    .select('id, file_label, file_size_mb, downloaded_at, project:projects(title)', { count: 'exact' })
    .eq('user_id', params.id)
    .order('downloaded_at', { ascending: false })
    .range(from, from + SIZE - 1);

  const rows = error ? [] : (data ?? []);
  const total = error ? 0 : count ?? 0;

  return (
    <Card>
      {rows.length === 0 ? (
        <EmptyState title="No downloads" description="This student hasn’t downloaded any files yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-medium">File</th>
                <th className="pb-2 font-medium">Project</th>
                <th className="pb-2 font-medium">Size</th>
                <th className="pb-2 font-medium">Downloaded</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d: any) => (
                <tr key={d.id} className="border-t border-border odd:bg-surface-subtle/40">
                  <td className="py-2.5 text-ink">{d.file_label}</td>
                  <td className="py-2.5 text-ink-muted">{d.project?.title || '—'}</td>
                  <td className="py-2.5 font-mono text-ink-muted">{Number(d.file_size_mb || 0).toFixed(1)} MB</td>
                  <td className="py-2.5 text-ink-muted">{formatDateTime(d.downloaded_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3">
        <Pagination page={page} pageSize={SIZE} total={total} basePath={`/students/${params.id}/downloads`} />
      </div>
    </Card>
  );
}
