'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Info } from 'lucide-react';
import { Label, Input, Textarea, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { UploadDropzone } from '@/components/ui/UploadDropzone';
import { useToast } from '@/components/ui/toast';
import { addDeliveryAssets, saveDelivery, saveAndDeliver } from '../../actions';
import { DELIVERY_ASSET_KINDS, DELIVERY_ASSET_LABEL, DELIVERY_SLOTS } from '@/lib/custom-projects/constants';

type Result = { ok: boolean; error?: string };

/**
 * Bug 4: has both the original "Save details" (no status change — lets the admin save partial
 * progress without delivering) and the new combined "Save & Deliver". Fields are controlled so both
 * buttons submit the same current values from one form. custom_project_set_status() is the actual
 * "at least one deliverable" enforcement point (migration 0125/097) — this component just surfaces
 * whatever error it returns.
 */
export function DeliveryDetailsForm({
  requestId,
  initial,
  hasDeliverable,
}: {
  requestId: string;
  initial: { demo_url: string | null; notes: string };
  hasDeliverable: boolean;
}) {
  const [demoUrl, setDemoUrl] = useState(initial.demo_url ?? '');
  const [notes, setNotes] = useState(initial.notes);
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function fd() {
    const f = new FormData();
    f.set('demo_url', demoUrl);
    f.set('notes', notes);
    return f;
  }

  const runSave = () =>
    start(async () => {
      const res = await saveDelivery(requestId, { ok: false }, fd());
      if (!res.ok) toast({ title: 'Could not save', description: res.error, variant: 'error' });
      else {
        toast({ title: 'Delivery saved', variant: 'success' });
        router.refresh();
      }
    });

  const runSaveAndDeliver = () =>
    start(async () => {
      const res = await saveAndDeliver(requestId, { ok: false }, fd());
      if (!res.ok) toast({ title: 'Could not deliver', description: res.error, variant: 'error' });
      else {
        toast({ title: 'Delivered to the student', variant: 'success' });
        router.refresh();
      }
    });

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-card border border-border bg-surface-subtle p-3 text-xs text-ink-muted">
        <Info size={14} className="mt-0.5 flex-shrink-0" />
        <p>
          Files and the demo URL stay hidden from the student until this request is marked{' '}
          <span className="font-medium text-ink">Delivered</span>.
        </p>
      </div>
      <div>
        <Label htmlFor="demo_url">Demo URL (optional)</Label>
        <Input id="demo_url" name="demo_url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div>
        <Label htmlFor="notes">Delivery notes (shown to the student)</Label>
        <Textarea id="notes" name="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={runSave} disabled={pending}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : null} Save details
        </Button>
        <Button type="button" onClick={runSaveAndDeliver} disabled={pending} title={!hasDeliverable ? 'Add a demo URL or at least one file first' : undefined}>
          {pending ? <Loader2 size={14} className="animate-spin" /> : null} Save &amp; Deliver
        </Button>
      </div>
      {!hasDeliverable && (
        <p className="text-right text-xs text-ink-faint">Add a demo URL or at least one file below before delivering.</p>
      )}
    </div>
  );
}

/** The three dedicated slots (Bug 4): Source Code ZIP, PDF, PPT — one file each, kind fixed. */
export function DeliverySlotUploaders({ requestId, studentId }: { requestId: string; studentId: string }) {
  return (
    <div className="space-y-4">
      {DELIVERY_SLOTS.map((slot) => (
        <div key={slot.kind}>
          <Label>{slot.label}</Label>
          <div className="mt-1">
            <UploadDropzone
              bucket="custom-project-deliveries"
              pathPrefix={`${studentId}/${requestId}`}
              accept={slot.accept}
              maxSizeBytes={slot.maxSizeBytes}
              hint={`${slot.extensions.join('/')} · up to ${(slot.maxSizeBytes / (1024 * 1024)).toFixed(0)} MB`}
              action={(files) => addDeliveryAssets(requestId, slot.kind, slot.label, files) as Promise<Result>}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The original flexible uploader — screenshots, APK, extra docs/demos, or anything else. */
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
        hint="Screenshots, APK, extra docs or demos — uploaded to the student's private folder"
        action={(files) => addDeliveryAssets(requestId, kind, label, files) as Promise<Result>}
      />
    </div>
  );
}
