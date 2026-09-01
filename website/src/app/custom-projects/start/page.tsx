import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import StepBar from "../_builder/StepBar";
import BuilderStart from "./BuilderStart";

export const metadata: Metadata = {
  title: "Start a custom project",
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold text-ink">Custom project request</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Tell us what you need. Your progress saves automatically — you can leave and come back.
      </p>
      <div className="mt-8">
        <StepBar current={0} />
        <BuilderStart />
      </div>
    </div>
  );
}
