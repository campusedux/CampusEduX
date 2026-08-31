'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Film, Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Select } from '@/components/ui/primitives';
import { addProjectVideo, deleteProjectVideo } from '@/app/projects/actions';

interface ProjectVideo {
  id: string;
  storage_path: string;
  video_type: 'preview' | 'demo';
  duration_seconds: number | null;
}

export function VideoManager({ projectId, videos }: { projectId: string; videos: ProjectVideo[] }) {
  const router = useRouter();
  const [videoType, setVideoType] = useState<'preview' | 'demo'>('demo');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const publicUrl = (path: string) => createClient().storage.from('project-videos').getPublicUrl(path).data.publicUrl;

  const getDuration = (file: File): Promise<number | null> =>
    new Promise((resolve) => {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(videoEl.src);
        resolve(Number.isFinite(videoEl.duration) ? Math.round(videoEl.duration) : null);
      };
      videoEl.onerror = () => resolve(null);
      videoEl.src = URL.createObjectURL(file);
    });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);
    const supabase = createClient();

    try {
      for (const file of Array.from(files)) {
        const path = `${projectId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('project-videos').upload(path, file);
        if (uploadError) throw uploadError;
        const duration = await getDuration(file);
        await addProjectVideo(projectId, path, videoType, duration);
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (video: ProjectVideo) => {
    await deleteProjectVideo(projectId, video.id, video.storage_path);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <ul className="divide-y divide-border">
        {videos.map((video) => (
          <li key={video.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <Film size={16} className="text-ink-faint" />
              <div>
                <a
                  href={publicUrl(video.storage_path)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-ink hover:underline"
                >
                  {video.video_type === 'demo' ? 'Demo video' : 'Preview video'}
                </a>
                <p className="text-xs text-ink-faint">
                  {video.duration_seconds ? `${video.duration_seconds}s` : 'Duration unknown'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(video)}
              className="text-ink-faint hover:text-danger"
              aria-label="Delete video"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <Select value={videoType} onChange={(e) => setVideoType(e.target.value as 'preview' | 'demo')} className="w-40">
          <option value="demo">Demo video</option>
          <option value="preview">Preview video</option>
        </Select>
        <label className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-sm text-ink-faint hover:bg-surface-subtle">
          <Upload size={16} />
          {isUploading ? 'Uploading…' : 'Upload video'}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            disabled={isUploading}
            onChange={(e) => handleUpload(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}
