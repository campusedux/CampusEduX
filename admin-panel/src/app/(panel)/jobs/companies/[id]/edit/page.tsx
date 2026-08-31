import { notFound, redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { CompanyForm } from '../../CompanyForm';
import { updateCompany } from '../../../actions';
import { getCompany } from '@/lib/jobs/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Company · CampusEduX Admin' };

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('jobs');
  if (!admin.perms.jobs.edit) redirect(`/jobs/companies/${params.id}?error=no_access`);
  const company = await getCompany(params.id);
  if (!company) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Edit Company" subtitle={company.name} />

      <CompanyForm
        mode="edit"
        action={updateCompany.bind(null, params.id)}
        cancelHref={`/jobs/companies/${params.id}`}
        companyId={params.id}
        initial={{
          name: company.name,
          logo_url: company.logo_url,
          website: company.website,
          employee_count: company.employee_count,
          about: company.about,
        }}
      />
    </div>
  );
}
