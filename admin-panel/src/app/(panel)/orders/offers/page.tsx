import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getOffers } from '@/lib/orders/queries';
import { OfferManager } from './OfferManager';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Offers · CampusEduX Admin' };

export default async function OffersPage() {
  const admin = await requireModule('orders');
  const offers = await getOffers();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/orders" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Orders
        </Link>
        <PageHeader title="Offers" subtitle="Site-wide promotions shown in the app, ordered by priority." />
      </div>
      <OfferManager offers={offers} perms={admin.perms.orders} />
    </div>
  );
}
