'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/primitives';
import { updateUserRole } from '@/app/users/actions';

const ROLES = [
  { id: 'user', label: 'User' },
  { id: 'content_editor', label: 'Content Editor' },
  { id: 'manager', label: 'Manager' },
  { id: 'admin', label: 'Admin' },
  { id: 'super_admin', label: 'Super Admin' },
] as const;

export function RoleSelect({ userId, roleId }: { userId: string; roleId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={roleId}
      disabled={isPending}
      className="h-8 w-40 text-xs"
      onChange={(e) =>
        startTransition(async () => {
          await updateUserRole(userId, e.target.value as any);
          router.refresh();
        })
      }
    >
      {ROLES.map((role) => (
        <option key={role.id} value={role.id}>
          {role.label}
        </option>
      ))}
    </Select>
  );
}
