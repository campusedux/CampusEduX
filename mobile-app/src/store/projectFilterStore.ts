import { create } from "zustand";
import type { ProjectFilters } from "@/types";
import { DEFAULT_PROJECT_FILTERS } from "@/types";

interface ProjectFilterState {
  filters: ProjectFilters;
  setFilters: (filters: ProjectFilters) => void;
  resetFilters: () => void;
}

/**
 * Shared UI state between AllProjectsScreen and FilterProjectsScreen so the
 * filter sheet can write back without threading callbacks through
 * navigation params.
 */
export const useProjectFilterStore = create<ProjectFilterState>((set) => ({
  filters: DEFAULT_PROJECT_FILTERS,
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: DEFAULT_PROJECT_FILTERS }),
}));
