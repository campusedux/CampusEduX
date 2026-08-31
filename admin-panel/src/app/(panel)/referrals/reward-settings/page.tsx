import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { getRewardSettings } from '@/lib/referrals/queries';
import { RewardSettingsForm } from './RewardSettingsForm';
import { saveRewardSettings } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reward Settings · CampusEduX Admin' };

export default async function RewardSettingsPage() {
  const admin = await requireModule('referrals');
  const settings = await getRewardSettings();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/referrals" className="mb-2 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={14} /> Referral & Wallet
        </Link>
        <PageHeader title="Reward Settings" subtitle="How referral bonuses are calculated and paid." />
      </div>
      <RewardSettingsForm action={saveRewardSettings} initial={settings} canEdit={admin.perms.referrals.edit} />
    </div>
  );
}
