import type { Metadata } from "next";
import { Suspense } from "react";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import CompilerWorkspace from "./CompilerWorkspace";
import { CompilerFallback } from "./CompilerFallback";
import { compilerAuthRequired } from "@/lib/apiAuth";

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
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary",
    title: "Online Code Compiler | CampusEduX",
    description: "Write, run and practise programming code online with CampusEduX.",
  },
};

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
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Practice", path: "/practice" },
          { name: "Online Compiler", path: "/compiler" },
        ])}
      />
      <Suspense fallback={<CompilerFallback />}>
        <CompilerWorkspace requireAuth={compilerAuthRequired()} />
      </Suspense>
    </>
  );
}
