import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { QuestionForm } from '../../QuestionForm';
import { getTestOptions } from '@/lib/placement/queries';
import { createTestQuestion } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Question · CampusEduX Admin' };

/**
 * MCQ question authoring for a mock test. This survives the "Placement (legacy)"
 * retirement only to serve Learning topic practice — a topic's Mock Test card
 * links here via its "Manage questions" → "Add question" action.
 */
export default async function AddQuestionPage() {
  const admin = await requireModule('placement');
  if (!admin.perms.placement.add) redirect('/placement?error=no_access');

  const tests = await getTestOptions();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Add Question" subtitle="Add an MCQ to a mock test." />
      <QuestionForm
        type="aptitude"
        mode="create"
        action={createTestQuestion}
        tests={tests}
        dsaTopics={[]}
        companies={[]}
        cancelHref="/placement/tests"
      />
    </div>
  );
}
