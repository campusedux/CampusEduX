import Link from "next/link";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type CompanyCardData = {
  id: string;
  name: string;
  logo_url?: string | null;
  open_jobs_count?: number | null;
  location?: string | null;
};

/** Company tile — logo tile + name + open-roles count. */
export function CompanyCard({ company, className }: { company: CompanyCardData; className?: string }) {
  const roles = company.open_jobs_count ?? 0;
  return (
    <Link
      href={`/jobs/companies/${company.id}`}
      className={cn("card card-hover card-pad group flex min-w-0 items-center gap-3", className)}
    >
      <span className="icon-box overflow-hidden bg-primary-50">
        {company.logo_url ? (
          <Image src={company.logo_url} alt={company.name} width={40} height={40} className="h-full w-full object-cover" />
        ) : (
          <Building2 className="text-primary" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink group-hover:text-primary">{company.name}</span>
        <span className="block truncate text-xs text-ink-muted">
          {roles > 0 ? `${roles} open role${roles > 1 ? "s" : ""}` : company.location || "View company"}
        </span>
      </span>
    </Link>
  );
}

export default CompanyCard;
