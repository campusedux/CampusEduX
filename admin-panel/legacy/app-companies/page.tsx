import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { CompanyRowActions } from '@/app/companies/CompanyRowActions';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
  const supabase = createClient();
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*, jobs(count)')
    .order('name');
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Companies</h1>
          <p className="text-sm text-ink-muted">Company profiles linked from job listings and shown on Company Details in the app.</p>
        </div>
        <Link href="/companies/new">
          <Button>
            <Plus size={16} /> New company
          </Button>
        </Link>
      </div>

      <Card className="p-0">
        {!companies || companies.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No companies yet" description="Add a company to link it from job listings." />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Industry</th>
                <th className="px-5 py-3 font-medium">HQ</th>
                <th className="px-5 py-3 font-medium">Open jobs</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.map((company: any) => (
                <tr key={company.id}>
                  <td className="px-5 py-3 font-medium text-ink">{company.name}</td>
                  <td className="px-5 py-3 text-ink-muted">{company.industry ?? '—'}</td>
                  <td className="px-5 py-3 text-ink-muted">{company.hq_location ?? '—'}</td>
                  <td className="px-5 py-3 text-ink-muted">{company.jobs?.[0]?.count ?? 0}</td>
                  <td className="px-5 py-3">
                    <CompanyRowActions companyId={company.id} />
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
