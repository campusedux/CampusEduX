import type { Metadata } from "next";
import { Suspense } from "react";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd } from "@/lib/seo";
import CompilerWorkspace from "@/app/compiler/CompilerWorkspace";
import { CompilerFallback } from "@/app/compiler/CompilerFallback";

/**
 * Practice → Online Compiler. Renders the exact same `CompilerWorkspace` as
 * `/compiler` — no compiler logic is duplicated — inside the Practice section so
 * it feels native there. The workspace draws its own "Practice › Online
 * Compiler" breadcrumb, so this route only adds the section metadata + JSON-LD.
 */
export const metadata: Metadata = {
  title: "Online Compiler",
  description:
    "Write and run code online with CampusEduX — Java, Python, JavaScript, C and C++ in a secure sandbox, straight from your browser.",
  alternates: { canonical: absoluteUrl("/practice/compiler") },
};

export default function PracticeCompilerPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Practice", path: "/practice" },
          { name: "Online Compiler", path: "/practice/compiler" },
        ])}
      />
      <Suspense fallback={<CompilerFallback />}>
        <CompilerWorkspace />
      </Suspense>
    </>
  );
}
