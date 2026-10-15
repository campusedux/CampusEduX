"use client";

export default function SearchError({ reset }: { error: Error; reset: () => void }) {
  return <div className="page-shell py-16"><p>Search is temporarily unavailable.</p><button className="btn-primary mt-4" onClick={() => reset()}>Retry</button></div>;
}
