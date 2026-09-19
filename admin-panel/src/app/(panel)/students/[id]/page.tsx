import { ShoppingCart, IndianRupee, Download, Wallet } from 'lucide-react';
import { getStudent, getStudentSummary } from '@/lib/students/queries';
import { Card, CardHeader } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { FlashToast } from '@/components/ui/FlashToast';
import { formatINR, formatDate, formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Student Details · CampusEduX Admin' };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value || '—'}</span>
    </div>
  );
}

export default async function StudentOverviewPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string; saved?: string; status?: string; warn?: string };
}) {
  const [student, summary] = await Promise.all([getStudent(params.id), getStudentSummary(params.id)]);
  if (!student) return null; // layout already handled notFound

  const flash = searchParams.created
    ? 'Student created'
    : searchParams.saved
      ? 'Changes saved'
      : searchParams.status
        ? 'Status updated'
        : null;

  return (
    <div className="space-y-5">
      {flash ? <FlashToast title={flash} /> : null}
      {searchParams.warn === 'auth_ban_skipped' ? (
        <FlashToast
          variant="info"
          title="Blocked at database level only"
          description="SUPABASE_SERVICE_ROLE_KEY is not set, so the Auth-level ban was skipped (DB-level block still enforced)."
        />
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders" value={formatNumber(summary.orders)} icon={ShoppingCart} />
        <StatCard label="Total spend" value={formatINR(summary.spend)} icon={IndianRupee} tone="success" />
        <StatCard label="Downloads" value={formatNumber(summary.downloads)} icon={Download} tone="info" />
        <StatCard label="Wallet balance" value={formatINR(summary.walletBalance)} icon={Wallet} tone="brand" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Academic information" />
          <Row label="Course" value={student.course} />
          <Row label="Branch" value={student.branch} />
          <Row label="Year" value={student.year} />
          <Row label="Location" value={student.location} />
        </Card>

        <Card>
          <CardHeader title="Account information" />
          <Row label="Email" value={student.email} />
          <Row label="Phone" value={student.mobile_number} />
          <Row label="Gender" value={student.gender} />
          <Row label="Date of birth" value={student.date_of_birth ? formatDate(student.date_of_birth) : null} />
          <Row label="Plan" value={student.is_premium ? 'Premium' : 'Free'} />
          <Row label="Referral code" value={student.referral_code} />
          <Row label="Joined" value={formatDate(student.created_at)} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Placement activity" />
          <Row label="Tests attempted" value={formatNumber(summary.testsAttempted)} />
          <Row label="DSA problems solved" value={formatNumber(summary.problemsSolved)} />
        </Card>

        {student.status === 'blocked' ? (
          <Card className="border-danger/30 bg-danger/5">
            <CardHeader title="Account blocked" />
            <Row label="Reason" value={student.blocked_reason} />
            <Row label="Blocked at" value={student.blocked_at ? formatDate(student.blocked_at) : null} />
            {student.admin_notes ? <Row label="Notes" value={student.admin_notes} /> : null}
          </Card>
        ) : student.admin_notes ? (
          <Card>
            <CardHeader title="Admin notes" />
            <p className="whitespace-pre-wrap text-sm text-ink-muted">{student.admin_notes}</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
