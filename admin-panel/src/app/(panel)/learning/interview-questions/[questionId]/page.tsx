import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getInterviewQuestion, listInterviewCategories, listInterviewTopics } from '@/lib/learning/queries';
import { QuestionForm } from '../QuestionForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit interview question · CampusEduX Admin' };

export default async function EditInterviewQuestionPage({ params }: { params: { questionId: string } }) {
  await requireModule('learning');
  const [question, categories, topics] = await Promise.all([
    getInterviewQuestion(params.questionId),
    listInterviewCategories(),
    listInterviewTopics(),
  ]);
  if (!question) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href="/learning/interview-questions"
          className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={14} /> Interview Questions
        </Link>
        <PageHeader title={question.question} subtitle={`Difficulty: ${question.difficulty}`} />
      </div>
      <QuestionForm categories={categories} topics={topics} question={question} />
    </div>
  );
}
