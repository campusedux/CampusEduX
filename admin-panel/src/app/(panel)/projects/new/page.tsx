import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProjectForm } from '../ProjectForm';
import { createProject } from '../actions';
import { getCategories, getTechnologies } from '@/lib/projects/queries';
import { getAcademicOptions } from '@/lib/academic-targeting';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Project · CampusEduX Admin' };

export default async function NewProjectPage() {
  const admin = await requireModule('projects');
  if (!admin.perms.projects.add) redirect('/projects?error=no_access');
  const [categories, technologies, academicOptions] = await Promise.all([
    getCategories(),
    getTechnologies(),
    getAcademicOptions(),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Add Project" subtitle="Create the catalogue entry, then upload media and files." />
      <ProjectForm
        mode="create"
        action={createProject}
        categories={categories}
        technologies={technologies}
        academicOptions={academicOptions}
        cancelHref="/projects"
      />
    </div>
  );
}
