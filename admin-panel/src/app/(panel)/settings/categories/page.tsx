import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getCategories } from '@/lib/projects/queries';
import { CategoryManager } from '../../projects/categories/CategoryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Categories · CampusEduX Admin' };

export default async function SettingsCategoriesPage() {
  const admin = await requireModule('settings');
  const categories = await getCategories();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Settings
        </Link>
        <PageHeader title="Categories" subtitle="Shared categories used across projects and courses." />
      </div>
      {/* These are the project catalogue categories; edits are gated server-side
          on the `projects` permission, so mirror that for the buttons here. */}
      <CategoryManager
        categories={categories}
        canAdd={admin.perms.projects.add}
        canEdit={admin.perms.projects.edit}
        canDelete={admin.perms.projects.delete}
      />
    </div>
  );
}
