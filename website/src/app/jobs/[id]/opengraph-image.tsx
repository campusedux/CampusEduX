import { getCachedJobDetail } from "@/lib/cache";
import { jobAvailability } from "@/lib/jobsActive";
import { renderOgCard } from "@/lib/ogImage";

export const alt = "CampusEduX job opening";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getCachedJobDetail(id).catch(() => null);
  if (!job || jobAvailability(job) !== "open") return renderOgCard({ title: "Jobs & Internships", eyebrow: "CampusEduX" });
  return renderOgCard({ title: job.title, eyebrow: job.company_name || job.company?.name || "Job opening" });
}
