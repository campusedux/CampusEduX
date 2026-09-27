import type { Metadata } from "next";
import { Button } from "@/components/ui";

// Every 404 (unmatched URL or a page calling notFound()) otherwise inherits the
// root layout's `alternates.canonical: "/"`, i.e. a 404 declaring the HOMEPAGE
// as its canonical. Clear it here; Next already adds `noindex` to 404s, and it's
// stated explicitly so it can't regress.
export const metadata: Metadata = {
  title: "Page not found",
  alternates: { canonical: null },
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-3xl font-bold text-ink">Page not found</h1>
      <p className="mt-3 text-ink-muted">The page you&apos;re looking for doesn&apos;t exist, or may have moved.</p>
      <div className="mt-6">
        <Button href="/">Back to home</Button>
      </div>
    </div>
  );
}
