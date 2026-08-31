'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
  DEFAULT_MAX_IMAGE_MB,
  IMAGE_ACCEPT,
  compressImage,
  randomImageKey,
  validateImageFile,
} from '@/lib/storage/image';

type Aspect = 'video' | 'square' | 'wide' | 'auto';

const ASPECT_CLASS: Record<Aspect, string> = {
  video: 'aspect-video',
  square: 'aspect-square max-w-[200px]',
  wide: 'aspect-[3/1]',
  auto: 'min-h-[8rem]',
};

export interface ImageUploaderProps {
  /**
   * Form field name. A hidden <input> with this name carries the current URL,
   * so the surrounding <form> + its Server Action keep working unchanged — the
   * DB column just receives a Storage URL instead of a hand-typed one.
   */
  name: string;
  /** Supabase Storage bucket (must have an is_admin write policy). */
  bucket: string;
  /** Folder inside the bucket, e.g. `projects/abc123` or `prep-notes`. */
  pathPrefix: string;
  /** Current value (URL already saved on the row). */
  defaultValue?: string | null;
  disabled?: boolean;
  maxSizeMB?: number;
  aspect?: Aspect;
  /** Extra line under the drop zone. */
  helpText?: string;
  /** Fired after a successful upload with the new public URL. */
  onUploaded?: (url: string) => void;
  /** Fired after Remove, with an empty string. */
  onRemoved?: () => void;
  className?: string;
}

/**
 * Reusable "one image" field used across every admin form. Pick or drop a
 * JPG/PNG/WebP → it's validated, downscaled + re-encoded to WebP client-side,
 * uploaded to Storage as the signed-in admin with a real progress bar, and the
 * resulting public URL is written into a hidden form input. No URL typing.
 */
export function ImageUploader({
  name,
  bucket,
  pathPrefix,
  defaultValue = '',
  disabled = false,
  maxSizeMB = DEFAULT_MAX_IMAGE_MB,
  aspect = 'video',
  helpText,
  onUploaded,
  onRemoved,
  className,
}: ImageUploaderProps) {
  const [url, setUrl] = useState<string>(defaultValue ?? '');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const inputId = useId();

  const putToStorage = useCallback(
    async (path: string, blob: Blob, contentType: string) => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session expired — sign in again and retry.');

      const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (!base) throw new Error('Storage is not configured.');
      const endpoint = `${base}/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', endpoint, true);
        xhr.setRequestHeader('authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '');
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.setRequestHeader('cache-control', '3600');
        xhr.setRequestHeader('content-type', contentType);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onerror = () => reject(new Error('Network error during upload.'));
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            let msg = `Upload failed (${xhr.status}).`;
            try {
              const body = JSON.parse(xhr.responseText);
              if (body?.message) msg = body.message;
              if (xhr.status === 403) msg = 'You do not have permission to upload here.';
            } catch {
              /* keep default */
            }
            reject(new Error(msg));
          }
        };
        xhr.send(blob);
      });

      return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },
    [bucket],
  );

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file || busy || disabled) return;

      const check = validateImageFile(file, maxSizeMB);
      if (!check.ok) {
        toast({ title: 'Invalid image', description: check.error, variant: 'error' });
        return;
      }

      setBusy(true);
      setProgress(0);
      try {
        const prepared = await compressImage(file);
        const prefix = pathPrefix.replace(/^\/+|\/+$/g, '');
        // Fresh random key every upload → the URL itself changes on Replace, so
        // no stale-cache problem and no ?v= cache-buster needed.
        const path = `${prefix}/${randomImageKey(prepared.ext)}`;
        const publicUrl = await putToStorage(path, prepared.blob, prepared.contentType);
        setUrl(publicUrl);
        onUploaded?.(publicUrl);
        toast({
          title: 'Image uploaded',
          description: prepared.compressed ? 'Optimised to WebP before upload.' : undefined,
          variant: 'success',
        });
      } catch (e) {
        toast({ title: 'Upload failed', description: (e as Error).message, variant: 'error' });
      } finally {
        setBusy(false);
        setProgress(0);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [busy, disabled, maxSizeMB, pathPrefix, putToStorage, onUploaded, toast],
  );

  const remove = useCallback(() => {
    setUrl('');
    onRemoved?.();
    toast({ title: 'Image removed', description: 'Save the form to apply.', variant: 'info' });
  }, [onRemoved, toast]);

  return (
    <div className={cn('space-y-2', className)}>
      <input type="hidden" name={name} value={url} />

      {url ? (
        <div className="space-y-2">
          <div
            className={cn(
              'relative overflow-hidden rounded-lg border border-border bg-surface-subtle',
              ASPECT_CLASS[aspect],
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Uploaded preview" className="h-full w-full object-contain" />
            {busy ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70">
                <Loader2 className="animate-spin text-brand" size={22} />
                <span className="text-xs font-medium text-ink">{progress}%</span>
              </div>
            ) : null}
          </div>
          {!disabled ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle disabled:opacity-50"
              >
                <RefreshCw size={13} /> Replace
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-danger/30 px-2.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !busy) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
            dragOver ? 'border-brand bg-brand-light/50' : 'border-border bg-surface-subtle hover:border-brand/50',
            (disabled || busy) && 'pointer-events-none opacity-60',
          )}
        >
          {busy ? (
            <>
              <UploadCloud size={20} className="text-brand" />
              <span className="text-sm font-medium text-ink">Uploading… {progress}%</span>
              <span className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-border">
                <span className="block h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
              </span>
            </>
          ) : (
            <>
              <ImagePlus size={20} className="text-ink-faint" />
              <span className="text-sm font-medium text-ink">Upload image</span>
              <span className="text-xs text-ink-faint">
                {helpText ?? `Click or drop a file · JPG, PNG or WebP · up to ${maxSizeMB} MB`}
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
