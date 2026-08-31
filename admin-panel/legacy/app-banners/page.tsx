import Link from 'next/link';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { BannerRowActions } from '@/app/banners/BannerRowActions';

export const dynamic = 'force-dynamic';

export default async function BannersPage() {
  const supabase = createClient();
  const { data: banners, error } = await supabase.from('banners').select('*').order('sort_order');
  if (error) throw new Error(error.message);

  const publicUrl = (path: string) => supabase.storage.from('banners').getPublicUrl(path).data.publicUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Banners</h1>
          <p className="text-sm text-ink-muted">Home, category, and checkout promotional banners</p>
        </div>
        <Link href="/banners/new">
          <Button>
            <Plus size={16} /> New banner
          </Button>
        </Link>
      </div>

      <Card>
        {!banners || banners.length === 0 ? (
          <EmptyState title="No banners yet" />
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {banners.map((banner) => (
              <div key={banner.id} className="overflow-hidden rounded-lg border border-border">
                <div className="relative aspect-[2/1] bg-surface-subtle">
                  <Image src={publicUrl(banner.image_storage_path)} alt={banner.title} fill className="object-cover" unoptimized />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink">{banner.title}</p>
                    <Badge label={banner.is_active ? 'Active' : 'Inactive'} tone={banner.is_active ? 'success' : 'neutral'} />
                  </div>
                  <p className="mt-1 text-xs text-ink-faint">{banner.placement.replace('_', ' ')}</p>
                  <div className="mt-2">
                    <BannerRowActions bannerId={banner.id} isActive={banner.is_active} storagePath={banner.image_storage_path} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
