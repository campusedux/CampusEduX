import { notFound, redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { QuestionForm } from '../../../../QuestionForm';
import {
  getTestQuestion,
  getDsaProblem,
  getHrQuestion,
  getTestOptions,
  getDsaTopics,
} from '@/lib/placement/queries';
import { getCompanyOptions } from '@/lib/jobs/queries';
import { updateTestQuestion, updateDsaProblem, updateHrQuestion } from '../../../../actions';
import type { QuestionType } from '@/lib/placement/constants';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Question · CampusEduX Admin' };

export default async function EditQuestionPage({ params }: { params: { type: string; id: string } }) {
  const admin = await requireModule('placement');
  if (!admin.perms.placement.edit) redirect('/placement?error=no_access');
  if (!['aptitude', 'dsa', 'hr'].includes(params.type)) notFound();
  const type = params.type as QuestionType;

  const [tests, dsaTopics, companies] = await Promise.all([getTestOptions(), getDsaTopics(), getCompanyOptions()]);

  let initial: any;
  let action: (prev: { ok: boolean; error?: string }, fd: FormData) => Promise<{ ok: boolean; error?: string }>;
  let back: string;
  if (type === 'aptitude') {
    initial = await getTestQuestion(params.id);
    action = updateTestQuestion.bind(null, params.id);
    back = '/placement/aptitude';
  } else if (type === 'dsa') {
    initial = await getDsaProblem(params.id);
    action = updateDsaProblem.bind(null, params.id);
    back = '/placement/dsa';
  } else {
    initial = await getHrQuestion(params.id);
    action = updateHrQuestion.bind(null, params.id);
    back = initial?.company_id ? '/placement/company' : '/placement/hr';
  }
  if (!initial) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Edit Question" subtitle={`${type.toUpperCase()} question`} />
      <QuestionForm
        type={type}
        mode="edit"
        action={action}
        initial={initial}
        tests={tests}
        dsaTopics={dsaTopics.map((t: any) => ({ id: t.id, name: t.name }))}
        companies={companies}
        cancelHref={back}
      />
    </div>
  );
}
