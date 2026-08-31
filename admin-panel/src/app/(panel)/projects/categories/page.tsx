import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getCategories } from '@/lib/projects/queries';
import { CategoryManager } from './CategoryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Categories · CampusEduX Admin' };

export default async function CategoriesPage() {
  const admin = await requireModule('projects');
  const categories = await getCategories();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/projects" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Projects
        </Link>
        <PageHeader title="Categories" subtitle="Shared project categories. Deleting is blocked while projects still use one." />
      </div>
      <CategoryManager
        categories={categories}
        canAdd={admin.perms.projects.add}
        canEdit={admin.perms.projects.edit}
        canDelete={admin.perms.projects.delete}
      />
    </div>
  );
}
