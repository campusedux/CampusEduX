'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Section, Label, Input } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/toast';
import { saveGeneralSettings } from './actions';

type Result = { ok: boolean; error?: string };

export function GeneralSettingsForm({ settings, canEdit }: { settings: any; canEdit: boolean }) {
  const [state, formAction] = useFormState(saveGeneralSettings, { ok: false });
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Settings saved', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);

  const social = settings.social_links ?? {};
  const Toggle = ({ name, label }: { name: string; label: string }) => (
    <label className="flex items-center gap-2 text-sm text-ink-muted">
      <input type="checkbox" name={name} defaultChecked={settings[name]} disabled={!canEdit} className="h-4 w-4 rounded border-border text-brand" />
      {label}
    </label>
  );

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Brand">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="site_name">Site name</Label>
            <Input id="site_name" name="site_name" defaultValue={settings.site_name ?? 'CampusEduX'} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" name="tagline" defaultValue={settings.tagline ?? ''} disabled={!canEdit} />
          </div>
          <div>
            <Label>Logo</Label>
            <ImageUploader
              name="logo_url"
              bucket="site"
              pathPrefix="logo"
              defaultValue={settings.logo_url ?? ''}
              disabled={!canEdit}
              aspect="wide"
              helpText="App + panel logo · JPG, PNG or WebP"
            />
          </div>
          <div>
            <Label>Favicon</Label>
            <ImageUploader
              name="favicon_url"
              bucket="site"
              pathPrefix="favicon"
              defaultValue={settings.favicon_url ?? ''}
              disabled={!canEdit}
              aspect="square"
              helpText="Square icon · PNG or WebP"
            />
          </div>
        </div>
      </Section>

      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="admin_email">Admin email</Label>
            <Input id="admin_email" name="admin_email" type="email" defaultValue={settings.admin_email ?? ''} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="support_email">Support email</Label>
            <Input id="support_email" name="support_email" type="email" defaultValue={settings.support_email ?? ''} disabled={!canEdit} />
          </div>
          <div>
            <Label htmlFor="contact_phone">Contact phone</Label>
            <Input id="contact_phone" name="contact_phone" defaultValue={settings.contact_phone ?? ''} disabled={!canEdit} />
          </div>
        </div>
      </Section>

      <Section title="Social links">
        <div className="grid gap-4 sm:grid-cols-2">
          {['twitter', 'linkedin', 'instagram', 'youtube'].map((k) => (
            <div key={k}>
              <Label htmlFor={`social_${k}`}>{k[0].toUpperCase() + k.slice(1)}</Label>
              <Input id={`social_${k}`} name={`social_${k}`} defaultValue={social[k] ?? ''} placeholder="https://…" disabled={!canEdit} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Toggles">
        <div className="flex flex-col gap-3">
          <Toggle name="maintenance_mode" label="Maintenance mode (app shows a maintenance screen)" />
          <Toggle name="email_notifications" label="Send system email notifications" />
          <Toggle name="user_registration" label="Allow new user registration" />
          <Toggle name="allow_guest_access" label="Allow guest access (browse without an account)" />
        </div>
      </Section>

      {canEdit ? (
        <div className="flex justify-end">
          <div className="w-40">
            <SubmitButton pendingLabel="Saving…">Save settings</SubmitButton>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-faint">Read-only for your role.</p>
      )}
    </form>
  );
}
