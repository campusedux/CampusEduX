import { create } from "zustand";
import { notify } from "@/lib/notify";
import { findConflict, isFeatureIncluded, resolveDependencies } from "@/services/customProjects.service";
import type {
  CustomFeature,
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
  /** Local preview URIs for uploaded files (path -> uri). Session-only; never saved to the draft. */
  previews: Record<string, string>;
  setPreview: (path: string, uri: string) => void;
  patch: (fields: Partial<CustomProjectBuilderConfig>) => void;
  setType: (t: CustomProjectType) => void;
  setLevel: (l: CustomProjectLevel) => void;
  setPlatform: (p: CustomPlatform) => void;
  /**
   * `features` is the full eligible-for-this-tier catalog, so conflicts and
   * dependencies can be checked/resolved the same way
   * website/src/app/custom-projects/features/BuilderFeatures.tsx does.
   */
  toggleFeature: (id: string, features: CustomFeature[]) => void;
  /** Drop selected feature ids that are no longer a valid paid add-on for the tier (incl. ones now included). */
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
  previews: {},

  setPreview: (path, uri) => set((s) => ({ previews: { ...s.previews, [path]: uri } })),

  patch: (fields) => set((s) => ({ config: { ...s.config, ...fields } })),

  setType: (projectType) =>
    set((s) => ({
      // switching type can invalidate the level's feature set — keep the config
      // but let the Features step prune. Level/platform are preserved (§37).
      config: { ...s.config, projectType },
    })),

  setLevel: (projectLevel) => set((s) => ({ config: { ...s.config, projectLevel } })),
  setPlatform: (platform) => set((s) => ({ config: { ...s.config, platform } })),

  toggleFeature: (id, features) =>
    set((s) => {
      const has = s.config.featureIds.includes(id);
      if (has) {
        return {
          config: { ...s.config, featureIds: s.config.featureIds.filter((f) => f !== id) },
        };
      }

      const feature = features.find((f) => f.id === id);

      // Same message as website/src/app/custom-projects/features/BuilderFeatures.tsx.
      const conflict = findConflict(s.config.featureIds, id, features);
      if (conflict && feature) {
        notify("Can't add this feature", `"${feature.name}" and "${conflict.name}" can't be enabled together.`);
        return s;
      }

      // A dependency that is already INCLUDED for this tier is satisfied for free —
      // never add it to the paid selection.
      const { projectType, projectLevel } = s.config;
      const resolved = resolveDependencies(s.config.featureIds, id, features);
      const added = resolved.added.filter((a) => !isFeatureIncluded(a, projectType, projectLevel));
      const withDeps = resolved.featureIds.filter(
        (fid) => !resolved.added.some((a) => a.id === fid && !added.includes(a))
      );
      const next = withDeps.includes(id) ? withDeps : [...withDeps, id];
      if (added.length > 0 && feature) {
        notify(
          "Feature added automatically",
          `"${feature.name}" requires ${added.map((a) => `"${a.name}"`).join(", ")}. ${
            added.length > 1 ? "They have" : "It has"
          } been enabled automatically.`
        );
      }
      return { config: { ...s.config, featureIds: next } };
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

  reset: () => set(() => ({ config: EMPTY_BUILDER_CONFIG, hydratedFromDraft: false, previews: {} })),
}));
