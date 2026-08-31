import { requireModule } from '@/lib/auth';
import { getProject } from '@/lib/projects/queries';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { UploadDropzone } from '@/components/ui/UploadDropzone';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { VideoUrlForm } from './VideoUrlForm';
import { setProjectVideo, setProjectVideoUrl, removeProjectVideo } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project Video · CampusEduX Admin' };

export default async function ProjectVideoPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('projects');
  const project = await getProject(params.id);
  if (!project) return null;
  const canEdit = admin.perms.projects.edit;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Current video" />
        {project.video_url ? (
          <div className="space-y-3">
            {/\.(mp4|webm|mov)(\?|$)/i.test(project.video_url) ? (
              <video src={project.video_url} controls className="max-h-80 w-full rounded-lg bg-black" />
            ) : (
              <a href={project.video_url} target="_blank" rel="noreferrer" className="text-sm text-brand hover:underline">
                {project.video_url}
              </a>
            )}
            {canEdit ? (
              <DeleteButton
                action={removeProjectVideo.bind(null, params.id)}
                confirmMessage="Remove the project video?"
                label="Remove video"
              />
            ) : null}
          </div>
        ) : (
          <EmptyState title="No video set" />
        )}
      </Card>

      {canEdit ? (
        <>
          <Card>
            <CardHeader title="Upload a video file" description="MP4 / WebM. Stored in the project-media bucket." />
            <UploadDropzone
              bucket="project-media"
              pathPrefix={`${params.id}/video`}
              accept="video/*"
              hint="One file — replaces the current video"
              action={setProjectVideo.bind(null, params.id)}
            />
          </Card>
          <Card>
            <CardHeader title="…or paste a URL" />
            <VideoUrlForm action={setProjectVideoUrl.bind(null, params.id)} current={project.video_url ?? ''} />
          </Card>
        </>
      ) : null}
    </div>
  );
}
