import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { getCustomRequest } from '@/lib/custom-projects/queries';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/primitives';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { formatDate } from '@/lib/utils';
import { DELIVERY_ASSET_LABEL, type DeliveryAssetKind } from '@/lib/custom-projects/constants';
import { DeliveryDetailsForm, DeliveryAssetUploader } from './DeliveryForm';
import { removeDeliveryAsset } from '../../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Custom Project Delivery · CampusEduX Admin' };

export default async function DeliveryPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('custom_projects');
  if (!admin.perms.custom_projects.edit) redirect(`/custom-projects/${params.id}?error=no_access`);
  const data = await getCustomRequest(params.id);
  if (!data) notFound();

  const { request: r, delivery, deliveryUrls } = data;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href={`/custom-projects/${r.id}`}
          className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={14} /> {r.request_code}
        </Link>
        <PageHeader
          title="Delivery"
          subtitle={`${r.title} — upload the finished project. It reaches the student once you set the status to Delivered.`}
        />
      </div>

      <Card>
        <CardHeader title="Delivery details" />
        <DeliveryDetailsForm requestId={r.id} initial={{ demo_url: delivery?.demo_url ?? null, notes: delivery?.notes ?? '' }} />
      </Card>

      <Card>
        <CardHeader title="Add files" />
        <DeliveryAssetUploader requestId={r.id} studentId={r.user_id} />
      </Card>

      <Card>
        <CardHeader title="Uploaded assets" description={`${delivery?.assets.length ?? 0} file(s)`} />
        {!delivery || delivery.assets.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {delivery.assets.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{a.label || a.file_name}</p>
                  <p className="text-xs text-ink-faint">
                    {DELIVERY_ASSET_LABEL[a.kind as DeliveryAssetKind] ?? a.kind}
                    {a.size_mb ? ` · ${Number(a.size_mb).toFixed(2)} MB` : ''}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {deliveryUrls[a.storage_path] ? (
                    <a
                      href={deliveryUrls[a.storage_path]}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline"
                    >
                      Open
                    </a>
                  ) : null}
                  <DeleteButton
                    action={removeDeliveryAsset.bind(null, r.id, a.id, a.storage_path)}
                    confirmMessage={`Remove "${a.label || a.file_name}"?`}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
