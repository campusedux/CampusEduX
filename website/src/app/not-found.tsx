import { Button } from "@/components/ui";

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
