import { notFound, redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { TemplateForm } from '../../TemplateForm';
import { updateTemplate } from '../../../actions';
import { getTemplate, getTemplateCategories } from '@/lib/resume/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Template · CampusEduX Admin' };

export default async function EditTemplatePage({ params }: { params: { id: string } }) {
  const admin = await requireModule('resume');
  if (!admin.perms.resume.edit) redirect('/resume/templates?error=no_access');
  const [tpl, categories] = await Promise.all([getTemplate(params.id), getTemplateCategories()]);
  if (!tpl) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Edit Template" subtitle={tpl.name} />
      <TemplateForm
        mode="edit"
        action={updateTemplate.bind(null, params.id)}
        initial={tpl}
        templateId={params.id}
        categories={categories.map((c: any) => ({ id: c.id, name: c.name }))}
        cancelHref="/resume/templates"
      />
    </div>
  );
}
