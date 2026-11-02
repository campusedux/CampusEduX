import { CustomProjectReadError } from "@/lib/customProjectReads";
import { LoadError } from "../_builder/LoadError";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadCatalog } from "@/lib/customProjects.server";
import FlowLayout from "../_builder/FlowLayout";
import BuilderStart from "./BuilderStart";

export const metadata: Metadata = {
  title: "Start a custom project",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requireUser();
  let result: Awaited<ReturnType<typeof loadCatalog>>;
  try {
    result = await loadCatalog();
  } catch (error) {
    if (!(error instanceof CustomProjectReadError)) throw error;
    return <FlowLayout current={0}><LoadError kind={error.kind} /></FlowLayout>;
  }
  const { pricing, platforms, features } = result;
  return (
    <FlowLayout current={0}>
      <div>

      <div className="mt-6">
        <p className="eyebrow">Step 1 · Project details</p>
        <h1 className="mt-1 text-[25px] font-semibold leading-tight text-ink">
          Let&apos;s build your idea
        </h1>
        <p className="mt-1 max-w-xl text-sm text-ink-muted">
          Give it a name and tell us what it should do. We&apos;ll take care of the rest.
        </p>
      </div>

      <div className="mt-5">
        <BuilderStart pricing={pricing} platforms={platforms} features={features} />
      </div>
      </div>
    </FlowLayout>
  );
}
