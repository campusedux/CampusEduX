'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/toast';
import { AUDIENCES, DISPLAY_ON_PAGES } from '@/lib/cms/constants';
import { createBanner, updateBanner, deleteBanner } from '../../actions';

type Result = { ok: boolean; error?: string };
interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  target_url: string | null;
  target_audience: string;
  display_on: string[];
  status: string;
  priority: number;
}

const toLocal = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : '');

function useSaveToast(state: Result, reset?: () => void) {
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Saved', variant: 'success' });
      reset?.();
      router.refresh();
    }
  }, [state, toast, router, reset]);
}

export function BannerManager({
  placement,
  banners,
  perms,
}: {
  placement: string;
  banners: Banner[];
  perms: { add: boolean; edit: boolean; delete: boolean };
}) {
  const isPopup = placement === 'popup';
  return (
    <div className="space-y-5">
      {perms.add ? <AddForm placement={placement} isPopup={isPopup} /> : null}
      <Card>
        <CardHeader title={`Banners (${banners.length})`} />
        {banners.length === 0 ? (
          <EmptyState title="No banners" />
        ) : (
          <div className="space-y-3">
            {banners.map((b) => (
              <Row key={b.id} banner={b} placement={placement} isPopup={isPopup} perms={perms} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Fields({ b, isPopup, disabled, placement }: { b?: Banner; isPopup: boolean; disabled?: boolean; placement: string }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input name="title" required defaultValue={b?.title ?? ''} disabled={disabled} />
        </div>
        <div>
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input name="subtitle" defaultValue={b?.subtitle ?? ''} disabled={disabled} />
        </div>
        <div className="sm:col-span-2">
          <Label>Banner image</Label>
          <ImageUploader
            name="image_url"
            bucket="banners"
            pathPrefix={placement}
            defaultValue={b?.image_url ?? ''}
            disabled={disabled}
            aspect="wide"
            helpText="JPG, PNG or WebP · shown in the app carousel / popup"
          />
        </div>
        <div>
          <Label htmlFor="target_url">Target URL</Label>
          <Input name="target_url" defaultValue={b?.target_url ?? ''} placeholder="deeplink or https://…" disabled={disabled} />
        </div>
        <div>
          <Label htmlFor="target_audience">Target audience</Label>
          <Select name="target_audience" defaultValue={b?.target_audience ?? 'all'} disabled={disabled}>
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={b?.status ?? 'active'} disabled={disabled}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="scheduled">Scheduled</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Input name="priority" type="number" defaultValue={b?.priority ?? 0} disabled={disabled} />
          </div>
        </div>
        <div>
          <Label htmlFor="starts_at">Starts</Label>
          <Input name="starts_at" type="datetime-local" defaultValue={toLocal((b as any)?.starts_at)} disabled={disabled} />
        </div>
        <div>
          <Label htmlFor="ends_at">Ends</Label>
          <Input name="ends_at" type="datetime-local" defaultValue={toLocal((b as any)?.ends_at)} disabled={disabled} />
        </div>
      </div>
      {isPopup ? (
        <div className="mt-3">
          <Label htmlFor="display_on">Display on pages</Label>
          <div className="flex flex-wrap gap-3">
            {DISPLAY_ON_PAGES.map((pg) => (
              <label key={pg} className="flex items-center gap-1.5 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  name="display_on"
                  value={pg}
                  defaultChecked={b?.display_on?.includes(pg)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-border text-brand"
                />
                {pg}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function AddForm({ placement, isPopup }: { placement: string; isPopup: boolean }) {
  const [state, action] = useFormState(createBanner.bind(null, placement), { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="Add banner" />
      <form ref={ref} action={action} className="space-y-3">
        <Fields isPopup={isPopup} placement={placement} />
        <div className="flex justify-end">
          <div className="w-28">
            <SubmitButton pendingLabel="…">Add</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Row({
  banner,
  placement,
  isPopup,
  perms,
}: {
  banner: Banner;
  placement: string;
  isPopup: boolean;
  perms: { edit: boolean; delete: boolean };
}) {
  const [state, action] = useFormState(updateBanner.bind(null, banner.id, placement), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center gap-3">
        {banner.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.image_url} alt="" className="h-12 w-24 rounded object-cover" />
        ) : (
          <div className="flex h-12 w-24 items-center justify-center rounded bg-surface-subtle text-xs text-ink-faint">No image</div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">{banner.title}</p>
          <Badge label={banner.status} tone={banner.status === 'active' ? 'success' : banner.status === 'scheduled' ? 'info' : 'neutral'} />
        </div>
        {perms.delete ? <DeleteButton action={() => deleteBanner(banner.id, placement)} confirmMessage={`Delete "${banner.title}"?`} /> : null}
      </div>
      <form action={action} className="space-y-3">
        <Fields b={banner} isPopup={isPopup} disabled={!perms.edit} placement={placement} />
        {perms.edit ? (
          <div className="flex justify-end">
            <div className="w-20">
              <SubmitButton pendingLabel="…">Save</SubmitButton>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
