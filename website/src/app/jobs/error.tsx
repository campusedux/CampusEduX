"use client";

export default function CatalogError({ reset }: { error: Error; reset: () => void }) {
  return <div className="mx-auto max-w-3xl px-4 py-16"><p>Jobs are temporarily unavailable.</p><button className="btn-primary mt-4" onClick={() => reset()}>Retry</button></div>;
}
