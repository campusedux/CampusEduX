import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { JobRowActions } from '@/app/jobs/JobRowActions';
import { CompanyLinkSelect } from '@/app/jobs/CompanyLinkSelect';

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const supabase = createClient();
  const { data: jobs, error } = await supabase.from('jobs').select('*').order('posted_at', { ascending: false });
  if (error) throw new Error(error.message);

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name')
    .order('name');
  if (companiesError) throw new Error(companiesError.message);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Jobs</h1>
          <p className="text-sm text-ink-muted">Listings shown in the mobile app&apos;s Jobs tab</p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus size={16} /> New job
          </Button>
        </Link>
      </div>

      <Card className="p-0">
        {!jobs || jobs.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No jobs yet" description="Post your first listing to show it in the app." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Linked profile</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Experience</th>
                <th className="px-5 py-3 font-medium">Salary</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">{job.title}</span>
                      {job.is_featured ? <Badge label="Featured" tone="warning" /> : null}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{job.company_name}</td>
                  <td className="px-5 py-3">
                    <CompanyLinkSelect jobId={job.id} companyId={job.company_id} companies={companies ?? []} />
                  </td>
                  <td className="px-5 py-3 text-ink-muted">{job.location}</td>
                  <td className="px-5 py-3 text-ink-muted">
                    {job.experience_min_years}
                    {job.experience_max_years ? `-${job.experience_max_years}` : '+'} yrs
                  </td>
                  <td className="px-5 py-3 text-ink-muted">
                    {job.salary_min_lpa || job.salary_max_lpa
                      ? `₹${job.salary_min_lpa ?? '?'}-${job.salary_max_lpa ?? '?'} LPA`
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge label={job.is_active ? 'Active' : 'Inactive'} tone={job.is_active ? 'success' : 'neutral'} />
                  </td>
                  <td className="px-5 py-3">
                    <JobRowActions jobId={job.id} isActive={job.is_active} isFeatured={job.is_featured} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
