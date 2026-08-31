import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getAptitudeTopics, getDsaTopics } from '@/lib/placement/queries';
import { PlacementCategoryManager } from './CategoryManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Placement Categories · CampusEduX Admin' };

export default async function PlacementCategoriesPage() {
  const admin = await requireModule('placement');
  const [aptTopics, dsaTopics] = await Promise.all([getAptitudeTopics(), getDsaTopics()]);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Categories" subtitle="Topics that group the aptitude and DSA question banks." />
      <PlacementCategoryManager aptTopics={aptTopics} dsaTopics={dsaTopics} perms={admin.perms.placement} />
    </div>
  );
}
