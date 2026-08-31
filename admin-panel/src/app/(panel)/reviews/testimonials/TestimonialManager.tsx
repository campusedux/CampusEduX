'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { Card, CardHeader, Label, Input, Select, Textarea, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { DeleteButton } from '@/components/ui/DeleteButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/toast';
import { DISPLAY_ON_PAGES } from '@/lib/cms/constants';
import { createTestimonial, updateTestimonial, deleteTestimonial } from '../actions';

type Result = { ok: boolean; error?: string };
interface T {
  id: string;
  author_name: string;
  author_role: string;
  avatar_url: string | null;
  rating: number;
  quote: string;
  display_on: string[];
  status: string;
  sort_order: number;
}

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

export function TestimonialManager({ items, perms }: { items: T[]; perms: { add: boolean; edit: boolean; delete: boolean } }) {
  return (
    <div className="space-y-5">
      {perms.add ? <AddForm /> : null}
      <Card>
        <CardHeader title={`Testimonials (${items.length})`} />
        {items.length === 0 ? (
          <EmptyState title="No testimonials" />
        ) : (
          <div className="space-y-3">
            {items.map((t) => (
              <Row key={t.id} t={t} perms={perms} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Fields({ t, disabled }: { t?: T; disabled?: boolean }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="author_name">Author</Label>
          <Input name="author_name" required defaultValue={t?.author_name ?? ''} disabled={disabled} />
        </div>
        <div>
          <Label htmlFor="author_role">Role</Label>
          <Input name="author_role" defaultValue={t?.author_role ?? ''} placeholder="B.Tech CSE, 2024" disabled={disabled} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="rating">Rating</Label>
            <Select name="rating" defaultValue={String(t?.rating ?? 5)} disabled={disabled}>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} ★
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sort_order">Sort</Label>
            <Input name="sort_order" type="number" defaultValue={t?.sort_order ?? 0} disabled={disabled} />
          </div>
        </div>
      </div>
      <div>
        <Label htmlFor="quote">Quote</Label>
        <Textarea name="quote" rows={2} required defaultValue={t?.quote ?? ''} disabled={disabled} />
      </div>
      <div>
        <Label>Avatar</Label>
        <ImageUploader
          name="avatar_url"
          bucket="admin-media"
          pathPrefix="testimonials"
          defaultValue={t?.avatar_url ?? ''}
          disabled={disabled}
          aspect="square"
          helpText="Author photo · JPG, PNG or WebP"
        />
      </div>
      <div>
        <Label>Display on</Label>
        <div className="flex flex-wrap gap-3">
          {DISPLAY_ON_PAGES.map((pg) => (
            <label key={pg} className="flex items-center gap-1.5 text-sm text-ink-muted">
              <input
                type="checkbox"
                name="display_on"
                value={pg}
                defaultChecked={t?.display_on?.includes(pg)}
                disabled={disabled}
                className="h-4 w-4 rounded border-border text-brand"
              />
              {pg}
            </label>
          ))}
        </div>
      </div>
      <Select name="status" defaultValue={t?.status ?? 'active'} disabled={disabled} className="w-32">
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="pending">Pending</option>
      </Select>
    </div>
  );
}

function AddForm() {
  const [state, action] = useFormState(createTestimonial, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="Add testimonial" />
      <form ref={ref} action={action} className="space-y-3">
        <Fields />
        <div className="flex justify-end">
          <div className="w-24">
            <SubmitButton pendingLabel="…">Add</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Row({ t, perms }: { t: T; perms: { edit: boolean; delete: boolean } }) {
  const [state, action] = useFormState(updateTestimonial.bind(null, t.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-warning">
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} size={13} fill="currentColor" />
          ))}
        </span>
        <div className="flex items-center gap-2">
          <Badge label={t.status} tone={t.status === 'active' ? 'success' : t.status === 'pending' ? 'warning' : 'neutral'} />
          {perms.delete ? <DeleteButton action={() => deleteTestimonial(t.id)} confirmMessage={`Delete testimonial from ${t.author_name}?`} /> : null}
        </div>
      </div>
      <form action={action} className="space-y-3">
        <Fields t={t} disabled={!perms.edit} />
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
