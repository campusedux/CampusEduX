'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';

type Result = { ok: boolean; error?: string };

/**
 * Lightweight content editor for Terms / Privacy. Stores raw text (Markdown or
 * HTML) — a heavy WYSIWYG lib would need a CDN allow-listed bundle; this keeps
 * it dependency-free with a live plain-text preview.
 */
export function PageEditor({
  page,
  action,
  canEdit,
}: {
  page: { key: string; title: string; content: string; updated_at: string };
  action: (prev: Result, fd: FormData) => Promise<Result>;
  canEdit: boolean;
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const [content, setContent] = useState(page.content ?? '');
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Content saved', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <Card>
      <CardHeader
        title={page.title}
        description={page.updated_at ? `Last updated ${formatDateTime(page.updated_at)}` : 'Not published yet'}
      />
      <form action={formAction} className="space-y-3">
        <div>
          <Label htmlFor={`title-${page.key}`}>Page title</Label>
          <Input id={`title-${page.key}`} name="title" defaultValue={page.title} disabled={!canEdit} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <Label htmlFor={`content-${page.key}`}>Content (Markdown / HTML)</Label>
            <Textarea
              id={`content-${page.key}`}
              name="content"
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!canEdit}
              className="font-mono text-xs"
            />
          </div>
          <div>
            <Label>Preview</Label>
            <div className="h-[calc(100%-1.75rem)] min-h-[16rem] overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-surface-subtle p-3 text-sm text-ink-muted">
              {content || 'Nothing yet.'}
            </div>
          </div>
        </div>
        {canEdit ? (
          <div className="flex justify-end">
            <div className="w-40">
              <SubmitButton pendingLabel="Saving…">Save content</SubmitButton>
            </div>
          </div>
        ) : null}
      </form>
    </Card>
  );
}
