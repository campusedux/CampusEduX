'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  Copy,
  Filter as FilterIcon,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Badge, StatusPill } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { cn, formatINR, formatDateTime } from '@/lib/utils';
import {
  ACTIVE_FILTER_OPTIONS,
  FEATURE_LEVELS,
  FEATURE_LEVEL_LABEL,
  FEATURE_LEVEL_TONE,
  FEATURE_SORT_OPTIONS,
  PROJECT_TYPE_LABEL,
  PROJECT_TYPE_TONE,
  type FeatureLevel,
} from '@/lib/custom-projects/constants';
import type { FeatureRow } from '@/lib/custom-projects/queries';
import {
  bulkUpdateFeatures,
  deleteFeature,
  duplicateFeature,
  toggleFeatureActive,
  type FeatureBulkAction,
} from '../actions';

const TYPES = ['academic', 'personal', 'business'] as const;

interface Perms {
  add: boolean;
  edit: boolean;
  delete: boolean;
}

export function FeatureCatalog({
  rows,
  categories,
  featureNames,
  perms,
}: {
  rows: FeatureRow[];
  categories: { id: string; name: string }[];
  featureNames: Record<string, string>;
  perms: Perms;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  // selection can't outlive the rows it points at (page / filter change)
  useEffect(() => {
    setSelected((prev) => {
      const ids = new Set(rows.map((r) => r.id));
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [rows]);

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === '') sp.delete(k);
        else sp.set(k, v);
      }
      sp.delete('page');
      startTransition(() => router.push(`${pathname}?${sp.toString()}`));
    },
    [params, pathname, router],
  );

  const runBulk = (input: {
    action: FeatureBulkAction;
    category?: string;
    level?: string;
    types?: string[];
  }) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (input.action === 'delete' && !window.confirm(`Delete ${ids.length} selected feature(s)? Existing request snapshots are kept.`)) {
      return;
    }
    startTransition(async () => {
      const res = await bulkUpdateFeatures({ ...input, ids });
      if (!res?.ok) {
        toast({ title: 'Bulk action failed', description: res?.error, variant: 'error' });
        return;
      }
      toast({ title: `Updated ${ids.length} feature(s)`, variant: 'success' });
      setSelected(new Set());
      router.refresh();
    });
  };

  const open = rows.find((r) => r.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <FilterBar params={params} categories={categories} setParams={setParams} pending={pending} />

      {selected.size > 0 ? (
        <BulkBar
          count={selected.size}
          categories={categories}
          perms={perms}
          pending={pending}
          onRun={runBulk}
          onClear={() => setSelected(new Set())}
        />
      ) : null}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
          <p className="text-sm font-semibold text-ink">No features match these filters</p>
          <p className="mt-1 max-w-sm text-sm text-ink-muted">
            Adjust the project type, category, level or price range — or clear the filters.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet: data table (spec §6 / §18) */}
          <div className="hidden overflow-x-auto rounded-card border border-border bg-white md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-ink-muted">
                  <th className="w-10 py-2.5 pl-4">
                    <input
                      type="checkbox"
                      aria-label="Select all on page"
                      className="h-4 w-4 rounded border-border text-brand"
                      checked={selected.size === rows.length}
                      ref={(el) => {
                        if (el) el.indeterminate = selected.size > 0 && selected.size < rows.length;
                      }}
                      onChange={(e) =>
                        setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())
                      }
                    />
                  </th>
                  <th className="py-2.5 font-medium">Feature</th>
                  <th className="py-2.5 font-medium">Category</th>
                  <th className="py-2.5 font-medium">Project types</th>
                  <th className="py-2.5 font-medium">Level</th>
                  <th className="py-2.5 font-medium">Price</th>
                  <th className="py-2.5 font-medium">Status</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() => setOpenId(f.id)}
                    className={cn(
                      'cursor-pointer border-t border-border first:border-t-0 odd:bg-surface-subtle/40 hover:bg-brand-light/30',
                      selected.has(f.id) && 'bg-brand-light/40',
                    )}
                  >
                    <td className="py-2.5 pl-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${f.name}`}
                        className="h-4 w-4 rounded border-border text-brand"
                        checked={selected.has(f.id)}
                        onChange={(e) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(f.id);
                            else next.delete(f.id);
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="py-2.5">
                      <p className="flex items-center gap-1.5 font-medium text-ink">
                        {f.icon ? <span className="text-ink-faint">{f.icon}</span> : null}
                        {f.name}
                      </p>
                      <p className="font-mono text-xs text-ink-faint">{f.id}</p>
                    </td>
                    <td className="py-2.5 text-ink-muted">{f.category}</td>
                    <td className="py-2.5">
                      <TypeBadges types={f.project_types} />
                    </td>
                    <td className="py-2.5">
                      <LevelBadge level={f.level} />
                    </td>
                    <td className="py-2.5 font-mono">{formatINR(Number(f.price))}</td>
                    <td className="py-2.5">
                      <StatusPill status={f.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-2.5 pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {perms.edit ? (
                          <Link
                            href={`/custom-projects/features/${f.id}/edit`}
                            aria-label="Edit"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-subtle hover:text-ink"
                          >
                            <Pencil size={15} />
                          </Link>
                        ) : null}
                        {perms.add ? (
                          <button
                            aria-label="Duplicate"
                            disabled={pending}
                            onClick={() => {
                              startTransition(async () => {
                                const res = await duplicateFeature(f.id);
                                if (!res?.ok) {
                                  toast({ title: 'Duplicate failed', description: res?.error, variant: 'error' });
                                  return;
                                }
                                toast({ title: 'Feature duplicated', description: 'The copy starts inactive.', variant: 'success' });
                                router.refresh();
                              });
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-subtle hover:text-ink disabled:opacity-40"
                          >
                            <Copy size={15} />
                          </button>
                        ) : null}
                        {perms.delete ? (
                          <button
                            aria-label="Delete"
                            disabled={pending}
                            onClick={() => {
                              if (!window.confirm(`Delete "${f.name}"? Existing requests keep their frozen snapshot.`)) return;
                              startTransition(async () => {
                                const res = await deleteFeature(f.id);
                                if (!res?.ok) {
                                  toast({ title: 'Delete failed', description: res?.error, variant: 'error' });
                                  return;
                                }
                                toast({ title: 'Feature deleted', variant: 'success' });
                                if (openId === f.id) setOpenId(null);
                                router.refresh();
                              });
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: feature cards (spec §18) */}
          <div className="space-y-2 md:hidden">
            {rows.map((f) => (
              <div
                key={f.id}
                className={cn(
                  'rounded-card border border-border bg-white p-4',
                  selected.has(f.id) && 'border-brand/40 bg-brand-light/30',
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    aria-label={`Select ${f.name}`}
                    className="mt-1 h-4 w-4 rounded border-border text-brand"
                    checked={selected.has(f.id)}
                    onChange={(e) => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(f.id);
                        else next.delete(f.id);
                        return next;
                      });
                    }}
                  />
                  <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(f.id)}>
                    <p className="flex items-center gap-1.5 font-medium text-ink">
                      {f.icon ? <span className="text-ink-faint">{f.icon}</span> : null}
                      {f.name}
                    </p>
                    <p className="font-mono text-xs text-ink-faint">{f.id}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge label={f.category} tone="neutral" />
                      <LevelBadge level={f.level} />
                      <TypeBadges types={f.project_types} />
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <span className="font-mono text-ink">{formatINR(Number(f.price))}</span>
                      <StatusPill status={f.is_active ? 'active' : 'inactive'} />
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {open ? (
        <DetailsDrawer
          feature={open}
          featureNames={featureNames}
          perms={perms}
          pending={pending}
          onClose={() => setOpenId(null)}
          onToggleActive={(next) => {
            startTransition(async () => {
              const res = await toggleFeatureActive(open.id, next);
              if (!res?.ok) {
                toast({ title: 'Update failed', description: res?.error, variant: 'error' });
                return;
              }
              toast({ title: next ? 'Feature activated' : 'Feature deactivated', variant: 'success' });
              router.refresh();
            });
          }}
          onDuplicate={() => {
            startTransition(async () => {
              const res = await duplicateFeature(open.id);
              if (!res?.ok) {
                toast({ title: 'Duplicate failed', description: res?.error, variant: 'error' });
                return;
              }
              toast({ title: 'Feature duplicated', description: 'The copy starts inactive.', variant: 'success' });
              router.refresh();
            });
          }}
          onDelete={() => {
            if (!window.confirm(`Delete "${open.name}"? Existing requests keep their frozen snapshot.`)) return;
            startTransition(async () => {
              const res = await deleteFeature(open.id);
              if (!res?.ok) {
                toast({ title: 'Delete failed', description: res?.error, variant: 'error' });
                return;
              }
              toast({ title: 'Feature deleted', variant: 'success' });
              setOpenId(null);
              router.refresh();
            });
          }}
        />
      ) : null}
    </div>
  );
}

// --- filter bar (spec §2 / §3) --------------------------------------

function FilterBar({
  params,
  categories,
  setParams,
  pending,
}: {
  params: URLSearchParams;
  categories: { id: string; name: string }[];
  setParams: (patch: Record<string, string | null>) => void;
  pending: boolean;
}) {
  const [q, setQ] = useState(params.get('q') ?? '');
  const [open, setOpen] = useState(
    () => ['category', 'level', 'active', 'priceMin', 'priceMax', 'sort'].some((k) => params.get(k)),
  );
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // debounce search-as-you-type → one navigation ~400ms after typing stops (spec §16 / §22)
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if ((params.get('q') ?? '') !== q.trim()) setParams({ q: q.trim() || null });
    }, 400);
    return () => clearTimeout(timer.current);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectCls =
    'h-9 rounded-lg border border-border bg-white px-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light';
  const activeFilters =
    ['category', 'level', 'active', 'priceMin', 'priceMax', 'sort'].filter((k) => params.get(k)).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, key or category…"
            className={cn(
              'h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint',
              'focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-light',
              pending && 'opacity-70',
            )}
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-ink',
            open || activeFilters ? 'bg-brand-light text-brand-dark' : 'bg-white hover:bg-surface-subtle',
          )}
        >
          <FilterIcon size={15} />
          Filters{activeFilters ? ` (${activeFilters})` : ''}
        </button>
        {activeFilters || params.get('q') ? (
          <button
            type="button"
            onClick={() => {
              setQ('');
              setParams({ q: null, category: null, level: null, active: null, priceMin: null, priceMax: null, sort: null });
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <X size={14} /> Clear
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="grid gap-3 rounded-lg border border-border bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
            Category
            <select
              className={selectCls}
              defaultValue={params.get('category') ?? ''}
              onChange={(e) => setParams({ category: e.target.value || null })}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
            Feature level
            <select
              className={selectCls}
              defaultValue={params.get('level') ?? ''}
              onChange={(e) => setParams({ level: e.target.value || null })}
            >
              <option value="">All levels</option>
              {FEATURE_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {FEATURE_LEVEL_LABEL[l]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
            Status
            <select
              className={selectCls}
              defaultValue={params.get('active') ?? ''}
              onChange={(e) => setParams({ active: e.target.value || null })}
            >
              <option value="">Active &amp; inactive</option>
              {ACTIVE_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-ink-muted">
            Sort by
            <select
              className={selectCls}
              defaultValue={params.get('sort') ?? 'sort'}
              onChange={(e) => setParams({ sort: e.target.value === 'sort' ? null : e.target.value })}
            >
              {FEATURE_SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-2 sm:col-span-2">
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-ink-muted">
              Min price (₹)
              <input
                type="number"
                min="0"
                defaultValue={params.get('priceMin') ?? ''}
                onBlur={(e) => setParams({ priceMin: e.target.value || null })}
                onKeyDown={(e) => e.key === 'Enter' && setParams({ priceMin: (e.target as HTMLInputElement).value || null })}
                className={cn(selectCls, 'w-full')}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-ink-muted">
              Max price (₹)
              <input
                type="number"
                min="0"
                defaultValue={params.get('priceMax') ?? ''}
                onBlur={(e) => setParams({ priceMax: e.target.value || null })}
                onKeyDown={(e) => e.key === 'Enter' && setParams({ priceMax: (e.target as HTMLInputElement).value || null })}
                className={cn(selectCls, 'w-full')}
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// --- bulk action bar (spec §9) -------------------------------------

function BulkBar({
  count,
  categories,
  perms,
  pending,
  onRun,
  onClear,
}: {
  count: number;
  categories: { id: string; name: string }[];
  perms: Perms;
  pending: boolean;
  onRun: (i: { action: FeatureBulkAction; category?: string; level?: string; types?: string[] }) => void;
  onClear: () => void;
}) {
  const [cat, setCat] = useState('');
  const [lvl, setLvl] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const selectCls =
    'h-8 rounded-lg border border-border bg-white px-2 text-xs text-ink focus:border-brand focus:outline-none';

  return (
    <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-card border border-brand/30 bg-brand-light/60 p-3 text-sm shadow-sm">
      <span className="font-semibold text-brand-dark">{count} selected</span>
      <button onClick={onClear} className="text-ink-muted hover:text-ink">
        Clear
      </button>
      <span className="mx-1 h-4 w-px bg-brand/30" />

      {perms.edit ? (
        <>
          <button
            disabled={pending}
            onClick={() => onRun({ action: 'activate' })}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle disabled:opacity-50"
          >
            <Check size={13} /> Activate
          </button>
          <button
            disabled={pending}
            onClick={() => onRun({ action: 'deactivate' })}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2.5 text-xs font-medium text-ink hover:bg-surface-subtle disabled:opacity-50"
          >
            Deactivate
          </button>

          <span className="inline-flex items-center gap-1">
            <select className={selectCls} value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              disabled={pending || !cat}
              onClick={() => onRun({ action: 'set_category', category: cat })}
              className="h-8 rounded-lg border border-border bg-white px-2 text-xs font-medium text-ink hover:bg-surface-subtle disabled:opacity-40"
            >
              Set
            </button>
          </span>

          <span className="inline-flex items-center gap-1">
            <select className={selectCls} value={lvl} onChange={(e) => setLvl(e.target.value)}>
              <option value="">Level…</option>
              {FEATURE_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {FEATURE_LEVEL_LABEL[l]}
                </option>
              ))}
            </select>
            <button
              disabled={pending || !lvl}
              onClick={() => onRun({ action: 'set_level', level: lvl })}
              className="h-8 rounded-lg border border-border bg-white px-2 text-xs font-medium text-ink hover:bg-surface-subtle disabled:opacity-40"
            >
              Set
            </button>
          </span>

          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1">
            {TYPES.map((t) => (
              <label key={t} className="flex items-center gap-1 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-border text-brand"
                  checked={types.includes(t)}
                  onChange={() =>
                    setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
                  }
                />
                {PROJECT_TYPE_LABEL[t]}
              </label>
            ))}
            <button
              disabled={pending || types.length === 0}
              onClick={() => onRun({ action: 'assign_types', types })}
              className="h-7 rounded-lg border border-border px-2 text-xs font-medium text-ink hover:bg-surface-subtle disabled:opacity-40"
            >
              Assign
            </button>
          </span>
        </>
      ) : null}

      {perms.delete ? (
        <button
          disabled={pending}
          onClick={() => onRun({ action: 'delete' })}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-danger/30 bg-white px-2.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
        >
          <Trash2 size={13} /> Delete
        </button>
      ) : null}
    </div>
  );
}

// --- details drawer (spec §7) -------------------------------------

function DetailsDrawer({
  feature: f,
  featureNames,
  perms,
  pending,
  onClose,
  onToggleActive,
  onDuplicate,
  onDelete,
}: {
  feature: FeatureRow;
  featureNames: Record<string, string>;
  perms: Perms;
  pending: boolean;
  onClose: () => void;
  onToggleActive: (next: boolean) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="flex items-center gap-2 text-lg font-semibold text-ink">
              {f.icon ? <span className="text-ink-faint">{f.icon}</span> : null}
              {f.name}
            </p>
            <p className="font-mono text-xs text-ink-faint">{f.id}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-subtle hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {f.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.image_url} alt="" className="max-h-44 w-full border-b border-border object-cover" />
        ) : null}

        <div className="flex-1 space-y-4 p-5 text-sm">
          {f.description ? <p className="text-ink-muted">{f.description}</p> : null}

          <DrawerRow label="Category" value={f.category} />
          <DrawerRow
            label="Project types"
            value={<TypeBadges types={f.project_types} />}
          />
          <DrawerRow label="Feature level" value={<LevelBadge level={f.level} />} />
          <DrawerRow label="Project tiers" value={(f.project_levels ?? []).join(', ') || '—'} />
          <DrawerRow label="Price" value={<span className="font-mono">{formatINR(Number(f.price))}</span>} />
          <DrawerRow label="Status" value={<StatusPill status={f.is_active ? 'active' : 'inactive'} />} />
          <DrawerRow label="Sort order" value={String(f.sort_order)} />
          <DrawerRow label="Created" value={formatDateTime(f.created_at)} />
          <DrawerRow label="Updated" value={formatDateTime(f.updated_at)} />
          <DrawerRow
            label="Dependencies"
            value={
              (f.dependencies ?? []).length === 0 ? (
                '—'
              ) : (
                <div className="flex flex-wrap justify-end gap-1">
                  {(f.dependencies ?? []).map((d) => (
                    <Badge key={d} label={featureNames[d] ?? d} tone="neutral" />
                  ))}
                </div>
              )
            }
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border p-5">
          {perms.edit ? (
            <Link
              href={`/custom-projects/features/${f.id}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-white hover:bg-brand-dark"
            >
              <Pencil size={14} /> Edit
            </Link>
          ) : null}
          {perms.edit ? (
            <button
              disabled={pending}
              onClick={() => onToggleActive(!f.is_active)}
              className="inline-flex h-9 items-center rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-subtle disabled:opacity-50"
            >
              {f.is_active ? 'Deactivate' : 'Activate'}
            </button>
          ) : null}
          {perms.add ? (
            <button
              disabled={pending}
              onClick={onDuplicate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-subtle disabled:opacity-50"
            >
              <Copy size={14} /> Duplicate
            </button>
          ) : null}
          {perms.delete ? (
            <button
              disabled={pending}
              onClick={onDelete}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-danger/30 bg-white px-3 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              <Trash2 size={14} /> Delete
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function DrawerRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="max-w-[65%] break-words text-right font-medium text-ink">{value || '—'}</span>
    </div>
  );
}

function TypeBadges({ types }: { types: string[] | null }) {
  const list = types ?? [];
  if (list.length === 0) return <span className="text-ink-faint">—</span>;
  return (
    <span className="flex flex-wrap justify-end gap-1">
      {TYPES.filter((t) => list.includes(t)).map((t) => (
        <Badge key={t} label={PROJECT_TYPE_LABEL[t]} tone={PROJECT_TYPE_TONE[t]} />
      ))}
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  const l = (FEATURE_LEVELS as readonly string[]).includes(level) ? (level as FeatureLevel) : 'standard';
  return <Badge label={FEATURE_LEVEL_LABEL[l]} tone={FEATURE_LEVEL_TONE[l]} />;
}
