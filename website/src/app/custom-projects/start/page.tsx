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
    <div className="container-prose py-10 sm:py-12">
      <StepBar current={0} />

      <div className="mt-6">
        <p className="eyebrow">Step 1 · Project details</p>
        <h1 className="mt-2 text-[1.9rem] font-bold leading-[1.12] tracking-tight text-ink sm:text-[2.35rem]">
          Let&apos;s build your idea
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-muted sm:text-base">
          Give it a name and tell us what it should do. We&apos;ll take care of the rest.
        </p>
      </div>

      <div className="mt-10">
        <BuilderStart />
      </div>
    </div>
  );
}
