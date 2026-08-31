import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { WithdrawalQueue } from '../../orders/WithdrawalQueue';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wallet Requests · CampusEduX Admin' };

export default function ReferralWalletRequestsPage({ searchParams }: { searchParams: { page?: string; status?: string } }) {
  return (
    <div className="space-y-2">
      <Link href="/referrals" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> Referral & Wallet
      </Link>
      <WithdrawalQueue basePath="/referrals/wallet-requests" searchParams={searchParams} />
    </div>
  );
}
