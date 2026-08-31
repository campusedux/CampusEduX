'use client';

import { useState, useTransition } from 'react';
import { Label, Input, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { createBanner, type BannerFormValues } from '@/app/banners/actions';

export function BannerForm() {
  const [values, setValues] = useState<Omit<BannerFormValues, 'storagePath'>>({
    title: '',
    placement: 'home_top',
    linkType: 'none',
    linkValue: null,
    sortOrder: 0,
    isActive: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!values.title.trim()) return setError('Title is required.');
    if (!file) return setError('A banner image is required.');
    setError(null);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const path = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('banners').upload(path, file);
        if (uploadError) throw uploadError;
        await createBanner({ ...values, storagePath: path });
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Title</Label>
          <Input value={values.title} onChange={(e) => set('title', e.target.value)} placeholder="Diwali Sale" />
        </div>

        <div className="col-span-2">
          <Label>Banner image</Label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-muted"
          />
        </div>

        <div>
          <Label>Placement</Label>
          <Select value={values.placement} onChange={(e) => set('placement', e.target.value as any)}>
            <option value="home_top">Home (top)</option>
            <option value="category_top">Category page (top)</option>
            <option value="checkout">Checkout</option>
          </Select>
        </div>
        <div>
          <Label>Sort order</Label>
          <Input type="number" value={values.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} />
        </div>

        <div>
          <Label>Link type</Label>
          <Select value={values.linkType} onChange={(e) => set('linkType', e.target.value as any)}>
            <option value="none">No link</option>
            <option value="project">Project</option>
            <option value="category">Category</option>
            <option value="branch">Branch</option>
            <option value="external_url">External URL</option>
          </Select>
        </div>
        <div>
          <Label>Link value (ID or URL)</Label>
          <Input value={values.linkValue ?? ''} onChange={(e) => set('linkValue', e.target.value || null)} />
        </div>

        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={values.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            Active
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Saving…' : 'Create banner'}
        </Button>
      </div>
    </div>
  );
}
