import { requireModule } from '@/lib/auth';
import { getProjectFiles } from '@/lib/projects/queries';
import { ProjectFileManager } from '../ProjectFileManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project Source Code · CampusEduX Admin' };

export default async function ProjectSourcePage({ params }: { params: { id: string } }) {
  const admin = await requireModule('projects');
  const files = await getProjectFiles(params.id, 'main');

  return (
    <ProjectFileManager
      projectId={params.id}
      category="main"
      title="Source Code"
      accept=".zip,.rar,.7z,.tar,.gz"
      files={files}
      canEdit={admin.perms.projects.edit}
    />
  );
}
