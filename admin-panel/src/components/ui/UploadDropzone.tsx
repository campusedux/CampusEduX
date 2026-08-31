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
 * Drag-and-drop upload box. Uploads straight to a public Supabase Storage
 * bucket as the signed-in admin (storage RLS = is_admin), then hands the
 * resulting paths/URLs to a bound Server Action that writes the DB row(s).
 */
export function UploadDropzone({
  bucket,
  pathPrefix,
  accept,
  multiple = false,
  hint,
  action,
}: {
  bucket: string;
  pathPrefix: string;
  accept?: string;
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
