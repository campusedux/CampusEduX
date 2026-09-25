"use client";

import { usePathname } from "next/navigation";
import { useSessionProfile } from "@/lib/useSessionProfile";

/**
 * Whether the visitor is known to be signed out (so Run/Submit should show the
 * "Sign in to run code" state before any request). While the session check is
 * loading we optimistically allow the request — a 401 is handled afterwards.
 */
export function useRunAccess(required = true): { anonymous: boolean; next: string } {
  const { loading, profile } = useSessionProfile();
  const pathname = usePathname() || "/";
  return { anonymous: required && !loading && !profile, next: pathname };
}
