import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <StepBar current={1} />

      <p className="eyebrow">Step 2 · Project scope</p>
      <h1 className="mt-2 text-[1.6rem] font-bold tracking-tight text-ink sm:text-3xl">Project features &amp; requirements</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-[15px]">
        Your selected package already includes the essential functionality below. Review what&apos;s included, then
        add optional features if your project needs more.
      </p>

      <div className="mt-8">
        {!catalogAvailable || features.length === 0 ? (
          <div className="empty-state">
            The feature catalog isn&apos;t available right now.{" "}
            <Link href="/custom-projects/estimate" className="text-ink underline">
              Skip to the estimate
            </Link>
            .
          </div>
        ) : (
          <BuilderFeatures features={features} pricing={pricing} platforms={platforms} />
        )}
      </div>
    </div>
  );
}
