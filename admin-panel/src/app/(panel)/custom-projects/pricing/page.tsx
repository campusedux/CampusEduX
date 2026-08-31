import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, EmptyState } from '@/components/ui/primitives';
import { getPricingConfig } from '@/lib/custom-projects/queries';
import { BasePriceRow, PlatformChargeRow } from './PricingForms';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Custom Project Pricing · CampusEduX Admin' };

export default async function PricingPage() {
  await requireModule('custom_projects');
  const { pricing, platforms } = await getPricingConfig();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/custom-projects" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Custom Projects
        </Link>
        <PageHeader title="Pricing" subtitle="Base prices, tokens and platform charges the mobile builder reads." />
      </div>

      <Card>
        <CardHeader
          title="Base price & token"
          description="The token amount is per project type — changing Standard ↔ Advanced must not change it. The server also enforces the spec constants (1,500 / 3,000 / 6,000)."
        />
        {pricing.length === 0 ? (
          <EmptyState title="No pricing rows" description="Apply migration 0033 to seed the 6 rows." />
        ) : (
          pricing.map((row) => (
            <BasePriceRow key={`${row.project_type}-${row.project_level}`} row={row as never} />
          ))
        )}
      </Card>

      <Card>
        <CardHeader title="Platform charges" description="Added on top of base + features in the estimate (spec §24)." />
        {platforms.length === 0 ? (
          <EmptyState title="No platform rows" description="Apply migration 0033 to seed them." />
        ) : (
          platforms.map((row) => <PlatformChargeRow key={row.platform} row={row as never} />)
        )}
      </Card>
    </div>
  );
}
