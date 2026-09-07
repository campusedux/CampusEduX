import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/primitives';
import { listBlogCategories } from '@/lib/blog/queries';
import { CategoryManager } from './CategoryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog categories · CampusEduX Admin' };

export default async function BlogCategoriesPage() {
  const admin = await requireModule('blog');
  const categories = await listBlogCategories();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/blog" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Blog
        </Link>
        <PageHeader title="Blog categories" subtitle="Group articles on the website. Renaming a category updates it on every post that uses it." />
      </div>
      {categories.length === 0 && !admin.perms.blog.add ? (
        <EmptyState title="No categories yet" description="Apply migration 037_blog.sql, or ask an editor to add one." />
      ) : (
        <CategoryManager categories={categories} perms={admin.perms.blog} />
      )}
    </div>
  );
}
