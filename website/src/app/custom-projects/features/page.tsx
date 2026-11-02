import { CustomProjectReadError } from "@/lib/customProjectReads";
import { LoadError } from "../_builder/LoadError";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadCatalog } from "@/lib/customProjects.server";
import FlowLayout from "../_builder/FlowLayout";
import BuilderFeatures from "./BuilderFeatures";

export const metadata: Metadata = {
  title: "Choose features",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requireUser();

  let result: Awaited<ReturnType<typeof loadCatalog>>;
  try {
    result = await loadCatalog();
  } catch (error) {
    if (!(error instanceof CustomProjectReadError)) throw error;
    return <FlowLayout current={1}><LoadError kind={error.kind} /></FlowLayout>;
  }
  const { pricing, platforms, features, catalogAvailable } = result;

  return (
    <FlowLayout current={1}>

      <p className="eyebrow">Step 2 · Project scope</p>
      <h1 className="mt-1 text-[25px] font-semibold leading-tight text-ink">Project features &amp; requirements</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-[15px]">
        Review mentoring guidance, select features, and upload project references. Confirm how your project will be used at checkout.
      </p>

      <div className="mt-5">
        <BuilderFeatures
          features={features}
          pricing={pricing}
          platforms={platforms}
          catalogAvailable={catalogAvailable}
        />
      </div>
    </FlowLayout>
  );
}
