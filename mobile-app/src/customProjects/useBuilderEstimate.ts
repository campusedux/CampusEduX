import { useEffect, useMemo } from "react";
import { useCustomFeatures, useCustomPricing } from "@/hooks/useCustomProjects";
import { calculateEstimate, getAdvancedOnlyFeatures, splitFeaturesFor } from "@/services/customProjects.service";
import { useBuilderStore } from "./builderStore";

/**
 * The ONE place every builder screen reads prices, included features and
 * add-ons from — all derived from `calculateEstimate`, so a number can never
 * differ between steps or from the estimate page.
 */
export function useBuilderEstimate() {
  const featuresQ = useCustomFeatures();
  const pricingQ = useCustomPricing();
  const config = useBuilderStore((s) => s.config);
  const pruneFeatures = useBuilderStore((s) => s.pruneFeatures);

  const features = featuresQ.data;
  const { projectType, projectLevel } = config;

  const split = useMemo(
    () => splitFeaturesFor(projectType, projectLevel, features ?? []),
    [projectType, projectLevel, features]
  );
  const lockedFeatures = useMemo(
    () => getAdvancedOnlyFeatures(projectType, projectLevel, features ?? []),
    [projectType, projectLevel, features]
  );

  // A previously-picked feature that is now included (or unavailable) for this tier is no longer a paid add-on.
  useEffect(() => {
    if (features && projectType && projectLevel) pruneFeatures(split.addOnCatalog.map((f) => f.id));
  }, [features, projectType, projectLevel, split.addOnCatalog, pruneFeatures]);

  const estimate = useMemo(
    () => calculateEstimate(config, pricingQ.data?.pricing ?? [], pricingQ.data?.platformPricing ?? [], features ?? []),
    [config, pricingQ.data, features]
  );

  return {
    config,
    estimate,
    included: split.included,
    addOnCatalog: split.addOnCatalog,
    lockedFeatures,
    allFeatures: features ?? [],
    pricing: pricingQ.data,
    isLoading: featuresQ.isLoading || pricingQ.isLoading,
    isError: featuresQ.isError || pricingQ.isError,
    refetch: () => {
      void featuresQ.refetch();
      void pricingQ.refetch();
    },
  };
}
