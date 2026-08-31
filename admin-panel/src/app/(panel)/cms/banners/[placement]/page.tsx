import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getBanners } from '@/lib/cms/queries';
import { BANNER_PLACEMENTS, BANNER_PLACEMENT_LABEL } from '@/lib/cms/constants';
import { BannerManager } from './BannerManager';

export const dynamic = 'force-dynamic';

export default async function BannerPlacementPage({ params }: { params: { placement: string } }) {
  const admin = await requireModule('cms');
  if (!BANNER_PLACEMENTS.includes(params.placement as any)) notFound();
  const banners = await getBanners(params.placement);
  const label = BANNER_PLACEMENT_LABEL[params.placement];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href="/cms" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Banner & CMS
        </Link>
        <PageHeader
          title={label}
          subtitle={
            params.placement === 'popup'
              ? 'Popups with per-page "Display On" targeting.'
              : `Rotating ${params.placement} banners — image, title, audience, status and priority.`
          }
        />
      </div>
      <BannerManager placement={params.placement} banners={banners} perms={admin.perms.cms} />
    </div>
  );
}
