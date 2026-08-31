import { notFound } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, Badge } from '@/components/ui/primitives';
import { ProjectForm } from '@/app/projects/ProjectForm';
import { ImageManager } from '@/app/projects/ImageManager';
import { FileManager } from '@/app/projects/FileManager';
import { VideoManager } from '@/app/projects/VideoManager';
import { DocumentManager } from '@/app/projects/DocumentManager';
import { setProjectStatus, softDeleteProject } from '@/app/projects/actions';

export const dynamic = 'force-dynamic';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'neutral'> = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
};

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [
    { data: project },
    { data: branches },
    { data: categories },
    { data: technologies },
    { data: projectTechnologies },
    { data: images },
    { data: files },
    { data: videos },
    { data: documents },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', params.id).single(),
    supabase.from('branches').select('id, name').order('sort_order'),
    supabase.from('categories').select('id, name').order('sort_order'),
    supabase.from('technologies').select('id, name').order('name'),
    supabase.from('project_technologies').select('technology_id').eq('project_id', params.id),
    supabase.from('project_images').select('id, storage_path, sort_order').eq('project_id', params.id).order('sort_order'),
    supabase.from('project_files').select('id, file_type, storage_path, size_bytes').eq('project_id', params.id),
    supabase.from('project_videos').select('id, storage_path, video_type, duration_seconds').eq('project_id', params.id),
    supabase
      .from('project_documents')
      .select('id, doc_type, storage_path, preview_storage_path, is_locked')
      .eq('project_id', params.id),
  ]);

  if (!project) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink">{project.title}</h1>
            <Badge label={project.status} tone={STATUS_TONE[project.status] ?? 'neutral'} />
          </div>
          <p className="text-sm text-ink-muted">/{project.slug}</p>
        </div>
        <div className="flex gap-2">
          {project.status !== 'published' ? (
            <form action={async () => { 'use server'; await setProjectStatus(params.id, 'published'); }}>
              <button className="h-9 rounded-lg bg-success px-3 text-sm font-medium text-white hover:opacity-90">
                Publish
              </button>
            </form>
          ) : (
            <form action={async () => { 'use server'; await setProjectStatus(params.id, 'draft'); }}>
              <button className="h-9 rounded-lg border border-border px-3 text-sm font-medium text-ink hover:bg-surface-subtle">
                Unpublish
              </button>
            </form>
          )}
          <form action={async () => { 'use server'; await softDeleteProject(params.id); }}>
            <button className="flex h-9 items-center gap-1.5 rounded-lg border border-danger/30 px-3 text-sm font-medium text-danger hover:bg-danger/5">
              <Trash2 size={14} /> Archive & delete
            </button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader title="Details" />
        <ProjectForm
          projectId={project.id}
          branches={branches ?? []}
          categories={categories ?? []}
          technologies={technologies ?? []}
          initialValues={{
            title: project.title,
            slug: project.slug,
            branchId: project.branch_id,
            categoryId: project.category_id,
            shortDescription: project.short_description ?? '',
            description: project.description ?? '',
            price: Number(project.price),
            discountPrice: project.discount_price === null ? null : Number(project.discount_price),
            isPremium: project.is_premium,
            difficulty: project.difficulty,
            status: project.status,
            technologyIds: (projectTechnologies ?? []).map((pt) => pt.technology_id),
          }}
        />
      </Card>

      <Card>
        <CardHeader title="Gallery images" description="First image is the primary catalog thumbnail." />
        <ImageManager projectId={project.id} images={images ?? []} />
      </Card>

      <Card>
        <CardHeader
          title="Downloadable files"
          description="Locked until purchase — buyers only ever get a short-lived signed URL."
        />
        <FileManager projectId={project.id} files={(files ?? []) as any} />
      </Card>

      <Card>
        <CardHeader title="Demo & preview videos" description="Shown on the project detail screen in the app." />
        <VideoManager projectId={project.id} videos={(videos ?? []) as any} />
      </Card>

      <Card>
        <CardHeader
          title="Documentation / report / PPT previews"
          description="Watermarked previews shown pre-purchase; full file unlocks after purchase."
        />
        <DocumentManager projectId={project.id} documents={(documents ?? []) as any} />
      </Card>
    </div>
  );
}
