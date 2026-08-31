import { requireModule } from '@/lib/auth';
import { getProject, getProjectImages } from '@/lib/projects/queries';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { UploadDropzone } from '@/components/ui/UploadDropzone';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ImageFieldCard } from '@/components/ui/ImageFieldCard';
import { addProjectImages, deleteProjectImage, setProjectThumbnail, removeProjectThumbnail } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Project Images · CampusEduX Admin' };

export default async function ProjectImagesPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('projects');
  const [project, images] = await Promise.all([getProject(params.id), getProjectImages(params.id)]);
  const canEdit = admin.perms.projects.edit;

  return (
    <div className="space-y-5">
      <ImageFieldCard
        title="Thumbnail"
        description="The main image shown on project cards in the app. Existing thumbnail URLs keep working."
        currentUrl={project?.thumbnail_url}
        bucket="project-media"
        pathPrefix={`${params.id}/thumbnail`}
        setAction={setProjectThumbnail.bind(null, params.id)}
        removeAction={removeProjectThumbnail.bind(null, params.id)}
        canEdit={canEdit}
      />

      {canEdit ? (
        <Card>
          <CardHeader title="Upload gallery images" description="PNG / JPG / WebP. They’re added to the project gallery in order." />
          <UploadDropzone
            bucket="project-media"
            pathPrefix={`${params.id}/images`}
            accept="image/*"
            multiple
            hint="Drop multiple images at once"
            action={addProjectImages.bind(null, params.id)}
          />
        </Card>
      ) : null}

      <Card>
        <CardHeader title={`Gallery (${images.length})`} />
        {images.length === 0 ? (
          <EmptyState title="No images yet" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="group relative overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="aspect-video w-full object-cover" />
                {canEdit ? (
                  <div className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    <DeleteButton
                      action={deleteProjectImage.bind(null, params.id, img.id, img.url)}
                      confirmMessage="Remove this image?"
                    />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
