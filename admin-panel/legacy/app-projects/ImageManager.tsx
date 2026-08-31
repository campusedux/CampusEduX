'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trash2, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { addProjectImage, deleteProjectImage } from '@/app/projects/actions';

interface ProjectImage {
  id: string;
  storage_path: string;
  sort_order: number;
}

export function ImageManager({ projectId, images }: { projectId: string; images: ProjectImage[] }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const publicUrl = (path: string) => createClient().storage.from('project-images').getPublicUrl(path).data.publicUrl;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setError(null);
    const supabase = createClient();

    try {
      let sortOrder = images.length;
      for (const file of Array.from(files)) {
        const path = `${projectId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('project-images').upload(path, file);
        if (uploadError) throw uploadError;
        await addProjectImage(projectId, path, sortOrder);
        sortOrder += 1;
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (image: ProjectImage) => {
    await deleteProjectImage(projectId, image.id, image.storage_path);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <div className="grid grid-cols-4 gap-3">
        {images.map((image) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
            <Image src={publicUrl(image.storage_path)} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => handleDelete(image)}
              className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Delete image"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-ink-faint hover:bg-surface-subtle">
          <Upload size={18} />
          <span className="text-xs">{isUploading ? 'Uploading…' : 'Add image'}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
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
