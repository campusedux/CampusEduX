import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPublicSupabase } from "@/lib/supabase/server";
import type { FeatureRow } from "@/lib/customProjects";
import StepBar from "../_builder/StepBar";
import BuilderFeatures from "./BuilderFeatures";

export const metadata: Metadata = {
  title: "Choose features",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requireUser();

  const supabase = getPublicSupabase();
  let features: FeatureRow[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("custom_project_features")
      .select("id,name,description,category,project_types,project_levels,price,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    features = (data ?? []) as FeatureRow[];
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl text-ink">Features &amp; files</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Pick the features your project needs, and attach any requirement or reference files.
      </p>
      <div className="mt-8">
        <StepBar current={1} />
        {features.length === 0 ? (
          <div className="empty-state">
            The feature catalog isn&apos;t available right now.{" "}
            <Link href="/custom-projects/estimate" className="text-ink underline">
              Skip to the estimate
            </Link>
            .
          </div>
        ) : (
          <BuilderFeatures features={features} />
        )}
      </div>
    </div>
  );
}
