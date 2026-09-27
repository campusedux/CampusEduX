'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  path: string;
  url: string;
  name: string;
  size: number;
}

/**
 * Drag-and-drop upload box. Uploads straight to a Supabase Storage bucket as
 * the signed-in admin (storage RLS = is_admin) — public or private; `url` (a
 * getPublicUrl() result) is only meaningful for a public bucket, so callers
 * writing into a private one (e.g. custom-project-deliveries) ignore it and
 * resolve their own signed URLs separately — then hands the resulting
 * paths/URLs to a bound Server Action that writes the DB row(s).
 *
 * `maxSizeBytes`, when given, is a client-side pre-check only (fast feedback,
 * skips the upload attempt for an obviously oversized file) — it is NOT the
 * enforcement boundary. The real limits are the bucket's own file_size_limit
 * and whatever the Server Action re-validates after upload.
 */
export function UploadDropzone({
  bucket,
  pathPrefix,
  accept,
  maxSizeBytes,
  multiple = false,
  hint,
  action,
}: {
  bucket: string;
  pathPrefix: string;
  accept?: string;
  maxSizeBytes?: number;
  multiple?: boolean;
  hint?: string;
  action: (files: UploadedFile[]) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const handle = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    if (maxSizeBytes != null) {
      const tooBig = files.find((f) => f.size > maxSizeBytes);
      if (tooBig) {
        toast({
          title: 'File too large',
          description: `${tooBig.name} is over the ${(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB limit for this upload.`,
          variant: 'error',
        });
        if (inputRef.current) inputRef.current.value = '';
        return;
      }
    }

    setBusy(true);
    const supabase = createClient();
    const uploaded: UploadedFile[] = [];

    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
        const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
        const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
        if (error) throw new Error(`${file.name}: ${error.message}`);
        const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
        uploaded.push({ path, url, name: file.name, size: file.size });
      }

      const res = await action(uploaded);
      if (!res.ok) throw new Error(res.error ?? 'Could not save the upload.');

      toast({ title: `Uploaded ${uploaded.length} file${uploaded.length === 1 ? '' : 's'}`, variant: 'success' });
      router.refresh();
    } catch (e) {
      toast({ title: 'Upload failed', description: (e as Error).message, variant: 'error' });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!busy) handle(e.dataTransfer.files);
      }}
      onClick={() => !busy && inputRef.current?.click()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed p-8 text-center transition-colors',
        drag ? 'border-brand bg-brand-light/50' : 'border-border bg-surface-subtle hover:border-brand/50',
        busy && 'pointer-events-none opacity-70',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      {busy ? <Loader2 size={22} className="animate-spin text-brand" /> : <UploadCloud size={22} className="text-ink-faint" />}
      <p className="text-sm font-medium text-ink">
        {busy ? 'Uploading…' : <>Drop {multiple ? 'files' : 'a file'} here, or click to browse</>}
      </p>
      {hint ? <p className="text-xs text-ink-faint">{hint}</p> : null}
    </div>
  );
}
