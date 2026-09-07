import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getCategoryOptions } from '@/lib/blog/queries';
import { BlogForm } from '../BlogForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New post · CampusEduX Admin' };

export default async function NewBlogPostPage() {
  const admin = await requireModule('blog');
  if (!admin.perms.blog.add) redirect('/blog');
  const categories = await getCategoryOptions();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/blog" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Blog
        </Link>
        <PageHeader title="New post" subtitle="Write the article, then publish it when it's ready. It stays a draft until you do." />
      </div>
      <BlogForm canEdit categories={categories} defaultAuthor={admin.fullName} />
    </div>
  );
}
