import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { QuestionForm } from '../../QuestionForm';
import { getTestOptions, getDsaTopics } from '@/lib/placement/queries';
import { getCompanyOptions } from '@/lib/jobs/queries';
import { createTestQuestion, createDsaProblem, createHrQuestion } from '../../actions';
import type { QuestionType } from '@/lib/placement/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Question · CampusEduX Admin' };

const TABS = [
  { value: 'aptitude', label: 'Aptitude / MCQ' },
  { value: 'dsa', label: 'DSA' },
  { value: 'hr', label: 'HR' },
];

export default async function AddQuestionPage({ searchParams }: { searchParams: { type?: string } }) {
  const admin = await requireModule('placement');
  if (!admin.perms.placement.add) redirect('/placement?error=no_access');
  const type = (['aptitude', 'dsa', 'hr'].includes(searchParams.type ?? '') ? searchParams.type : 'aptitude') as QuestionType;

  const [tests, dsaTopics, companies] = await Promise.all([getTestOptions(), getDsaTopics(), getCompanyOptions()]);
  const action = type === 'aptitude' ? createTestQuestion : type === 'dsa' ? createDsaProblem : createHrQuestion;
  const back = type === 'aptitude' ? '/placement/aptitude' : type === 'dsa' ? '/placement/dsa' : '/placement/hr';

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Add Question" subtitle="Type-aware form — pick a question type." />
      <Tabs basePath="/placement/questions/new" param="type" current={type} tabs={TABS} />
      <QuestionForm
        type={type}
        mode="create"
        action={action}
        tests={tests}
        dsaTopics={dsaTopics.map((t: any) => ({ id: t.id, name: t.name }))}
        companies={companies}
        cancelHref={back}
      />
    </div>
  );
}
