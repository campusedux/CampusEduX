import { notFound } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { getStudent } from '@/lib/students/queries';
import { StudentHeader } from './StudentHeader';
import { StudentTabs } from './StudentTabs';

export const dynamic = 'force-dynamic';

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const admin = await requireModule('students');
  const student = await getStudent(params.id);
  if (!student) notFound();

  return (
    <div className="space-y-5">
      <StudentHeader student={student} canEdit={admin.perms.students.edit} />
      <StudentTabs id={params.id} />
      {children}
    </div>
  );
}
