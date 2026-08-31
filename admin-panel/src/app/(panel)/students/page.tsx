import Link from 'next/link';
import { Plus, Users, Crown, Ban, UserPlus, UserX } from 'lucide-react';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchFilterBar, FilterSelect } from '@/components/ui/SearchFilterBar';
import { Pagination } from '@/components/ui/Pagination';
import { Card, CardHeader, StatusPill, Badge, EmptyState } from '@/components/ui/primitives';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { RowActions, iconCls } from '@/components/ui/RowActions';
import { TrendChart } from '@/components/charts/TrendChart';
import { formatDate, initials, formatNumber } from '@/lib/utils';
import { listStudents, getStudentStats, getCourseOptions, STUDENT_PAGE_SIZE } from '@/lib/students/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Students · CampusEduX Admin' };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string; status?: string; premium?: string; course?: string };
}) {
  const admin = await requireModule('students');
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? '').trim();
  const status = searchParams.status ?? '';
  const premium = searchParams.premium ?? '';
  const course = searchParams.course ?? '';

  const [{ rows, total, missing }, stats, courses] = await Promise.all([
    listStudents({ page, q, status, premium, course }),
    getStudentStats(),
    getCourseOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle="Every student account on the platform — profiles, academics and status."
        action={
          admin.perms.students.add ? (
            <Link href="/students/new">
              <Button>
                <Plus size={16} /> Add Student
              </Button>
            </Link>
          ) : null
        }
      />

      <SearchFilterBar
        placeholder="Search name, email, phone or referral code…"
        filters={
          <>
            <FilterSelect
              name="status"
              label="Status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'blocked', label: 'Blocked' },
              ]}
            />
            <FilterSelect
              name="premium"
              label="Plan"
              options={[
                { value: 'yes', label: 'Premium' },
                { value: 'no', label: 'Free' },
              ]}
            />
            {courses.length ? (
              <FilterSelect
                name="course"
                label="Course"
                options={courses.map((c) => ({ value: c, label: c }))}
              />
            ) : null}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total students" value={formatNumber(stats.total)} icon={Users} />
        <StatCard label="Premium" value={formatNumber(stats.premium)} icon={Crown} tone="brand" />
        <StatCard label="Blocked" value={formatNumber(stats.blocked)} icon={Ban} tone="danger" />
        <StatCard
          label="New this month"
          value={formatNumber(stats.newThis)}
          icon={UserPlus}
          tone="info"
          current={stats.newThis}
          previous={stats.newLast}
        />
      </div>

      <Card>
        <CardHeader title="Sign-ups" description="New students, last 30 days" />
        <TrendChart data={stats.series} series={[{ key: 'signups', label: 'Sign-ups', color: '#4F39F6' }]} height={220} />
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No students found"
            description={
              missing
                ? 'The profiles table isn’t readable yet — apply admin migration 002 (admin RLS) and sign in as an admin.'
                : 'Try a different search or filter.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Phone</th>
                  <th className="pb-2 font-medium">Course · Branch</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Joined</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-t border-border odd:bg-surface-subtle/40">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-xs font-semibold text-brand-dark">
                          {initials(s.full_name)}
                        </span>
                        <div>
                          <Link href={`/students/${s.id}`} className="font-medium text-ink hover:text-brand">
                            {s.full_name || '—'}
                          </Link>
                          <p className="text-xs text-ink-faint">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-ink-muted">{s.mobile_number || '—'}</td>
                    <td className="py-2.5 text-ink-muted">
                      {[s.course, s.branch].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="py-2.5">
                      {s.is_premium ? <Badge label="Premium" tone="brand" /> : <Badge label="Free" tone="neutral" />}
                    </td>
                    <td className="py-2.5">
                      <StatusPill status={s.status ?? 'active'} />
                    </td>
                    <td className="py-2.5 text-ink-muted">{formatDate(s.created_at)}</td>
                    <td className="py-2.5">
                      <RowActions
                        viewHref={`/students/${s.id}`}
                        editHref={admin.perms.students.edit ? `/students/${s.id}/edit` : undefined}
                        extra={
                          admin.perms.students.edit ? (
                            <Link href={`/students/${s.id}/block`} aria-label="Block / unblock" className={iconCls}>
                              <UserX size={15} />
                            </Link>
                          ) : null
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3">
          <Pagination
            page={page}
            pageSize={STUDENT_PAGE_SIZE}
            total={total}
            basePath="/students"
            searchParams={{ q, status, premium, course }}
          />
        </div>
      </Card>
    </div>
  );
}
