import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { getStudent } from '@/lib/students/queries';
import { Section } from '@/components/ui/primitives';
import { FlashToast } from '@/components/ui/FlashToast';
import { BlockForm } from './BlockForm';
import { setStudentStatus } from '../../actions';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Block / Unblock Student · CampusEduX Admin' };

export default async function BlockStudentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { status?: string };
}) {
  const admin = await requireModule('students');
  if (!admin.perms.students.edit) redirect(`/students/${params.id}?error=no_access`);

  const student = await getStudent(params.id);
  if (!student) return null;
  const blocked = student.status === 'blocked';

  return (
    <div className="max-w-2xl space-y-5">
      {searchParams.status ? <FlashToast title={blocked ? 'Student blocked' : 'Student unblocked'} /> : null}

      {blocked ? (
        <div className="rounded-card border border-danger/30 bg-danger/5 p-4 text-sm">
          <p className="font-medium text-danger">Blocked {student.blocked_at ? `on ${formatDate(student.blocked_at)}` : ''}</p>
          {student.blocked_reason ? <p className="mt-1 text-ink-muted">Reason: {student.blocked_reason}</p> : null}
        </div>
      ) : null}

      <Section
        title={blocked ? 'Unblock student' : 'Block student'}
        description={
          blocked
            ? 'Restore this student’s access.'
            : 'A blocked student can’t sign in to the app. The reason is stored on the profile.'
        }
      >
        <BlockForm action={setStudentStatus.bind(null, params.id)} blocked={blocked} />
      </Section>
    </div>
  );
}
