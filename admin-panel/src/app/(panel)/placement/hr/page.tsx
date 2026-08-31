import { requireModule } from '@/lib/auth';
import { HrQuestionList } from '../HrQuestionList';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'HR Questions · CampusEduX Admin' };

export default async function HrQuestionsPage({ searchParams }: { searchParams: any }) {
  const admin = await requireModule('placement');
  return (
    <HrQuestionList
      scope="generic"
      title="HR Questions"
      subtitle="The generic HR interview bank shown to every student."
      basePath="/placement/hr"
      searchParams={searchParams}
      perms={admin.perms.placement}
    />
  );
}
