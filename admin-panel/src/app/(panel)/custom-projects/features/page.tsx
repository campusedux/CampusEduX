import Link from 'next/link';
import { ArrowLeft, GraduationCap, Layers, Plus, User, Briefcase, CheckCircle2, XCircle } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { Card, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { cn, formatNumber } from '@/lib/utils';
import {
  listFeatures,
  getFeatureFacetCounts,
  listFeatureCategories,
  listFeatureOptions,
  type FeatureListOpts,
} from '@/lib/custom-projects/queries';
import {
  FEATURES_PAGE_SIZE,
  FEATURE_CATEGORIES,
  FEATURE_LEVELS,
  FEATURE_LEVEL_LABEL,
} from '@/lib/custom-projects/constants';
import { FeatureCatalog } from './FeatureCatalog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Feature Catalog · CampusEduX Admin' };

const TYPE_TABS = [
  { value: '', label: 'All' },
  { value: 'academic', label: 'Academic' },
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
] as const;

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const admin = await requireModule('custom_projects');

  const opts: FeatureListOpts = {
    page: Math.max(1, Number(searchParams.page) || 1),
    q: (searchParams.q ?? '').trim() || undefined,
    type: searchParams.type || undefined,
    category: searchParams.category || undefined,
    level: searchParams.level || undefined,
    active: searchParams.active || undefined,
    priceMin: searchParams.priceMin ? Number(searchParams.priceMin) : undefined,
    priceMax: searchParams.priceMax ? Number(searchParams.priceMax) : undefined,
    sort: searchParams.sort || undefined,
  };

  const [{ rows, total, missing, page }, facets, { rows: catRows }, featureOptions] = await Promise.all([
    listFeatures(opts),
    getFeatureFacetCounts(opts),
    listFeatureCategories(),
    listFeatureOptions(),
  ]);

  const categories = catRows.length
    ? catRows.map((c) => ({ id: c.id, name: c.name }))
    : FEATURE_CATEGORIES.map((c) => ({ id: c, name: c }));
  const featureNames = Object.fromEntries(featureOptions.map((f) => [f.id, f.name]));

  // href builder that preserves the whole filter set
  const base: Record<string, string> = {};
  for (const k of ['q', 'type', 'category', 'level', 'active', 'priceMin', 'priceMax', 'sort'] as const) {
    if (opts[k as keyof FeatureListOpts]) base[k] = String(opts[k as keyof FeatureListOpts]);
  }
  const hrefWith = (patch: Record<string, string>) => {
    const sp = new URLSearchParams({ ...base, ...patch });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    const s = sp.toString();
    return s ? `/custom-projects/features?${s}` : '/custom-projects/features';
  };

  const paginationParams = { ...base };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/custom-projects"
          className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={14} /> Custom Projects
        </Link>
        <PageHeader
          title="Feature catalog"
          subtitle="One source of truth for the mobile builder — manage Academic, Personal and Business features, prices, levels and dependencies. Prices feed the estimate, never the token."
          action={
            <div className="flex gap-2">
              <Link href="/custom-projects/features/categories">
                <Button variant="secondary">Categories</Button>
              </Link>
              {admin.perms.custom_projects.add ? (
                <Link href="/custom-projects/features/new">
                  <Button>
                    <Plus size={16} /> Add feature
                  </Button>
                </Link>
              ) : null}
            </div>
          }
        />
      </div>

      {missing ? (
        <Card>
          <EmptyState
            title="Feature catalog isn’t available yet"
            description="Apply migration 0033 (feature table) and 0034 (level / dependencies / categories), then reload."
          />
        </Card>
      ) : (
        <>
          {/* Project-type tabs (spec §1) */}
          <div className="flex flex-wrap gap-1 border-b border-border">
            {TYPE_TABS.map((t) => {
              const activeTab = (opts.type ?? '') === t.value;
              return (
                <Link
                  key={t.value || 'all'}
                  href={hrefWith({ type: t.value })}
                  className={cn(
                    '-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                    activeTab
                      ? 'border-brand text-brand'
                      : 'border-transparent text-ink-muted hover:border-border hover:text-ink',
                  )}
                >
                  {t.label}
                  {t.value ? (
                    <span className="rounded-full bg-surface-subtle px-1.5 text-xs text-ink-muted">
                      {formatNumber(
                        facets.types[t.value as 'academic' | 'personal' | 'business'],
                      )}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>

          {/* Summary cards (spec §10) */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Academic" value={formatNumber(facets.types.academic)} icon={GraduationCap} tone="info" hint="features" />
            <StatCard label="Personal" value={formatNumber(facets.types.personal)} icon={User} tone="success" hint="features" />
            <StatCard label="Business" value={formatNumber(facets.types.business)} icon={Briefcase} tone="brand" hint="features" />
            <StatCard label="Active" value={formatNumber(facets.status.active)} icon={CheckCircle2} tone="success" hint="in the builder" />
            <StatCard label="Inactive" value={formatNumber(facets.status.inactive)} icon={XCircle} tone="danger" hint="hidden" />
          </div>

          {/* Level counts (spec §11) — clickable filters */}
          <div className="flex flex-wrap gap-2">
            {FEATURE_LEVELS.map((l) => {
              const on = opts.level === l;
              return (
                <Link
                  key={l}
                  href={hrefWith({ level: on ? '' : l })}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm',
                    on
                      ? 'border-brand bg-brand-light text-brand-dark'
                      : 'border-border bg-white text-ink-muted hover:bg-surface-subtle',
                  )}
                >
                  <Layers size={14} />
                  {FEATURE_LEVEL_LABEL[l]}
                  <span className="font-semibold text-ink">{formatNumber(facets.levels[l])}</span>
                </Link>
              );
            })}
          </div>

          <FeatureCatalog
            rows={rows}
            categories={categories}
            featureNames={featureNames}
            perms={{
              add: admin.perms.custom_projects.add,
              edit: admin.perms.custom_projects.edit,
              delete: admin.perms.custom_projects.delete,
            }}
          />

          <Pagination
            page={page}
            pageSize={FEATURES_PAGE_SIZE}
            total={total}
            basePath="/custom-projects/features"
            searchParams={paginationParams}
          />
        </>
      )}
    </div>
  );
}
