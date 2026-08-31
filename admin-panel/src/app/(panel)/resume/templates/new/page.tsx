import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { TemplateForm } from '../TemplateForm';
import { createTemplate } from '../../actions';
import { getTemplateCategories } from '@/lib/resume/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Template · CampusEduX Admin' };

export default async function NewTemplatePage() {
  const admin = await requireModule('resume');
  if (!admin.perms.resume.add) redirect('/resume/templates?error=no_access');
  const categories = await getTemplateCategories();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Add Template" subtitle="Create a resume template. Upload the preview after saving." />
      <TemplateForm
        mode="create"
        action={createTemplate}
        categories={categories.map((c: any) => ({ id: c.id, name: c.name }))}
        cancelHref="/resume/templates"
      />
    </div>
  );
}
