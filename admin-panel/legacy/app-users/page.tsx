import { Search } from 'lucide-react';
import { requireStaffUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, Badge, EmptyState, Input } from '@/components/ui/primitives';
import { formatDate } from '@/lib/utils';
import { RoleSelect } from '@/app/users/RoleSelect';

export const dynamic = 'force-dynamic';

export default async function UsersPage({ searchParams }: { searchParams: { q?: string } }) {
  const staff = await requireStaffUser();
  const isAdmin = staff.roleId === 'admin' || staff.roleId === 'super_admin';

  // RLS (002) only lets is_admin() read profiles other than their own — a
  // content_editor/manager session simply can't see this list, by design.
  if (!isAdmin) {
    return (
      <Card>
        <EmptyState title="Admins only" description="Only Admin and Super Admin accounts can view and manage users." />
      </Card>
    );
  }

  const supabase = createClient();
  let query = supabase
    .from('user_profiles')
    .select('id, full_name, email, role_id, college, deleted_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (searchParams.q) query = query.or(`full_name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`);

  const { data: users, error } = await query;
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Users</h1>
        <p className="text-sm text-ink-muted">{(users ?? []).length} shown</p>
      </div>

      <Card>
        <form className="mb-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <Input name="q" placeholder="Search by name or email…" defaultValue={searchParams.q} className="pl-9" />
          </div>
        </form>

        {!users || users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">College</th>
                <th className="pb-2 font-medium">Joined</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="py-2.5 font-medium text-ink">{user.full_name || '—'}</td>
                  <td className="py-2.5 text-ink-muted">{user.email}</td>
                  <td className="py-2.5 text-ink-muted">{user.college || '—'}</td>
                  <td className="py-2.5 text-ink-muted">{formatDate(user.created_at)}</td>
                  <td className="py-2.5">
                    {user.deleted_at ? (
                      <Badge label="Deletion pending" tone="danger" />
                    ) : (
                      <Badge label="Active" tone="success" />
                    )}
                  </td>
                  <td className="py-2.5">
                    <RoleSelect userId={user.id} roleId={user.role_id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
