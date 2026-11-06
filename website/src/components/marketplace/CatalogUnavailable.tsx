import Link from "next/link";
import { ErrorState } from "@/components/ui/ErrorState";

export function CatalogUnavailable({ catalog, lastKnownCount }: { catalog: "projects" | "jobs"; lastKnownCount: number | null }) {
  return <div>
    <ErrorState title={`${catalog === "jobs" ? "Jobs" : "Projects"} temporarily unavailable`}
      message="We couldn’t check the catalog. Please try again shortly." />
    {lastKnownCount !== null && <p className="mt-3 text-center text-sm text-ink-muted">
      The last successful check found {lastKnownCount} {catalog}. Current availability is unconfirmed.
    </p>}
    <nav aria-label="Explore while the catalog recovers" className="mt-4 flex flex-wrap justify-center gap-3">
      <Link href={`/${catalog}`} className="btn-secondary min-h-11">Try again</Link>
      <Link href="/learning" className="btn-secondary min-h-11">Explore Learning</Link>
      <Link href={catalog === "jobs" ? "/projects" : "/jobs"} className="btn-secondary min-h-11">
        {catalog === "jobs" ? "Explore Projects" : "Explore Jobs"}
      </Link>
    </nav>
  </div>;
}
