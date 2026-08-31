import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { listFeatureCategories, listFeatureOptions } from '@/lib/custom-projects/queries';
import { FEATURE_CATEGORIES } from '@/lib/custom-projects/constants';
import { FeatureForm } from '../FeatureForm';
import { createFeature } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Feature · CampusEduX Admin' };

export default async function NewFeaturePage() {
  const admin = await requireModule('custom_projects');
  if (!admin.perms.custom_projects.add) redirect('/custom-projects/features?error=no_access');

  const [{ rows: catRows }, featureOptions] = await Promise.all([
    listFeatureCategories({ activeOnly: true }),
    listFeatureOptions(),
  ]);
  const categories = catRows.length
    ? catRows.map((c) => ({ id: c.id, name: c.name }))
    : FEATURE_CATEGORIES.map((c) => ({ id: c, name: c }));

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
          title="Add feature"
          subtitle="It becomes selectable in the mobile builder for the chosen project types and level."
        />
      </div>
      <FeatureForm
        mode="create"
        action={createFeature}
        cancelHref="/custom-projects/features"
        categories={categories}
        featureOptions={featureOptions.map((f) => ({ id: f.id, name: f.name, category: f.category }))}
      />
    </div>
  );
}
