import type { Metadata } from "next";
import { Suspense } from "react";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/seo";
import CompilerWorkspace from "./CompilerWorkspace";

export const metadata: Metadata = {
  title: "Online Code Compiler",
  description:
    "Write, run and practise programming code online with CampusEduX — Java, Python, JavaScript, C and C++ in a secure sandbox, straight from your browser.",
  alternates: { canonical: absoluteUrl("/compiler") },
  openGraph: {
    title: "Online Code Compiler | CampusEduX",
    description: "Write, run and practise programming code online with CampusEduX.",
    url: absoluteUrl("/compiler"),
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Online Code Compiler | CampusEduX",
    description: "Write, run and practise programming code online with CampusEduX.",
  },
};

function Fallback() {
  return (
    <div className="container-page py-6">
      <div className="h-11 w-full max-w-md animate-pulse rounded-xl bg-line/70" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="h-[52vh] min-h-[320px] animate-pulse rounded-xl bg-line/50 lg:h-[62vh]" />
        <div className="h-[52vh] min-h-[320px] animate-pulse rounded-xl bg-line/50 lg:h-[62vh]" />
      </div>
    </div>
  );
}

export default function CompilerPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "CampusEduX Compiler",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          url: absoluteUrl("/compiler"),
        }}
      />
      <Suspense fallback={<Fallback />}>
        <CompilerWorkspace />
      </Suspense>
    </>
  );
}
