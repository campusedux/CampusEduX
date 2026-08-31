import Link from "next/link";
import Image from "next/image";
import { formatINR } from "@/lib/format";

export type ProjectCardData = {
  id: string;
  title: string;
  category_name: string | null;
  tech_stack: string[] | null;
  price: number;
  rating: number;
  review_count: number;
  thumbnail_url: string | null;
  is_premium: boolean;
  is_best_seller: boolean;
};

export default function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block overflow-hidden border border-navy/10 bg-white transition hover:border-navy/30"
    >
      <div className="relative aspect-[4/3] bg-navy/5">
        {project.thumbnail_url ? (
          <Image
            src={project.thumbnail_url}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate">No preview image</div>
        )}
        {project.is_premium && (
          <span className="absolute left-2 top-2 rounded-sm bg-marigold px-2 py-0.5 text-[0.65rem] font-semibold text-navy">
            Premium
          </span>
        )}
        {project.is_best_seller && !project.is_premium && (
          <span className="absolute left-2 top-2 rounded-sm bg-emerald px-2 py-0.5 text-[0.65rem] font-semibold text-white">
            Best seller
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-slate">{project.category_name || "Uncategorised"}</div>
        <h3 className="mt-1 font-serif text-base text-navy group-hover:text-marigold">{project.title}</h3>
        <div className="mt-2 flex flex-wrap gap-1">
          {(project.tech_stack ?? []).slice(0, 3).map((t) => (
            <span key={t} className="rounded-sm bg-paper px-1.5 py-0.5 text-[0.68rem] text-navy border border-navy/10">
              {t}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-navy">
            {project.rating > 0 ? `★ ${project.rating.toFixed(1)}` : "No ratings yet"}{" "}
            <span className="text-slate">({project.review_count})</span>
          </span>
          <span className="font-semibold text-navy">{project.price > 0 ? formatINR(project.price) : "Free"}</span>
        </div>
      </div>
    </Link>
  );
}
