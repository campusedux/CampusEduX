import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, EmptyState } from '@/components/ui/primitives';
import { getFeatureCategoriesWithCounts, listFeatureCategories } from '@/lib/custom-projects/queries';
import { CategoryManager } from './CategoryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Feature Categories · CampusEduX Admin' };

export default async function FeatureCategoriesPage() {
  const admin = await requireModule('custom_projects');
  const { missing } = await listFeatureCategories();
  const categories = missing ? [] : await getFeatureCategoriesWithCounts();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/custom-projects/features"
          className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={14} /> Feature catalog
        </Link>
        <PageHeader
          title="Feature categories"
          subtitle="Shared across Academic, Personal and Business features. Deleting is blocked while features still use one (spec §15)."
        />
      </div>

      {missing ? (
        <Card>
          <EmptyState
            title="Categories table isn’t available yet"
            description="Apply migration 0034, then reload."
          />
        </Card>
      ) : (
        <CategoryManager
          categories={categories}
          canAdd={admin.perms.custom_projects.add}
          canEdit={admin.perms.custom_projects.edit}
          canDelete={admin.perms.custom_projects.delete}
        />
      )}
    </div>
  );
}
