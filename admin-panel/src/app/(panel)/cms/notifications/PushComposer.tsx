'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, Textarea } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/toast';
import { AUDIENCES, PUSH_CATEGORIES } from '@/lib/cms/constants';
import { sendPushNotification } from '../actions';

type Result = { ok: boolean; error?: string };

export function PushComposer() {
  const [state, action] = useFormState(sendPushNotification, { ok: false } as Result);
  const { toast } = useToast();
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const seen = useRef(state);
  // Bumping this key remounts the ImageUploader so its preview clears after a send.
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not send', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Notification sent', variant: 'success' });
      ref.current?.reset();
      setFormKey((k) => k + 1);
      router.refresh();
    }
  }, [state, toast, router]);

  return (
    <Card>
      <CardHeader
        title="Compose notification"
        description="Sends immediately to every matching student’s in-app inbox. An image shows in the notification list where the platform supports it."
      />
      <form ref={ref} action={action} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue="updates">
                {PUSH_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="target_audience">Audience</Label>
              <Select id="target_audience" name="target_audience" defaultValue="all">
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="body">Body</Label>
          <Textarea id="body" name="body" rows={3} />
        </div>
        <div>
          <Label>Image (optional)</Label>
          <ImageUploader
            key={formKey}
            name="image_url"
            bucket="admin-media"
            pathPrefix="notifications"
            aspect="wide"
            helpText="JPG, PNG or WebP · attached to the notification"
          />
        </div>
        <div className="flex justify-end">
          <div className="w-36">
            <SubmitButton pendingLabel="Sending…">Send now</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}
