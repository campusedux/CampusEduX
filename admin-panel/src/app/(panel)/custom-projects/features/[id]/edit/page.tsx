import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { FeatureForm } from '../../FeatureForm';
import { getFeature, listFeatureCategories, listFeatureOptions } from '@/lib/custom-projects/queries';
import { FEATURE_CATEGORIES } from '@/lib/custom-projects/constants';
import { updateFeature } from '../../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Feature · CampusEduX Admin' };

export default async function EditFeaturePage({ params }: { params: { id: string } }) {
  const admin = await requireModule('custom_projects');
  if (!admin.perms.custom_projects.edit) redirect('/custom-projects/features?error=no_access');

  const [feature, { rows: catRows }, featureOptions] = await Promise.all([
    getFeature(params.id),
    listFeatureCategories({ activeOnly: true }),
    listFeatureOptions(params.id),
  ]);
  if (!feature) notFound();

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
        <PageHeader title="Edit feature" subtitle={feature.id} />
      </div>
      <FeatureForm
        mode="edit"
        action={updateFeature.bind(null, params.id)}
        categories={categories}
        featureOptions={featureOptions.map((f) => ({ id: f.id, name: f.name, category: f.category }))}
        initial={{
          name: feature.name,
          key: feature.id,
          description: feature.description,
          category: feature.category,
          project_types: feature.project_types ?? [],
          project_levels: feature.project_levels ?? [],
          level: (feature.level as string) ?? 'standard',
          price: Number(feature.price) || 0,
          icon: (feature.icon as string | null) ?? null,
          image_url: (feature.image_url as string | null) ?? null,
          dependencies: (feature.dependencies as string[] | null) ?? [],
          sort_order: feature.sort_order,
          is_active: feature.is_active,
        }}
        cancelHref="/custom-projects/features"
      />
    </div>
  );
}
