import Link from 'next/link';
import { requireModule } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { saveContentProvenance } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Content provenance · CampusEduX Admin' };

const TYPES = ['learning_contents', 'interview_questions', 'practice_tests', 'test_questions', 'dsa_problems'];
const STATUSES = ['unverified', 'review_required', 'verified_original', 'verified_licensed', 'blocked'];

export default async function ProvenancePage({ searchParams }: {
  searchParams: { resource_type?: string; resource_id?: string; saved?: string };
}) {
  const admin = await requireModule('learning');
  if (admin.role !== 'super_admin') {
    return <p>Rights review is restricted to super admins.</p>;
  }
  const resourceType = TYPES.includes(searchParams.resource_type ?? '') ? searchParams.resource_type! : 'learning_contents';
  const resourceId = (searchParams.resource_id ?? '').trim();
  const supabase = createClient();
  const { data: record, error } = resourceId
    ? await supabase.from('educational_content_provenance').select('*')
      .eq('resource_type', resourceType).eq('resource_id', resourceId).maybeSingle()
    : { data: null, error: null };
  const r = record as Record<string, string | null> | null;
  return <div className="max-w-3xl space-y-6">
    <Link href="/learning" className="text-sm text-brand">← Learning</Link>
    <h1 className="text-2xl font-bold">Educational content provenance</h1>
    <p className="text-sm text-ink-muted">Missing records are unverified. Review rights separately from educational quality. Evidence references must point to private storage; do not paste evidence files or personal data here.</p>
    {error ? <p className="text-red-700">Provenance migration is not available: {error.message}</p> : null}
    {searchParams.saved === '1' ? <p className="text-green-700">Review saved.</p> : null}
    <form method="get" className="flex flex-wrap gap-3">
      <select name="resource_type" defaultValue={resourceType} className="rounded border p-2">
        {TYPES.map(type => <option key={type} value={type}>{type}</option>)}
      </select>
      <input name="resource_id" defaultValue={resourceId} required placeholder="Exact content ID" className="min-w-64 rounded border p-2" />
      <button className="rounded bg-brand px-4 py-2 text-white">Load</button>
    </form>
    {resourceId && !error ? <form action={saveContentProvenance} className="space-y-3 rounded border bg-white p-5">
      <input type="hidden" name="resource_type" value={resourceType} />
      <input type="hidden" name="resource_id" value={resourceId} />
      <p className="font-medium">{resourceType} · {resourceId}</p>
      <p className="text-sm text-ink-muted">Current rights status: {r?.rights_status ?? 'unverified'} · Reviewer: {r?.reviewer_id ?? 'none'} · Reviewed: {r?.review_date ?? 'never'}</p>
      {(['creator', 'creation_method', 'source_dependencies', 'rights_basis', 'license_evidence_ref', 'review_notes'] as const).map(key =>
        <label key={key} className="block text-sm">{key.replaceAll('_', ' ')}
          <textarea name={key} defaultValue={r?.[key] ?? ''} rows={key === 'review_notes' ? 3 : 2} className="mt-1 block w-full rounded border p-2" />
        </label>)}
      <label className="block text-sm">Rights status
        <select name="rights_status" defaultValue={r?.rights_status ?? 'unverified'} className="mt-1 block w-full rounded border p-2">
          {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <label className="block text-sm">Educational quality status
        <select name="quality_status" defaultValue={r?.quality_status ?? 'unreviewed'} className="mt-1 block w-full rounded border p-2">
          {['unreviewed', 'review_required', 'reviewed'].map(status => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <button className="rounded bg-brand px-4 py-2 font-semibold text-white">Save review</button>
    </form> : null}
  </div>;
}
