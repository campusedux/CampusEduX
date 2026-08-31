import { create } from "zustand";
import type {
  CustomPlatform,
  CustomProjectBuilderConfig,
  CustomProjectLevel,
  CustomProjectType,
  CustomReferenceFileInput,
} from "@/types";

export const EMPTY_BUILDER_CONFIG: CustomProjectBuilderConfig = {
  projectType: null,
  projectLevel: null,
  platform: null,
  title: "",
  objective: "",
  problemStatement: "",
  description: "",
  targetUsers: "",
  technologyPreference: "",
  featureIds: [],
  customRequirements: [],
  projectImagePath: null,
  referenceFiles: [],
};

interface BuilderState {
  config: CustomProjectBuilderConfig;
  /** Whether the store has been seeded from a saved draft this session. */
  hydratedFromDraft: boolean;
  patch: (fields: Partial<CustomProjectBuilderConfig>) => void;
  setType: (t: CustomProjectType) => void;
  setLevel: (l: CustomProjectLevel) => void;
  setPlatform: (p: CustomPlatform) => void;
  toggleFeature: (id: string) => void;
  /** Drop any selected feature ids that are no longer valid for the tier. */
  pruneFeatures: (validIds: string[]) => void;
  addRequirement: (text: string) => void;
  removeRequirement: (index: number) => void;
  addReferenceFile: (file: CustomReferenceFileInput) => void;
  removeReferenceFile: (path: string) => void;
  hydrate: (draft: Partial<CustomProjectBuilderConfig> | null) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  config: EMPTY_BUILDER_CONFIG,
  hydratedFromDraft: false,

  patch: (fields) => set((s) => ({ config: { ...s.config, ...fields } })),

  setType: (projectType) =>
    set((s) => ({
      // switching type can invalidate the level's feature set — keep the config
      // but let the Features step prune. Level/platform are preserved (§37).
      config: { ...s.config, projectType },
    })),

  setLevel: (projectLevel) => set((s) => ({ config: { ...s.config, projectLevel } })),
  setPlatform: (platform) => set((s) => ({ config: { ...s.config, platform } })),

  toggleFeature: (id) =>
    set((s) => {
      const has = s.config.featureIds.includes(id);
      return {
        config: {
          ...s.config,
          featureIds: has
            ? s.config.featureIds.filter((f) => f !== id)
            : [...s.config.featureIds, id],
        },
      };
    }),

  pruneFeatures: (validIds) =>
    set((s) => {
      const kept = s.config.featureIds.filter((f) => validIds.includes(f));
      return kept.length === s.config.featureIds.length
        ? s
        : { config: { ...s.config, featureIds: kept } };
    }),

  addRequirement: (text) =>
    set((s) => {
      const trimmed = text.trim();
      if (!trimmed) return s;
      return {
        config: {
          ...s.config,
          customRequirements: [...s.config.customRequirements, { text: trimmed }],
        },
      };
    }),

  removeRequirement: (index) =>
    set((s) => ({
      config: {
        ...s.config,
        customRequirements: s.config.customRequirements.filter((_, i) => i !== index),
      },
    })),

  addReferenceFile: (file) =>
    set((s) => ({
      config: { ...s.config, referenceFiles: [...s.config.referenceFiles, file] },
    })),

  removeReferenceFile: (path) =>
    set((s) => ({
      config: {
        ...s.config,
        referenceFiles: s.config.referenceFiles.filter((f) => f.path !== path),
      },
    })),

  hydrate: (draft) =>
    set(() => ({
      config: { ...EMPTY_BUILDER_CONFIG, ...(draft ?? {}) },
      hydratedFromDraft: true,
    })),

  reset: () => set(() => ({ config: EMPTY_BUILDER_CONFIG, hydratedFromDraft: false })),
}));
