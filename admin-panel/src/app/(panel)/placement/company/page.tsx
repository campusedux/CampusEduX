import { requireModule } from '@/lib/auth';
import { getCompanyOptions } from '@/lib/jobs/queries';
import { HrQuestionList } from '../HrQuestionList';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Company Questions · CampusEduX Admin' };

export default async function CompanyQuestionsPage({ searchParams }: { searchParams: any }) {
  const admin = await requireModule('placement');
  const companies = await getCompanyOptions();
  return (
    <HrQuestionList
      scope="company"
      title="Company-Specific Questions"
      subtitle="Interview questions tagged to a specific company."
      basePath="/placement/company"
      searchParams={searchParams}
      perms={admin.perms.placement}
      companies={companies}
    />
  );
}
