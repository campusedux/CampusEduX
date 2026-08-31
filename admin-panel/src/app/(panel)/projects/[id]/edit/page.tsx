import { notFound, redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProjectForm } from '../../ProjectForm';
import { updateProject } from '../../actions';
import { getProject, getCategories, getTechnologies } from '@/lib/projects/queries';
import { getAcademicOptions } from '@/lib/academic-targeting';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Project · CampusEduX Admin' };

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('projects');
  if (!admin.perms.projects.edit) redirect(`/projects/${params.id}?error=no_access`);

  const [project, categories, technologies, academicOptions] = await Promise.all([
    getProject(params.id),
    getCategories(),
    getTechnologies(),
    getAcademicOptions(),
  ]);
  if (!project) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Edit Project" subtitle={project.title} />
      <ProjectForm
        mode="edit"
        action={updateProject.bind(null, params.id)}
        categories={categories}
        technologies={technologies}
        academicOptions={academicOptions}
        cancelHref={`/projects/${params.id}`}
        projectId={params.id}
        initial={{
          title: project.title,
          category_id: project.category_id,
          category_name: project.category_name,
          price: Number(project.price),
          tech_stack: project.tech_stack,
          description: project.description,
          status: project.status,
          is_premium: project.is_premium,
          thumbnail_url: project.thumbnail_url,
          live_demo_url: project.live_demo_url,
          github_url: project.github_url,
          platform_fee_percent: Number(project.platform_fee_percent),
          license: project.license,
          developer_name: project.developer_name,
          target_type: (project as { target_type?: string | null }).target_type ?? null,
          target_course_id: (project as { target_course_id?: string | null }).target_course_id ?? null,
          target_branch_ids: (project as { target_branch_ids?: string[] | null }).target_branch_ids ?? null,
          target_year_id: (project as { target_year_id?: string | null }).target_year_id ?? null,
        }}
      />
    </div>
  );
}
