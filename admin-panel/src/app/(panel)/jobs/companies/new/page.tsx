import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { CompanyForm } from '../CompanyForm';
import { createCompany } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Company · CampusEduX Admin' };

export default async function NewCompanyPage() {
  const admin = await requireModule('jobs');
  if (!admin.perms.jobs.add) redirect('/jobs/companies?error=no_access');

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Add Company" subtitle="Register an employer." />
      <CompanyForm mode="create" action={createCompany} cancelHref="/jobs/companies" />
    </div>
  );
}
