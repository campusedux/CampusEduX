import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadCatalog } from "@/lib/customProjects.server";
import StepBar from "../_builder/StepBar";
import BuilderFeatures from "./BuilderFeatures";

export const metadata: Metadata = {
  title: "Choose features",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requireUser();

  const { pricing, platforms, features, catalogAvailable } = await loadCatalog();

  return (
    <div className="container-page py-10 md:py-14">
      <StepBar current={1} />

      <p className="eyebrow">Step 2 · Project scope</p>
      <h1 className="mt-2 text-[1.6rem] font-bold tracking-tight text-ink sm:text-3xl">Project features &amp; requirements</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-[15px]">
        Review your mentoring scope or choose features for a personal or
        business software project.
      </p>

      <div className="mt-8">
        <BuilderFeatures
          features={features}
          pricing={pricing}
          platforms={platforms}
          catalogAvailable={catalogAvailable}
        />
      </div>
    </div>
  );
}
