import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { WithdrawalQueue } from '../WithdrawalQueue';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wallet Requests · CampusEduX Admin' };

export default function OrdersWalletRequestsPage({ searchParams }: { searchParams: { page?: string; status?: string } }) {
  return (
    <div className="space-y-2">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={14} /> Orders
      </Link>
      <WithdrawalQueue basePath="/orders/wallet-requests" searchParams={searchParams} />
    </div>
  );
}
