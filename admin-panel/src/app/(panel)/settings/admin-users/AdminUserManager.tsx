'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, Label, Input, Select, Badge, EmptyState } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { ADMIN_ROLES, ROLE_LABEL } from '@/lib/permissions';
import { formatDateTime } from '@/lib/utils';
import { createAdminUser, updateAdminUser } from '../actions';

type Result = { ok: boolean; error?: string };
interface AU {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
}

function useSaveToast(state: Result, reset?: () => void) {
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Saved', variant: 'success' });
      reset?.();
      router.refresh();
    }
  }, [state, toast, router, reset]);
}

export function AdminUserManager({ users, canManage }: { users: AU[]; canManage: boolean }) {
  return (
    <div className="space-y-5">
      {canManage ? <AddForm /> : null}
      <Card>
        <CardHeader title={`Admin users (${users.length})`} />
        {users.length === 0 ? (
          <EmptyState title="No admin users" description="Seed the first super_admin with supabase/seed_admin.sql." />
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <Row key={u.id} u={u} canManage={canManage} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function AddForm() {
  const [state, action] = useFormState(createAdminUser, { ok: false } as Result);
  const ref = useRef<HTMLFormElement>(null);
  useSaveToast(state, () => ref.current?.reset());
  return (
    <Card>
      <CardHeader title="Add admin user" description="Creates the login (email confirmation sent) and the staff role." />
      <form ref={ref} action={action} className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="full_name">Name</Label>
          <Input id="full_name" name="full_name" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" />
        </div>
        <div>
          <Label htmlFor="password">Temporary password</Label>
          <Input id="password" name="password" type="text" required minLength={8} placeholder="min 8 characters" />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" defaultValue="viewer">
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end">
          <div className="w-28">
            <SubmitButton pendingLabel="…">Add</SubmitButton>
          </div>
        </div>
      </form>
    </Card>
  );
}

function Row({ u, canManage }: { u: AU; canManage: boolean }) {
  const [state, action] = useFormState(updateAdminUser.bind(null, u.id), { ok: false } as Result);
  useSaveToast(state);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-ink">{u.email}</p>
          <p className="text-xs text-ink-faint">
            {u.last_login_at ? `last login ${formatDateTime(u.last_login_at)}` : 'never signed in'} · added{' '}
            {formatDateTime(u.created_at)}
          </p>
        </div>
        <Badge label={u.status} tone={u.status === 'active' ? 'success' : 'danger'} />
      </div>
      <form action={action} className="grid items-end gap-2 sm:grid-cols-4">
        <div>
          <Label htmlFor="full_name">Name</Label>
          <Input name="full_name" defaultValue={u.full_name} disabled={!canManage} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input name="phone" defaultValue={u.phone} disabled={!canManage} />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select name="role" defaultValue={u.role} disabled={!canManage}>
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <div className="flex items-end gap-2">
            <Select name="status" defaultValue={u.status} disabled={!canManage}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
            {canManage ? (
              <div className="w-20">
                <SubmitButton pendingLabel="…">Save</SubmitButton>
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
