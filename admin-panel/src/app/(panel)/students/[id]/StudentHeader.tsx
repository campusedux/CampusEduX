import Link from 'next/link';
import { Pencil, UserX } from 'lucide-react';
import { Badge, StatusPill } from '@/components/ui/primitives';
import { initials, formatDate } from '@/lib/utils';
import type { StudentDetail } from '@/lib/students/queries';

export function StudentHeader({ student, canEdit }: { student: StudentDetail; canEdit: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-card border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        {student.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={student.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-lg font-bold text-brand-dark">
            {initials(student.full_name)}
          </span>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-ink">{student.full_name || 'Unnamed student'}</h1>
            <StatusPill status={student.status ?? 'active'} />
            {student.is_premium ? <Badge label="Premium" tone="brand" /> : null}
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">
            {student.email} · {student.mobile_number || 'no phone'}
          </p>
          <p className="mt-0.5 text-xs text-ink-faint">
            Joined {formatDate(student.created_at)}
            {student.referral_code ? ` · Referral code ${student.referral_code}` : ''}
          </p>
        </div>
      </div>

      {canEdit ? (
        <div className="flex items-center gap-2">
          <Link
            href={`/students/${student.id}/edit`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
          >
            <Pencil size={14} /> Edit
          </Link>
          <Link
            href={`/students/${student.id}/block`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
          >
            <UserX size={14} /> {student.status === 'blocked' ? 'Unblock' : 'Block'}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
