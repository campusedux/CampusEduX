import { notFound, redirect } from 'next/navigation';
import { requireModule } from '@/lib/auth';
import { PageHeader } from '@/components/ui/PageHeader';
import { StudentForm } from '../../StudentForm';
import { updateStudent } from '../../actions';
import { getStudent } from '@/lib/students/queries';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Edit Student · CampusEduX Admin' };

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const admin = await requireModule('students');
  if (!admin.perms.students.edit) redirect(`/students/${params.id}?error=no_access`);

  const student = await getStudent(params.id);
  if (!student) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Edit Student" subtitle={student.full_name || student.email} />
      <StudentForm
        mode="edit"
        action={updateStudent.bind(null, params.id)}
        cancelHref={`/students/${params.id}`}
        initial={{
          full_name: student.full_name,
          email: student.email,
          mobile_number: student.mobile_number,
          course: student.course,
          branch: student.branch,
          year: student.year,
          gender: student.gender,
          date_of_birth: student.date_of_birth,
          location: student.location,
          admin_notes: student.admin_notes,
          is_premium: student.is_premium,
        }}
      />
    </div>
  );
}
