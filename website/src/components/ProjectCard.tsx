import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Box, Gem, Sparkles, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
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
 * Marketplace project card: thumbnail (or a tinted placeholder), category +
 * Premium / Bestseller badges, title, up to three tech tags, rating only when
 * real reviews exist, and the price — or a Free badge for ₹0.
 */
export function ProjectCard({ project, rank, className }: { project: ProjectCardData; rank?: number; className?: string }) {
  const tags = (project.tech_stack ?? []).filter(Boolean);
  const free = !(project.price > 0);

  return (
    <Link href={`/projects/${project.id}`} className={cn("card card-hover group flex min-w-0 flex-row overflow-hidden sm:flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2", className)}>
      <div className="relative flex w-24 shrink-0 items-center justify-center overflow-hidden bg-surface sm:aspect-[16/10] sm:w-auto">
        {project.thumbnail_url ? (
          <Image
            src={project.thumbnail_url}
            alt={project.title}
            fill
            placeholder="blur"
            blurDataURL={IMAGE_BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none"
            sizes="(max-width: 640px) 96px, (max-width: 1280px) 50vw, 25vw"
          />
        ) : (
          <>
            <span aria-hidden className="bg-grid absolute inset-0 opacity-70" />
            <div className="relative flex flex-col items-center gap-2 px-2 py-4 sm:px-4 sm:py-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card">
                {project.is_premium ? <Gem className="h-5 w-5 text-orange-400" aria-hidden /> : <Box className="h-5 w-5 text-orange-400" aria-hidden />}
              </span>
              <span className="text-center text-xs font-medium text-ink-muted">No preview available</span>
            </div>
          </>
        )}

        {typeof rank === "number" && (
          <span className="absolute bottom-3 left-3 flex h-8 w-8 sm:bottom-auto sm:top-3 items-center justify-center rounded-full bg-card text-xs font-bold text-ink shadow-card sm:bg-gradient-to-br sm:from-warning sm:to-accent-pink sm:text-white">
            #{rank}
          </span>
        )}

      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        {(project.is_premium || project.is_best_seller) && <div className="mb-2 flex min-w-0 flex-wrap gap-2">
          {project.is_premium && <Badge variant="pro"><Sparkles className="h-3 w-3 shrink-0" aria-hidden /> Premium</Badge>}
          {project.is_best_seller && <Badge variant="popular"><Trophy className="h-3 w-3 shrink-0" aria-hidden /> Bestseller</Badge>}
        </div>}
        {project.category_name && (
          <p className="truncate text-xs font-medium text-ink-muted">{project.category_name}</p>
        )}
        <h3 className="mt-1.5 line-clamp-2 break-words font-display text-base font-semibold leading-6 tracking-tight text-ink [overflow-wrap:anywhere] group-hover:text-primary">
          {project.title}
        </h3>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="max-w-full truncate rounded-md bg-surface px-2 py-1 text-xs font-medium text-ink-muted [overflow-wrap:anywhere]">
                {t}
              </span>
            ))}
            {tags.length > 3 && <span className="px-1 py-0.5 text-xs font-medium text-ink-faint">+{tags.length - 3}</span>}
          </div>
        )}
        <div className="mt-auto space-y-2 pt-3 sm:space-y-3 sm:pt-4">
          {project.review_count > 0 ? <Rating value={project.rating} count={project.review_count} size={13} /> : null}
          <div className="flex min-w-0 items-center justify-between gap-2 pt-1 sm:border-t sm:border-line sm:pt-3">
            {free ? (
              <Badge variant="free">Free</Badge>
            ) : (
              <PriceDisplay price={project.price} originalPrice={project.original_price} size="md" className="min-w-0 flex-wrap [&>span:first-child]:text-ink" />
            )}
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProjectCard;
