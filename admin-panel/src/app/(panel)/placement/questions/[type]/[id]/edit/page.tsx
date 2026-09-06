import { notFound, redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { QuestionForm } from '../../../../QuestionForm';
import { getTestQuestion, getTestOptions } from '@/lib/placement/queries';
import { updateTestQuestion } from '../../../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Question · CampusEduX Admin' };

/**
 * MCQ question editing for a mock test — kept for Learning topic practice. The
 * `[type]` segment is retained for URL compatibility but only `aptitude` (MCQ)
 * is supported now.
 */
export default async function EditQuestionPage({ params }: { params: { type: string; id: string } }) {
  const admin = await requireModule('placement');
  if (!admin.perms.placement.edit) redirect('/placement?error=no_access');
  if (params.type !== 'aptitude') notFound();

  const [initial, tests] = await Promise.all([getTestQuestion(params.id), getTestOptions()]);
  if (!initial) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Edit Question" subtitle="MCQ question" />
      <QuestionForm
        type="aptitude"
        mode="edit"
        action={updateTestQuestion.bind(null, params.id)}
        initial={initial}
        tests={tests}
        dsaTopics={[]}
        companies={[]}
        cancelHref="/placement/tests"
      />
    </div>
  );
}
