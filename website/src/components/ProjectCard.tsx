import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Box, Gem } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { cn } from "@/lib/cn";
import { IMAGE_BLUR_DATA_URL } from "@/lib/image";

export type ProjectCardData = {
  id: string;
  title: string;
  category_name: string | null;
  tech_stack: string[] | null;
  price: number;
  original_price?: number | null;
  rating: number;
  review_count: number;
  thumbnail_url: string | null;
  is_premium: boolean;
  is_best_seller: boolean;
};

/**
 * Project card — mirrors `mobile-app/src/components/cards/ProjectCard.tsx`
 * (`featured` layout): white rounded-2xl card, image on top with a dark
 * translucent badge, tech line, rating + price + "View" chip footer.
 */
export function ProjectCard({ project, rank, className }: { project: ProjectCardData; rank?: number; className?: string }) {
  const techLine =
    (project.tech_stack ?? []).slice(0, 3).join(" • ") || project.category_name || "Project";
  const badge = project.is_premium ? "PREMIUM" : project.is_best_seller ? "BESTSELLER" : null;

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "card card-hover group block overflow-hidden",
        className,
      )}
    >
      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-primary-50">
        {project.thumbnail_url ? (
          <Image
            src={project.thumbnail_url}
            alt={project.title}
            fill
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
        ) : project.is_premium ? (
          <Gem className="h-10 w-10 text-primary" aria-hidden />
        ) : (
          <Box className="h-10 w-10 text-primary" aria-hidden />
        )}

        {typeof rank === "number" && (
          <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary text-xs font-bold text-white">
            {rank}
          </span>
        )}
        {badge && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[0.62rem] font-bold tracking-wide text-white">
            {badge}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="truncate text-[0.95rem] font-semibold tracking-tight text-ink group-hover:text-primary">
          {project.title}
        </h3>
        <p className="mt-1 truncate text-xs text-ink-faint">{techLine}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <Rating value={project.rating} count={project.review_count} size={13} showEmpty />
          <div className="flex items-center gap-2">
            <PriceDisplay price={project.price} originalPrice={project.original_price} size="sm" />
            <span className="inline-flex items-center gap-0.5 rounded-md bg-primary-50 px-2 py-1 text-[0.7rem] font-semibold text-primary">
              View
              <ArrowRight className="h-3 w-3" aria-hidden />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProjectCard;
