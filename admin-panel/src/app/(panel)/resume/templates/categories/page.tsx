import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getTemplateCategories } from '@/lib/resume/queries';
import { TemplateCategoryManager } from './CategoryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Template Categories · CampusEduX Admin' };

export default async function TemplateCategoriesPage() {
  const admin = await requireModule('resume');
  const categories = await getTemplateCategories();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/resume/templates" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Templates
        </Link>
        <PageHeader title="Template Categories" subtitle="Group templates in the resume builder’s picker." />
      </div>
      <TemplateCategoryManager categories={categories} perms={admin.perms.resume} />
    </div>
  );
}
