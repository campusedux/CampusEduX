import { redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { StudentForm } from '../StudentForm';
import { createStudent } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Add Student · CampusEduX Admin' };

export default async function NewStudentPage() {
  const admin = await requireModule('students');
  if (!admin.perms.students.add) redirect('/students?error=no_access');

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Add Student" subtitle="Create a student account and fill in their academic profile." />
      <StudentForm mode="create" action={createStudent} cancelHref="/students" />
    </div>
  );
}
