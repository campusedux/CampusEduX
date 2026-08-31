'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/primitives';
import { SubmitButton } from '@/components/auth/SubmitButton';
import { useToast } from '@/components/ui/toast';
import { MODULES, MODULE_LABEL, type AdminRole, type PermissionMatrix, type PermAction } from '@/lib/permissions';
import { saveRoleMatrix } from '../actions';

type Result = { ok: boolean; error?: string };
const ACTIONS: PermAction[] = ['view', 'add', 'edit', 'delete'];

export function RoleMatrixEditor({
  role,
  matrix,
  canEdit,
}: {
  role: AdminRole;
  matrix: PermissionMatrix;
  canEdit: boolean;
}) {
  const [state, action] = useFormState(saveRoleMatrix.bind(null, role), { ok: false } as Result);
  const { toast } = useToast();
  const router = useRouter();
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast({ title: 'Could not save', description: state.error, variant: 'error' });
    else if (state.ok) {
      toast({ title: 'Permissions saved', description: 'Sidebar and button gating update on the next page load.', variant: 'success' });
      router.refresh();
    }
  }, [state, toast, router]);

  const locked = role === 'super_admin' || !canEdit;

  return (
    <form action={action}>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-muted">
                <th className="pb-2 font-medium">Module</th>
                {ACTIONS.map((a) => (
                  <th key={a} className="pb-2 text-center font-medium capitalize">
                    {a}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => (
                <tr key={m} className="border-t border-border">
                  <td className="py-2 text-ink">{MODULE_LABEL[m]}</td>
                  {ACTIONS.map((a) => (
                    <td key={a} className="py-2 text-center">
                      <input
                        type="checkbox"
                        name={`${m}.${a}`}
                        defaultChecked={role === 'super_admin' ? true : matrix[m][a]}
                        disabled={locked}
                        className="h-4 w-4 rounded border-border text-brand"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {locked ? (
        <p className="mt-3 text-sm text-ink-faint">
          {role === 'super_admin' ? 'Super Admin has every permission — this matrix is fixed.' : 'Read-only for your role.'}
        </p>
      ) : (
        <div className="mt-4 flex justify-end">
          <div className="w-48">
            <SubmitButton pendingLabel="Saving…">Save permissions</SubmitButton>
          </div>
        </div>
      )}
    </form>
  );
}
