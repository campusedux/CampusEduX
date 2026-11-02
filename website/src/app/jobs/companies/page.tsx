import type { Metadata } from "next";
import { getCompaniesWithOpenRoles } from "@/lib/cache";
import { Building2 } from "lucide-react";
import { Breadcrumb, CompanyCard, type CompanyCardData, EmptyState } from "@/components/ui";
import { absoluteUrl, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

const DESCRIPTION =
  "See which companies are hiring on CampusEduX and browse each employer's live job and internship openings in one place.";

export const revalidate = 0;

async function getCompanies(): Promise<CompanyCardData[]> {
  return getCompaniesWithOpenRoles();
}

export async function generateMetadata(): Promise<Metadata> {
  const companies = await getCompanies().catch(() => null);
  return {
    // Absolute: the layout's " | CampusEduX" template would repeat the brand.
    title: { absolute: "Companies Hiring on CampusEduX" },
    description: DESCRIPTION,
    alternates: { canonical: absoluteUrl("/jobs/companies") },
    openGraph: {
      title: "Companies hiring on CampusEduX",
      description: DESCRIPTION,
      url: absoluteUrl("/jobs/companies"),
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    // No companies listed yet -> don't index an empty shell page.
    robots: !companies?.length ? { index: false, follow: true } : undefined,
  };
}

export default async function CompaniesPage() {
  const companies = await getCompanies();
  return (
    <div className="page-shell">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Jobs", path: "/jobs" },
          { name: "Companies", path: "/jobs/companies" },
        ])}
      />
      <Breadcrumb className="mb-5" items={[{ label: "Jobs", href: "/jobs" }, { label: "Companies" }]} />
      <p className="eyebrow">Careers</p>
      <h1 className="h-hero mt-2">Companies hiring</h1>
      {companies.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Building2}
          title="No companies listed yet"
          subtitle="Employers appear here as soon as their first opening is published."
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3 2xl:grid-cols-4">
          {companies.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      )}
    </div>
  );
}
