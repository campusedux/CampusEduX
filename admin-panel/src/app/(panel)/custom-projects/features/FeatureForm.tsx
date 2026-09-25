'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useFormState } from 'react-dom';
import { Section, Label, Input, Select, Textarea, FieldError, Badge } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/components/ui/toast';
import {
  FEATURE_LEVELS,
  FEATURE_LEVEL_LABEL,
  INCLUDED_KEYS,
  PROJECT_TYPE_LABEL,
  type FeatureLevel,
} from '@/lib/custom-projects/constants';

type Result = { ok: boolean; error?: string };

export interface FeatureFormInitial {
  name?: string;
  key?: string;
  description?: string;
  category?: string;
  project_types?: string[];
  project_levels?: string[];
  level?: string;
  price?: number;
  icon?: string | null;
  image_url?: string | null;
  dependencies?: string[];
  included_in_levels?: string[];
  sort_order?: number;
  is_active?: boolean;
}

export interface FeatureOption {
  id: string;
  name: string;
  category: string;
}

const TYPES = ['academic', 'personal', 'business'] as const;
const TIERS = [
  ['standard', 'Standard'],
  ['advanced', 'Advanced'],
] as const;

const slugPreview = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);

export function FeatureForm({
  mode,
  action,
  initial = {},
  cancelHref,
  categories,
  featureOptions,
}: {
  mode: 'create' | 'edit';
  action: (prev: Result, fd: FormData) => Promise<Result>;
  initial?: FeatureFormInitial;
  cancelHref: string;
  categories: { id: string; name: string }[];
  featureOptions: FeatureOption[];
}) {
  const [state, formAction] = useFormState(action, { ok: false });
  const { toast } = useToast();
  useEffect(() => {
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
  }, [state, toast]);

  const [name, setName] = useState(initial.name ?? '');
  const [key, setKey] = useState(initial.key ?? '');
  const [category, setCategory] = useState(initial.category ?? '');
  const [types, setTypes] = useState<string[]>(
    initial.project_types ?? ['academic', 'personal', 'business'],
  );
  const [tiers, setTiers] = useState<string[]>(initial.project_levels ?? ['standard', 'advanced']);
  const [level, setLevel] = useState<string>(initial.level ?? 'standard');
  const [price, setPrice] = useState<number>(initial.price ?? 0);
  const [deps, setDeps] = useState<string[]>(initial.dependencies ?? []);
  const [included, setIncluded] = useState<string[]>(initial.included_in_levels ?? []);
  const [imageUrl, setImageUrl] = useState<string>(initial.image_url ?? '');

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  // category list always includes the row's current value even if inactive/removed
  const categoryOptions = useMemo(() => {
    const names = categories.map((c) => c.name);
    if (initial.category && !names.includes(initial.category)) names.unshift(initial.category);
    return names;
  }, [categories, initial.category]);

  // dependency picker: group by category, keep it scannable
  const depGroups = useMemo(() => {
    const map = new Map<string, FeatureOption[]>();
    for (const f of featureOptions) {
      const g = map.get(f.category) ?? [];
      g.push(f);
      map.set(f.category, g);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [featureOptions]);

  const errors = {
    name: name.trim() ? '' : 'Feature name is required.',
    category: category.trim() ? '' : 'Category is required.',
    types: types.length ? '' : 'Select at least one project type.',
    level: (FEATURE_LEVELS as readonly string[]).includes(level) ? '' : 'Choose a feature level.',
    price: Number.isFinite(price) && price >= 0 ? '' : 'Price cannot be negative.',
    included: INCLUDED_KEYS.some((k) => {
      const [t, l] = k.split(':');
      return (
        included.includes(k) &&
        ((!types.includes(t) || !(tiers.length ? tiers : ['standard', 'advanced']).includes(l)) ||
          (l === 'standard' && !included.includes(`${t}:advanced`)))
      );
    })
      ? 'Included Standard must also be included in Advanced, and only for offered types/tiers.'
      : '',
    key:
      mode === 'create' && key.trim() && !slugPreview(key)
        ? 'Use letters, numbers and dashes.'
        : '',
  };
  const blocked = Object.values(errors).some(Boolean);

  return (
    <form action={formAction} className="space-y-5">
      <Section title="Feature">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Feature name</Label>
            <Input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
            <FieldError>{state.error && errors.name ? errors.name : undefined}</FieldError>
          </div>

          <div>
            <Label htmlFor="key">Feature key / slug</Label>
            {mode === 'create' ? (
              <>
                <Input
                  id="key"
                  name="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={name ? slugPreview(name) : 'auto from name'}
                />
                <p className="mt-1 text-xs text-ink-faint">
                  Unique, permanent. Leave blank to auto-generate
                  {key.trim() ? ` → ${slugPreview(key)}` : name ? ` → ${slugPreview(name)}-xxxx` : ''}.
                </p>
                <FieldError>{errors.key || undefined}</FieldError>
              </>
            ) : (
              <>
                <Input value={initial.key ?? ''} disabled />
                <p className="mt-1 text-xs text-ink-faint">
                  The key is permanent — existing request snapshots reference it.
                </p>
              </>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select a category…</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
            <FieldError>{state.error && errors.category ? errors.category : undefined}</FieldError>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={initial.description ?? ''}
            />
          </div>

          <div>
            <Label htmlFor="price">Price (₹)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="1"
              value={Number.isNaN(price) ? '' : price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <FieldError>{errors.price || undefined}</FieldError>
          </div>

          <div>
            <Label htmlFor="sort_order">Sort order</Label>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              step="1"
              defaultValue={initial.sort_order ?? 0}
            />
          </div>

          <div>
            <Label htmlFor="icon">Icon (optional)</Label>
            <Input
              id="icon"
              name="icon"
              defaultValue={initial.icon ?? ''}
              placeholder="lucide name or emoji"
            />
          </div>

          <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={initial.is_active ?? true}
              className="h-4 w-4 rounded border-border text-brand"
            />
            Active (selectable in the builder)
          </label>
        </div>
      </Section>

      <Section
        title="Project types & level"
        description="Which projects can pick this feature, and its tier (spec §4 / §5)."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Project types</Label>
            <div className="flex flex-wrap gap-3">
              {TYPES.map((v) => (
                <label key={v} className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <input
                    type="checkbox"
                    name="project_types"
                    value={v}
                    checked={types.includes(v)}
                    onChange={() => toggle(types, setTypes, v)}
                    className="h-4 w-4 rounded border-border text-brand"
                  />
                  {PROJECT_TYPE_LABEL[v]}
                </label>
              ))}
            </div>
            <FieldError>{state.error && errors.types ? errors.types : undefined}</FieldError>
          </div>

          <div>
            <Label>Feature level</Label>
            <div className="flex flex-wrap gap-3">
              {FEATURE_LEVELS.map((v) => (
                <label key={v} className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <input
                    type="radio"
                    name="level"
                    value={v}
                    checked={level === v}
                    onChange={() => setLevel(v)}
                    className="h-4 w-4 border-border text-brand"
                  />
                  {FEATURE_LEVEL_LABEL[v as FeatureLevel]}
                </label>
              ))}
            </div>
          </div>
        </div>

        <details className="mt-4 rounded-lg border border-border bg-surface-subtle/50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-ink-muted">
            Advanced: project tier availability
          </summary>
          <p className="mb-2 mt-2 text-xs text-ink-faint">
            Which project tiers (Standard / Advanced) the builder offers this feature for. Both by
            default.
          </p>
          <div className="flex flex-wrap gap-3">
            {TIERS.map(([v, l]) => (
              <label key={v} className="flex items-center gap-1.5 text-sm text-ink-muted">
                <input
                  type="checkbox"
                  name="project_levels"
                  value={v}
                  checked={tiers.includes(v)}
                  onChange={() => toggle(tiers, setTiers, v)}
                  className="h-4 w-4 rounded border-border text-brand"
                />
                {l}
              </label>
            ))}
          </div>
        </details>
      </Section>

      <Section
        title="Included by default"
        description="Tick the project type + tier combos that get this feature free. Included features are read-only in the builder and are never charged, whatever the price above says. Advanced must include everything Standard does."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {TYPES.map((t) => (
            <div key={t} className="rounded-lg border border-border p-3">
              <p className="mb-2 text-sm font-medium text-ink">{PROJECT_TYPE_LABEL[t]}</p>
              {TIERS.map(([l, label]) => {
                const k = `${t}:${l}`;
                const offered = types.includes(t) && (tiers.length ? tiers : ['standard', 'advanced']).includes(l);
                return (
                  <label key={k} className="flex items-center gap-2 py-0.5 text-sm text-ink-muted">
                    <input
                      type="checkbox"
                      name="included_in_levels"
                      value={k}
                      disabled={!offered}
                      checked={offered && included.includes(k)}
                      onChange={() => toggle(included, setIncluded, k)}
                      className="h-4 w-4 rounded border-border text-brand"
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <FieldError>{errors.included || undefined}</FieldError>
      </Section>

      <Section title="Dependencies" description="Features this one needs. The builder warns when one is missing (spec §14).">
        {featureOptions.length === 0 ? (
          <p className="text-sm text-ink-faint">No other features to depend on yet.</p>
        ) : (
          <>
            {deps.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {deps.map((d) => {
                  const f = featureOptions.find((x) => x.id === d);
                  return <Badge key={d} label={f ? f.name : d} tone="brand" />;
                })}
              </div>
            ) : null}
            <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
              {depGroups.map(([cat, list]) => (
                <div key={cat}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {cat}
                  </p>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {list.map((f) => (
                      <label key={f.id} className="flex items-center gap-2 text-sm text-ink-muted">
                        <input
                          type="checkbox"
                          name="dependencies"
                          value={f.id}
                          checked={deps.includes(f.id)}
                          onChange={() => toggle(deps, setDeps, f.id)}
                          className="h-4 w-4 rounded border-border text-brand"
                        />
                        <span className="truncate">{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      <Section title="Feature image (optional)" description="Shown in the catalog and can be surfaced in the builder.">
        <ImageUploader
          name="image_url"
          bucket="admin-media"
          pathPrefix="custom-project-features"
          defaultValue={imageUrl}
          aspect="wide"
          helpText="Optional illustration · JPG, PNG or WebP"
          onUploaded={setImageUrl}
          onRemoved={() => setImageUrl('')}
        />
      </Section>

      <div className="flex items-center justify-end gap-2">
        <Link
          href={cancelHref}
          className="inline-flex h-10 items-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-ink hover:bg-surface-subtle"
        >
          Cancel
        </Link>
        <div className="w-40">
          <SubmitButton pendingLabel="Saving…" disabled={blocked}>
            {mode === 'create' ? 'Create feature' : 'Save changes'}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
