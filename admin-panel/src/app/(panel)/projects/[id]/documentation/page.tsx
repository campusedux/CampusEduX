import { requireModule } from '@/lib/auth';
import { getProjectFiles } from '@/lib/projects/queries';
import { ProjectFileManager } from '../ProjectFileManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project Documentation · CampusEduX Admin' };

export default async function ProjectDocsPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('projects');
  const files = await getProjectFiles(params.id, 'documentation');

  return (
    <ProjectFileManager
      projectId={params.id}
      category="documentation"
      title="Documentation"
      accept=".pdf,.doc,.docx,.md,.txt,.zip"
      files={files}
      canEdit={admin.perms.projects.edit}
    />
  );
}
