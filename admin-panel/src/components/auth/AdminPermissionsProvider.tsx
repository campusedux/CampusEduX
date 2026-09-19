'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AdminRole, ModuleKey, PermAction, PermissionMatrix } from '@/lib/permissions';
import { canPerm, roleAllowed } from '@/lib/permission-gate';

interface Ctx {
  role: AdminRole | null;
  perms: PermissionMatrix | null;
}

const PermissionsContext = createContext<Ctx>({ role: null, perms: null });

/**
 * Exposes the current admin's role + role_permissions matrix (loaded once per
 * request in the panel layout) to client components. UX only — the server
 * re-checks every action.
 */
export function AdminPermissionsProvider({
  role,
  perms,
  children,
}: {
  role: AdminRole;
  perms: PermissionMatrix;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ role, perms }), [role, perms]);
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function useAdminPermissions(): Ctx {
  return useContext(PermissionsContext);
}

/** Fails closed (false) outside the provider. */
export function useCan(module: ModuleKey, action: PermAction): boolean {
  return canPerm(useContext(PermissionsContext).perms, module, action);
}

/** Role-guard equivalent for RPCs, e.g. `useCanAdminRole(MONEY_RPC_ROLES)`. */
export function useCanAdminRole(roles: readonly AdminRole[]): boolean {
  return roleAllowed(useContext(PermissionsContext).role, roles);
}
