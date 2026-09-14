import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/primitives';
import { listPracticeCategories } from '@/lib/learning/queries';
import { PracticeProblemForm } from '../PracticeProblemForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New practice problem · CampusEduX Admin' };

export default async function NewPracticeProblemPage() {
  const admin = await requireModule('learning');
  if (!admin.perms.learning.add) redirect('/learning/practice');
  const categories = await listPracticeCategories();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/learning/practice" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Coding Practice
        </Link>
        <PageHeader title="New practice problem" subtitle="Create the problem, then it opens in the editor." />
      </div>
      {categories.length === 0 ? (
        <EmptyState
          title="Add a category first"
          description="A practice problem must belong to a category. Create one on the Coding Practice page."
        />
      ) : (
        <PracticeProblemForm categories={categories} />
      )}
    </div>
  );
}
