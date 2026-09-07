'use client';

import { useCallback, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Code2,
  Link2,
  Quote,
  Table,
  Eye,
  Pencil,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import { MarkdownPreview } from '@/components/learning/MarkdownPreview';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import {
  DEFAULT_MAX_IMAGE_MB,
  IMAGE_ACCEPT,
  compressImage,
  randomImageKey,
  validateImageFile,
} from '@/lib/storage/image';

type Wrap = { before: string; after?: string; block?: boolean; placeholder?: string };

const TOOLS: { icon: typeof Bold; label: string; wrap: Wrap }[] = [
  { icon: Bold, label: 'Bold', wrap: { before: '**', after: '**', placeholder: 'bold text' } },
  { icon: Italic, label: 'Italic', wrap: { before: '_', after: '_', placeholder: 'italic text' } },
  { icon: Heading2, label: 'Heading', wrap: { before: '## ', block: true, placeholder: 'Heading' } },
  { icon: Heading3, label: 'Sub-heading', wrap: { before: '### ', block: true, placeholder: 'Sub-heading' } },
  { icon: List, label: 'Bullet list', wrap: { before: '- ', block: true, placeholder: 'list item' } },
  { icon: ListOrdered, label: 'Numbered list', wrap: { before: '1. ', block: true, placeholder: 'list item' } },
  { icon: Code, label: 'Inline code', wrap: { before: '`', after: '`', placeholder: 'code' } },
  {
    icon: Code2,
    label: 'Code block',
    wrap: { before: '```\n', after: '\n```', block: true, placeholder: 'code' },
  },
  { icon: Link2, label: 'Link', wrap: { before: '[', after: '](https://)', placeholder: 'link text' } },
  { icon: Quote, label: 'Quote', wrap: { before: '> ', block: true, placeholder: 'quotation' } },
  {
    icon: Table,
    label: 'Table',
    wrap: {
      before: '| Column A | Column B |\n| --- | --- |\n| a1 | b1 |\n| a2 | b2 |\n',
      block: true,
    },
  },
];

/**
 * Markdown authoring textarea with an insert toolbar and a Write / Preview
 * toggle. Emits a plain <textarea name={name}> so it drops straight into a
 * <form action={serverAction}>. `onDirty` lets the parent show an unsaved
 * warning.
 *
 * Pass `imageUpload` to add an "Insert image" button: it validates + downscales
 * the file to WebP client-side, uploads it to Storage as the signed-in admin,
 * and inserts an `![alt](publicUrl)` at the caret. Omit it and the toolbar is
 * unchanged (the Learning content editor does not set it).
 */
export function MarkdownEditor({
  name,
  defaultValue = '',
  disabled,
  minRows = 12,
  onDirty,
  imageUpload,
}: {
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  minRows?: number;
  onDirty?: (dirty: boolean) => void;
  imageUpload?: { bucket: string; pathPrefix: string };
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const update = (next: string) => {
    setValue(next);
    onDirty?.(next !== defaultValue);
  };

  const spliceAtCaret = useCallback(
    (text: string, caretBackBy = 0) => {
      const el = ref.current;
      const start = el ? el.selectionStart : value.length;
      const end = el ? el.selectionEnd : value.length;
      const next = value.slice(0, start) + text + value.slice(end);
      update(next);
      requestAnimationFrame(() => {
        el?.focus();
        const caret = start + text.length - caretBackBy;
        el?.setSelectionRange(caret, caret);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value],
  );

  const insert = (w: Wrap) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || w.placeholder || '';
    let insertText = `${w.before}${selected}${w.after ?? ''}`;
    const prefix = value.slice(0, start);
    if (w.block && prefix && !prefix.endsWith('\n\n')) {
      insertText = (prefix.endsWith('\n') ? '\n' : '\n\n') + insertText;
    }
    const next = prefix + insertText + value.slice(end);
    update(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = prefix.length + insertText.length - (w.after?.length ?? 0);
      el.setSelectionRange(caret, caret);
    });
  };

  const handleImageFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file || !imageUpload || uploading) return;
      const check = validateImageFile(file, DEFAULT_MAX_IMAGE_MB);
      if (!check.ok) {
        toast({ title: 'Invalid image', description: check.error, variant: 'error' });
        return;
      }
      setUploading(true);
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error('Your session expired — sign in again and retry.');
        const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (!base) throw new Error('Storage is not configured.');

        const prepared = await compressImage(file);
        const prefix = imageUpload.pathPrefix.replace(/^\/+|\/+$/g, '');
        const path = `${prefix}/${randomImageKey(prepared.ext)}`;
        const endpoint = `${base}/storage/v1/object/${imageUpload.bucket}/${path
          .split('/')
          .map(encodeURIComponent)
          .join('/')}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${session.access_token}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
            'x-upsert': 'true',
            'cache-control': '3600',
            'content-type': prepared.contentType,
          },
          body: prepared.blob,
        });
        if (!res.ok) {
          throw new Error(res.status === 403 ? 'You do not have permission to upload here.' : `Upload failed (${res.status}).`);
        }
        const publicUrl = supabase.storage.from(imageUpload.bucket).getPublicUrl(path).data.publicUrl;
        const alt = file.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim() || 'image';
        spliceAtCaret(`\n\n![${alt}](${publicUrl})\n\n`);
        toast({ title: 'Image inserted', description: prepared.compressed ? 'Optimised to WebP.' : undefined, variant: 'success' });
      } catch (e) {
        toast({ title: 'Upload failed', description: (e as Error).message, variant: 'error' });
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    },
    [imageUpload, uploading, toast, spliceAtCaret],
  );

  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-subtle/50 p-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.label}
            disabled={disabled || mode === 'preview'}
            onClick={() => insert(t.wrap)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-white hover:text-ink disabled:opacity-40"
          >
            <t.icon size={15} />
          </button>
        ))}
        {imageUpload ? (
          <button
            type="button"
            title="Insert image"
            disabled={disabled || mode === 'preview' || uploading}
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-white hover:text-ink disabled:opacity-40"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
          </button>
        ) : null}
        <div className="ml-auto flex overflow-hidden rounded-md border border-border">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={cn('inline-flex h-8 items-center gap-1 px-2.5 text-xs font-medium', mode === 'write' ? 'bg-brand text-white' : 'bg-white text-ink-muted')}
          >
            <Pencil size={13} /> Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={cn('inline-flex h-8 items-center gap-1 px-2.5 text-xs font-medium', mode === 'preview' ? 'bg-brand text-white' : 'bg-white text-ink-muted')}
          >
            <Eye size={13} /> Preview
          </button>
        </div>
      </div>

      {mode === 'write' ? (
        <textarea
          ref={ref}
          name={name}
          value={value}
          disabled={disabled}
          onChange={(e) => update(e.target.value)}
          rows={minRows}
          spellCheck
          className="block w-full resize-y rounded-b-lg border-0 bg-white px-3 py-2 font-mono text-[13px] leading-relaxed text-ink focus:outline-none focus:ring-0"
          placeholder="Write in Markdown — # headings, **bold**, - lists, ```code```, tables…"
        />
      ) : (
        <>
          <input type="hidden" name={name} value={value} />
          <div className="max-h-[520px] overflow-y-auto p-4 text-sm">
            {value.trim() ? (
              <MarkdownPreview source={value} />
            ) : (
              <p className="text-ink-faint">Nothing to preview yet.</p>
            )}
          </div>
        </>
      )}

      {imageUpload ? (
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_ACCEPT}
          className="hidden"
          onChange={(e) => handleImageFile(e.target.files?.[0])}
        />
      ) : null}
    </div>
  );
}
