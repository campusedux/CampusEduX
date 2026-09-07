import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/primitives';
import { getBlogPost, getCategoryOptions } from '@/lib/blog/queries';
import { BlogForm } from '../BlogForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit post · CampusEduX Admin' };

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('blog');
  const [post, categories] = await Promise.all([getBlogPost(params.id), getCategoryOptions()]);
  if (!post) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/blog" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Blog
        </Link>
        <PageHeader
          title={post.title || 'Untitled post'}
          subtitle={`/blog/${post.slug} · ${post.reading_time} min read`}
          action={<StatusPill status={post.status} />}
        />
      </div>
      <BlogForm post={post} canEdit={admin.perms.blog.edit} categories={categories} defaultAuthor={admin.fullName} />
    </div>
  );
}
