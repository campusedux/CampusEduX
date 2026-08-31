import { create } from "zustand";
import type { JobFilters } from "@/types";
import { DEFAULT_JOB_FILTERS } from "@/types";

interface JobFilterState {
  filters: JobFilters;
  setFilters: (filters: JobFilters) => void;
  resetFilters: () => void;
}

/**
 * Shared UI state between JobsDashboardScreen/SearchJobsScreen and
 * FilterJobsScreen, mirroring projectFilterStore.ts.
 */
export const useJobFilterStore = create<JobFilterState>((set) => ({
  filters: DEFAULT_JOB_FILTERS,
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: DEFAULT_JOB_FILTERS }),
}));
