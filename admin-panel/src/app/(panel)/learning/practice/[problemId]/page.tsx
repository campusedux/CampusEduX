import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getPracticeProblem, listPracticeCategories } from '@/lib/learning/queries';
import { PracticeProblemForm } from '../PracticeProblemForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit practice problem · CampusEduX Admin' };

export default async function EditPracticeProblemPage({ params }: { params: { problemId: string } }) {
  await requireModule('learning');
  const [problem, categories] = await Promise.all([
    getPracticeProblem(params.problemId),
    listPracticeCategories(),
  ]);
  if (!problem) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/learning/practice" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Coding Practice
        </Link>
        <PageHeader
          title={problem.title}
          subtitle={
            problem.slug ? `Website: /practice/problems/${problem.slug}` : 'Set a slug to publish this problem.'
          }
        />
      </div>
      <PracticeProblemForm categories={categories} problem={problem} />
    </div>
  );
}
