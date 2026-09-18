import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/primitives';
import { listInterviewCategories, listInterviewTopics } from '@/lib/learning/queries';
import { QuestionForm } from '../QuestionForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New interview question · CampusEduX Admin' };

export default async function NewInterviewQuestionPage() {
  const admin = await requireModule('learning');
  if (!admin.perms.learning.add) redirect('/learning/interview-questions');
  const [categories, topics] = await Promise.all([listInterviewCategories(), listInterviewTopics()]);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/learning/interview-questions"
          className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={14} /> Interview Questions
        </Link>
        <PageHeader title="New interview question" subtitle="Create the question, then it opens in the editor." />
      </div>
      {topics.length === 0 ? (
        <EmptyState
          title="Add a topic first"
          description="A question must belong to a topic. Create a category and topic on the Interview Questions page."
        />
      ) : (
        <QuestionForm categories={categories} topics={topics} />
      )}
    </div>
  );
}
