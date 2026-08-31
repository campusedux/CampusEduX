import React from "react";
import { RootNavigator } from "@/navigation/RootNavigator";
import { useAuthBootstrap } from "@/auth/useAuthBootstrap";
import { useHydrateSettingsFromServer } from "@/hooks/useSettings";

/**
 * Thin re-export so App.tsx doesn't need to know navigation's internal
 * folder layout. Also:
 *  - restores the Supabase session on startup and keeps it in sync
 *    (useAuthBootstrap), and
 *  - hydrates the local settings store from Supabase once per session so
 *    preferences follow the user across devices.
 */
export function Navigation() {
  useAuthBootstrap();
  useHydrateSettingsFromServer();
  return <RootNavigator />;
}

export default Navigation;
