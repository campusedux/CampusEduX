import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { StatusPill } from '@/components/ui/primitives';
import { MarkdownPreview } from '@/components/learning/MarkdownPreview';
import { getBlogPost } from '@/lib/blog/queries';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Preview post · CampusEduX Admin', robots: { index: false } };

export default async function BlogPreviewPage({ params }: { params: { id: string } }) {
  await requireModule('blog');
  const post = await getBlogPost(params.id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/blog/${post.id}`} className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Back to editor
        </Link>
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <span>Admin preview — not the live page</span>
          <StatusPill status={post.status} />
        </div>
      </div>

      <article>
        <header className="border-b border-border pb-5">
          {post.category_name ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{post.category_name}</p>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold leading-tight text-ink">{post.title || 'Untitled post'}</h1>
          {post.excerpt ? <p className="mt-3 text-lg text-ink-muted">{post.excerpt}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
            <span className="font-medium text-ink">{post.author_name}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} className="text-ink-faint" />
              {post.published_at ? formatDate(post.published_at) : 'Not published'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-ink-faint" />
              {post.reading_time} min read
            </span>
          </div>
        </header>

        {post.featured_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featured_image}
            alt={post.featured_image_alt || post.title}
            className="mt-6 aspect-[16/9] w-full rounded-xl border border-border object-cover"
          />
        ) : null}

        <div className="mt-8">
          <MarkdownPreview source={post.content} />
        </div>

        {post.tags.length > 0 ? (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-5">
            {post.tags.map((t) => (
              <span key={t} className="rounded-lg bg-surface-subtle px-2 py-0.5 text-xs font-medium text-ink-muted">
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}
