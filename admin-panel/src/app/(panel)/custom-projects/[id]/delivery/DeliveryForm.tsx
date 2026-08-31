'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Label, Input, Textarea, Select } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { UploadDropzone } from '@/components/ui/UploadDropzone';
import { useToast } from '@/components/ui/toast';
import { addDeliveryAssets, saveDelivery } from '../../actions';
import { DELIVERY_ASSET_KINDS, DELIVERY_ASSET_LABEL } from '@/lib/custom-projects/constants';

type Result = { ok: boolean; error?: string };

export function DeliveryDetailsForm({
  requestId,
  initial,
}: {
  requestId: string;
  initial: { demo_url: string | null; notes: string };
}) {
  const [state, formAction] = useFormState(saveDelivery.bind(null, requestId), { ok: false });
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Delivery saved', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="demo_url">Demo URL</Label>
        <Input id="demo_url" name="demo_url" defaultValue={initial.demo_url ?? ''} placeholder="https://…" />
      </div>
      <div>
        <Label htmlFor="notes">Delivery notes (shown to the student)</Label>
        <Textarea id="notes" name="notes" rows={3} defaultValue={initial.notes} />
      </div>
      <div className="flex justify-end">
        <div className="w-36">
          <SubmitButton pendingLabel="Saving…">Save delivery</SubmitButton>
        </div>
      </div>
    </form>
  );
}

export function DeliveryAssetUploader({
  requestId,
  studentId,
}: {
  requestId: string;
  studentId: string;
}) {
  const [kind, setKind] = useState<string>('screenshot');
  const [label, setLabel] = useState('');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <label className="text-xs text-ink-muted">
          Kind
          <Select value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 w-44">
            {DELIVERY_ASSET_KINDS.map((k) => (
              <option key={k} value={k}>
                {DELIVERY_ASSET_LABEL[k]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex-1 text-xs text-ink-muted">
          Label (optional)
          <Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" placeholder="e.g. Home screen" />
        </label>
      </div>
      <UploadDropzone
        bucket="custom-project-deliveries"
        pathPrefix={`${studentId}/${requestId}`}
        multiple
        hint="Screenshots, APK, source zip, docs — uploaded to the student's private folder"
        action={(files) => addDeliveryAssets(requestId, kind, label, files) as Promise<Result>}
      />
    </div>
  );
}
