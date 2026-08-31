import { useEffect, useRef } from "react";
import { customProjectsService } from "@/services/customProjects.service";
import { useAuthStore } from "@/store/authStore";
import { useBuilderStore } from "./builderStore";

/**
 * Debounced autosave of the in-progress builder config to
 * `custom_project_drafts` (spec §28 — saving a draft never triggers a payment).
 * Mounted once by every wizard step via <WizardScreen>, so navigating Back/Next
 * keeps persisting without any per-screen wiring. Only saves once a project
 * type has been picked, to avoid writing empty drafts.
 */
export function useBuilderAutosave() {
  const userId = useAuthStore((s) => s.user?.id);
  const config = useBuilderStore((s) => s.config);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId || !config.projectType) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      customProjectsService.saveDraft(userId, config).catch(() => undefined);
    }, 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [userId, config]);
}
