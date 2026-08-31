import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-3xl text-ink">Page not found</h1>
      <p className="mt-3 text-ink-muted">The page you&apos;re looking for doesn&apos;t exist, or may have moved.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm text-white hover:bg-primary/90">Back to home</Link>
    </div>
  );
}
