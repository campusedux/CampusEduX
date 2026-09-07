'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Card, CardHeader, Section, Label, Input, Textarea, Select } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { MarkdownEditor } from '@/components/learning/MarkdownEditor';
import { useToast } from '@/components/ui/toast';
import { SlugField } from '@/app/(panel)/learning/_components/FormFields';
import {
  BLOG_BUCKET,
  BLOG_PATH_PREFIX,
  BLOG_STATUSES,
  BLOG_STATUS_LABEL,
} from '@/lib/blog/constants';
import type { BlogPost } from '@/lib/blog/queries';
import { createPost, updatePost } from './actions';

type Result = { ok: boolean; error?: string; id?: string };

/** ISO → the `YYYY-MM-DDTHH:mm` a <input type="datetime-local"> expects (local time). */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function BlogForm({
  post,
  canEdit,
  categories,
  defaultAuthor,
}: {
  post?: BlogPost;
  canEdit: boolean;
  categories: { id: string; name: string }[];
  defaultAuthor: string;
}) {
  const isEdit = Boolean(post);
  const action = isEdit ? updatePost.bind(null, post!.id) : createPost;
  const [state, formAction] = useFormState(action as never, { ok: false } as Result);
  const router = useRouter();
  const { toast } = useToast();
  const seen = useRef(state);

  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: isEdit ? 'Post saved' : 'Post created', variant: 'success' });
      if (!isEdit && state.id) router.push(`/blog/${state.id}`);
      else router.refresh();
    }
  }, [state, isEdit, router, toast]);

  return (
    <form action={formAction} className="space-y-6">
      <fieldset disabled={!canEdit} className="space-y-6">
        <Card>
          <CardHeader title="Article" description="The title, URL and body. The body is Markdown — use the toolbar for headings, lists, tables, quotes and images." />
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_260px]">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input name="title" required defaultValue={post?.title ?? ''} placeholder="What is Artificial Intelligence?" />
              </div>
              <SlugField defaultValue={post?.slug} from="title" />
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                name="excerpt"
                rows={2}
                defaultValue={post?.excerpt ?? ''}
                placeholder="One or two sentences shown on the blog card and used as the meta description. Leave blank to auto-generate from the body."
              />
            </div>

            <div>
              <Label>Content</Label>
              <MarkdownEditor
                name="content"
                defaultValue={post?.content ?? ''}
                disabled={!canEdit}
                minRows={20}
                imageUpload={{ bucket: BLOG_BUCKET, pathPrefix: `${BLOG_PATH_PREFIX}/content` }}
              />
            </div>
          </div>
        </Card>

        <Section title="Featured image" description="Shown at the top of the article and on every blog card. Use a wide (16:9) image; it is downscaled to WebP on upload.">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,320px)_1fr]">
            <ImageUploader
              name="featured_image"
              bucket={BLOG_BUCKET}
              pathPrefix={`${BLOG_PATH_PREFIX}/featured`}
              defaultValue={post?.featured_image ?? ''}
              disabled={!canEdit}
              aspect="video"
              helpText="Click or drop a file · JPG, PNG or WebP · wide 16:9"
            />
            <div>
              <Label htmlFor="featured_image_alt">Image alt text</Label>
              <Input
                name="featured_image_alt"
                defaultValue={post?.featured_image_alt ?? ''}
                placeholder="Describe the image for screen readers and search engines."
              />
              <p className="mt-1 text-xs text-ink-faint">Required for accessibility whenever a featured image is set.</p>
            </div>
          </div>
        </Section>

        <Section title="Details">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="author_name">Author</Label>
              <Input name="author_name" defaultValue={post?.author_name || defaultAuthor} placeholder="CampusEduX Team" />
            </div>
            <div>
              <Label htmlFor="category_id">Category</Label>
              <Select name="category_id" defaultValue={post?.category_id ?? ''}>
                <option value="">— No category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="mt-3">
            <Label htmlFor="tags">Tags</Label>
            <Input
              name="tags"
              defaultValue={(post?.tags ?? []).join(', ')}
              placeholder="artificial intelligence, machine learning, beginners"
            />
            <p className="mt-1 text-xs text-ink-faint">Comma-separated. Used for the blog tag filter and article keywords.</p>
          </div>
        </Section>

        <Section title="Publishing" description="A post is only visible on the website when its status is Published and its publish date is in the past.">
          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={post?.status ?? 'draft'}>
                {BLOG_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {BLOG_STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="published_at">Publish date &amp; time</Label>
              <Input type="datetime-local" name="published_at" defaultValue={toLocalInput(post?.published_at ?? null)} />
              <p className="mt-1 text-xs text-ink-faint">
                Leave blank and set status to Published to go live now. A future date schedules the post.
              </p>
            </div>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" name="is_featured" defaultChecked={post?.is_featured ?? false} className="h-4 w-4 rounded border-border text-brand" />
            Feature this post at the top of the blog
          </label>
        </Section>

        <Section title="SEO" description="Optional overrides. When blank, the title and excerpt above are used.">
          <div className="space-y-3">
            <div>
              <Label htmlFor="seo_title">SEO title</Label>
              <Input name="seo_title" defaultValue={post?.seo_title ?? ''} placeholder="Defaults to the article title" />
            </div>
            <div>
              <Label htmlFor="seo_description">SEO description</Label>
              <Textarea name="seo_description" rows={2} defaultValue={post?.seo_description ?? ''} placeholder="Defaults to the excerpt" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="seo_keywords">SEO keywords</Label>
                <Input name="seo_keywords" defaultValue={post?.seo_keywords ?? ''} placeholder="Defaults to the tags" />
              </div>
              <div>
                <Label htmlFor="canonical_url">Canonical URL</Label>
                <Input name="canonical_url" type="url" defaultValue={post?.canonical_url ?? ''} placeholder="Only if this content lives elsewhere" />
              </div>
            </div>
          </div>
        </Section>

        {canEdit ? (
          <div className="flex items-center justify-end gap-3">
            {isEdit ? (
              <Link
                href={`/blog/${post!.id}/preview`}
                target="_blank"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
              >
                <Eye size={15} /> Preview
              </Link>
            ) : null}
            <div className="w-40">
              <SubmitButton pendingLabel="Saving…">{isEdit ? 'Save post' : 'Create post'}</SubmitButton>
            </div>
          </div>
        ) : null}
      </fieldset>
    </form>
  );
}
